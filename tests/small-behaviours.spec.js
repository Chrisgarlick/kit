// The small scripts: copy buttons, toggle buttons, progress rings, banners.
import { test, expect } from '@playwright/test';

const harness = 'http://127.0.0.1:8151/tests/harness.html';
async function mount(page, markup, mods) {
  await page.goto(harness);
  await page.evaluate(async ([m, mods]) => {
    document.getElementById('app').innerHTML = m;
    for (const x of mods) await import(x);
  }, [markup, mods]);
}
const live = (page) => page.evaluate(() => document.querySelector('[data-kit-live="polite"]')?.textContent);

test('copy: copies the text or the target, says Copied, then goes back', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only in Playwright');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await mount(page, '<button id="a" data-copy="hello">Copy</button><input id="t" value="from the field"><button id="b" data-copy-target="#t" aria-label="Copy value">⧉</button>', ['/components/copy-button/copy-button.js']);
  await page.locator('#a').click();
  await expect(page.locator('#a')).toHaveText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('hello');
  await expect.poll(() => live(page)).toBe('Copied');
  await page.locator('#b').click();
  await expect(page.locator('#b')).toHaveAttribute('aria-label', 'Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('from the field');
  await expect(page.locator('#a')).toHaveText('Copy', { timeout: 4000 });
  await expect(page.locator('#b')).toHaveAttribute('aria-label', 'Copy value');
});

test('toggle: flips aria-pressed; in an exclusive group exactly one stays pressed', async ({ page }) => {
  await mount(page, `<button id="solo" aria-pressed="false" data-toggle>Bold</button>
    <div data-exclusive><button id="x" aria-pressed="true" data-toggle>List</button><button id="y" aria-pressed="false" data-toggle>Board</button></div>`, ['/components/toggle-button/toggle-button.js']);
  await page.getByRole('button', { name: 'Bold' }).click();
  await expect(page.locator('#solo')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Bold' }).click();
  await expect(page.locator('#solo')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#y').click();
  await expect(page.locator('#x')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#y')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#y').click();
  await expect(page.locator('#y')).toHaveAttribute('aria-pressed', 'true');
});

test('ring: follows aria-valuenow, min and max', async ({ page }) => {
  await mount(page, '<div class="kit-ring" id="r" role="progressbar" aria-label="Upload" aria-valuenow="3" aria-valuemin="0" aria-valuemax="4"></div>', ['/components/progress-ring/progress-ring.js']);
  const ring = () => page.locator('#r').evaluate((el) => el.style.getPropertyValue('--kit-ring'));
  await expect.poll(ring).toBe('75%');
  await page.locator('#r').evaluate((el) => el.setAttribute('aria-valuenow', '1'));
  await expect.poll(ring).toBe('25%');
  await expect(page.getByRole('progressbar', { name: 'Upload' })).toBeVisible();
});

test('banner: dismissing hides it, moves focus to main, and remembers by id', async ({ page }) => {
  const banner = '<div class="kit-banner" role="region" aria-label="Notice" data-banner-id="t1"><p>Hello</p><button class="kit-banner-close" aria-label="Dismiss notice">×</button></div>';
  await mount(page, banner, ['/components/banner/banner.js']);
  await page.evaluate(() => localStorage.removeItem('kit-banner:t1'));
  await page.getByRole('button', { name: 'Dismiss notice' }).click();
  await expect(page.getByRole('region', { name: 'Notice' })).toBeHidden();
  await expect(page.locator('main')).toBeFocused();
  await mount(page, banner, ['/components/banner/banner.js']);
  await expect(page.getByRole('region', { name: 'Notice' })).toBeHidden();
  await page.evaluate(() => localStorage.removeItem('kit-banner:t1'));
});
