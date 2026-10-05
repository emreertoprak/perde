import { expect, test } from '@playwright/test';

test.describe('hero perde', () => {
  test('yetenekli cihazda WebGL perde devreye girer', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'WebGL yalniz masaustu projesinde test edilir');

    await page.goto('/?tier=2');
    await page.waitForSelector('[data-hero][data-webgl-ready]', { timeout: 25_000 });
    await expect(page.locator('.hero-webgl canvas')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-hero-tier', '2');
  });

  test('reduced-motion: WebGL yuklenmez, icerik gorunur', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForTimeout(3000);

    await expect(page.locator('html')).toHaveAttribute('data-hero-tier', '0');
    await expect(page.locator('.hero-webgl canvas')).toHaveCount(0);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#hakkimizda h2')).toBeVisible();
  });

  test('T0 fallback: CSS perde gorunur ve scroll ile acilir', async ({ page }) => {
    await page.goto('/?tier=0');
    await expect(page.locator('.hero__curtains')).toBeVisible();

    const closed = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.hero')!).getPropertyValue('--curtain-open'),
    );
    await page.evaluate(() => window.scrollTo(0, window.innerHeight));
    await page.waitForTimeout(900);
    const opened = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.hero')!).getPropertyValue('--curtain-open'),
    );

    expect(Number(opened)).toBeGreaterThan(Number(closed));
  });

  test('JS olmadan icerik okunabilir', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#koleksiyonlar h2')).toBeVisible();
    await expect(page.locator('#ilham h2')).toBeVisible();
    await expect(page.locator('footer a[href="/kvkk"]')).toBeVisible();

    await context.close();
  });
});

test.describe('mobil', () => {
  test('popover menu acilir ve baglantilar calisir', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Yalniz mobil projede');

    await page.goto('/');
    await page.locator('.menu-button').click();
    await expect(page.locator('#site-menu')).toBeVisible();
    await page.locator('#site-menu a', { hasText: 'Bayi Ağı' }).click();
    await expect(page).toHaveURL(/#bayi-agi$/);
  });
});
