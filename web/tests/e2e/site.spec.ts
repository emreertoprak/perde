import { expect, test, type ConsoleMessage, type Page } from '@playwright/test';

function collectProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message: ConsoleMessage) => {
    const text = message.text();
    if (message.type() === 'error' || /Content Security Policy|Refused to/i.test(text)) {
      problems.push(text);
    }
  });
  page.on('pageerror', (error) => problems.push(String(error)));
  return problems;
}

test.describe('kurumsal sayfa', () => {
  test('TR ana sayfa: dil, baslik, hreflang, JSON-LD ve temiz konsol', async ({ page }) => {
    const problems = collectProblems(page);
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText('Yaşam Alanlarınıza');

    await expect(page.locator('link[rel="alternate"][hreflang="tr"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);

    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLd).toContain('"@type":"Organization"');

    await page.waitForTimeout(1500);
    expect(problems).toEqual([]);
  });

  test('EN ana sayfa kendi dilinde yayinlanir', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toContainText('Designs That Touch');
    await expect(page.locator('#collections')).toBeVisible();
  });

  test('dil degistirici karsilik gelen bolume gider', async ({ page }) => {
    await page.goto('/#koleksiyonlar');
    const link = page.locator('[data-lang-switch]');
    await expect(link).toHaveAttribute('href', '/en#collections');
  });

  test('bolum baglantilari calisir', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Mobilde menu popover ile test ediliyor');
    await page.goto('/');
    await page.locator('nav a[data-nav-link="bayi-agi"]').click();
    await expect(page).toHaveURL(/#bayi-agi$/);
    await expect(page.locator('#bayi-agi')).toBeVisible();
  });

  test('yasal sayfalar ve 404 yayinlanir', async ({ page }) => {
    await page.goto('/kvkk');
    await expect(page.locator('h1')).toContainText('KVKK');
    await expect(page.locator('[data-navbar]')).toHaveAttribute('data-solid', '');

    await page.goto('/en/privacy-policy');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    const response = await page.goto('/404');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText('Sayfa bulunamadı');
  });
});

test.describe('bayi bulucu', () => {
  test('il secimi bayileri listeler ve URL durumunu yazar', async ({ page }) => {
    await page.goto('/#bayi-agi');

    const citySelect = page.locator('.finder select:not([disabled])').first();
    await citySelect.waitFor({ state: 'visible', timeout: 20_000 });
    await citySelect.selectOption({ label: 'İstanbul' });

    await expect(page.locator('.finder .dealer').first()).toBeVisible();
    await expect(page).toHaveURL(/city=istanbul/);

    const count = await page.locator('.finder .dealer').count();
    expect(count).toBeGreaterThan(3);

    const districtSelect = page.locator('.finder select').nth(1);
    await districtSelect.selectOption({ label: 'Kadıköy' });
    await expect(page).toHaveURL(/district=kadikoy/);
    await expect(page.locator('.finder .dealer')).toHaveCount(1);
  });

  test('harita secimi bulucu ile eslesir', async ({ page }) => {
    await page.goto('/#bayi-agi');
    await page
      .locator('.finder select:not([disabled])')
      .first()
      .waitFor({ state: 'visible', timeout: 20_000 });

    await page.locator('[data-turkey-map] .province[data-plate="6"]').click({ force: true });
    await expect(page.locator('.finder select').first()).toHaveValue('6');
    await expect(page.locator('[data-turkey-map] .province[data-plate="6"]')).toHaveAttribute(
      'data-selected',
      '',
    );
  });

  test('konum izniyle en yakin bayiler bulunur', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 39.92, longitude: 32.85 }); // Ankara

    await page.goto('/#bayi-agi');
    const locate = page.locator('.finder .locate:not([disabled])');
    await locate.waitFor({ state: 'visible', timeout: 20_000 });
    await locate.click();

    const firstDealer = page.locator('.finder .dealer').first();
    await expect(firstDealer).toBeVisible({ timeout: 15_000 });
    await expect(firstDealer).toContainText('Ankara');
    await expect(page.locator('.finder .dealer__distance').first()).toContainText('km');
  });
});
