// ui.chrisgarlick.com, built and served by `kit site serve`: every page is
// accessible (axe, WCAG 2.2 AA) in light and dark, at desktop and phone
// widths and in every accent, with no script or CSP errors and no sideways
// scrolling.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// KIT_SITE_URL=https://ui.chrisgarlick.com runs the same checks against the live site.
const base = process.env.KIT_SITE_URL ?? 'http://127.0.0.1:8152';

async function sitePages(request) {
  const xml = await (await request.get(base + '/sitemap.xml')).text();
  return [...xml.matchAll(/<loc>[^<]*?(\/[^<]*)<\/loc>/g)].map((m) => m[1]).concat(['/no-such-page']);
}

async function check(page, path) {
  const problems = [];
  page.removeAllListeners('console');
  page.removeAllListeners('pageerror');
  page.on('pageerror', (e) => problems.push(`script error: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/status of 404/.test(m.text())) problems.push(`console: ${m.text()}`); });
  await page.goto(base + path);
  await page.waitForFunction(() => !document.querySelector(':not(:defined)'));
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  for (const v of axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact))) problems.push(`${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`);
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) problems.push('scrolls sideways');
  return problems.map((p) => `${path} ${p}`);
}

for (const [width, scheme] of [[1280, 'light'], [1280, 'dark'], [390, 'light'], [390, 'dark']]) {
  test(`every page at ${width}px in ${scheme}`, async ({ browser, request }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme });
    const page = await ctx.newPage();
    const problems = [];
    for (const path of await sitePages(request)) problems.push(...(await check(page, path)));
    await ctx.close();
    expect(problems).toEqual([]);
  });
}

for (const accent of ['indigo', 'amber', 'rose']) {
  test(`the ${accent} accent, light and dark`, async ({ browser }) => {
    const problems = [];
    for (const scheme of ['light', 'dark']) {
      const ctx = await browser.newContext({ colorScheme: scheme });
      await ctx.addInitScript((a) => localStorage.setItem('kit-accent', a), accent);
      const page = await ctx.newPage();
      for (const path of ['/', '/actions/', '/actions/segmented-control/', '/inputs/', '/feedback/', '/data-display/', '/navigation/sidebar/', '/foundations/']) problems.push(...(await check(page, path)));
      await ctx.close();
    }
    expect(problems).toEqual([]);
  });
}

test('the scheme control is a kit-segmented, and the choice survives a reload', async ({ page }) => {
  await page.goto(base + '/actions/');
  const scheme = page.getByRole('radiogroup', { name: 'Colour scheme' });
  await scheme.getByRole('radio', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('radiogroup', { name: 'Colour scheme' }).getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('radiogroup', { name: 'Colour scheme' }).getByRole('radio', { name: 'System' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./);
});

test('the segmented control demo reports its change event', async ({ page }) => {
  await page.goto(base + '/actions/segmented-control/');
  const demo = page.locator('.demo-large');
  await demo.getByRole('radio', { name: '7 days' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(demo.locator('#seg-out')).toHaveText("Showing Lumen's numbers for the last 30 days.");
});
