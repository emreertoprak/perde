/**
 * Gorsel QA: calisan sunucudan (varsayilan http://localhost:4321) ekran goruntusu alir.
 * Kullanim: node scripts/screenshots.mjs <cikti-dizini> [base-url]
 */
import { chromium } from '@playwright/test';

const out = process.argv[2] ?? './screenshots';
const base = process.argv[3] ?? 'http://localhost:4321';

const browser = await chromium.launch();
const errors = [];

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
desktop.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});
desktop.on('pageerror', (error) => errors.push(`pageerror: ${String(error)}`));

await desktop.goto(base, { waitUntil: 'networkidle' });
const height = await desktop.evaluate(() => document.body.scrollHeight);
console.log(`sayfa yuksekligi: ${height}px`);

const steps = 10;
for (let index = 0; index < steps; index += 1) {
  const y = Math.round((height - 900) * (index / (steps - 1)));
  await desktop.evaluate((value) => {
    window.scrollTo(0, value);
  }, y);
  await desktop.waitForTimeout(650);
  await desktop.screenshot({ path: `${out}/desktop-${String(index).padStart(2, '0')}.png` });
}

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
await mobile.goto(base, { waitUntil: 'networkidle' });
const mobileHeight = await mobile.evaluate(() => document.body.scrollHeight);
for (let index = 0; index < 6; index += 1) {
  const y = Math.round((mobileHeight - 844) * (index / 5));
  await mobile.evaluate((value) => {
    window.scrollTo(0, value);
  }, y);
  await mobile.waitForTimeout(600);
  await mobile.screenshot({ path: `${out}/mobile-${index}.png` });
}

console.log(errors.length > 0 ? `HATALAR:\n${errors.join('\n')}` : 'konsol hatasi yok');
await browser.close();
