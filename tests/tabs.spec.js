// <kit-tabs>: roles, keyboard, activation, events and the no-script fallback.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const harness = 'http://127.0.0.1:8151/tests/harness.html';

async function mount(page, markup, load = true) {
  await page.goto(harness);
  await page.evaluate(async ([m, load]) => {
    document.getElementById('app').innerHTML = m;
    if (load) {
      await import('/components/tabs/tabs.js');
      await Promise.all([...document.querySelectorAll('kit-tabs')].map((el) => el.updateComplete));
    }
  }, [markup, load]);
}

const tabs = (attrs = '') => `
<kit-tabs ${attrs}>
  <div class="kit-tablist" aria-label="Sections">
    <button>One</button><button value="two">Two</button><button disabled>Off</button><button>Four</button>
  </div>
  <div>Panel one</div><div>Panel two</div><div>Panel off</div><div>Panel four</div>
</kit-tabs>`;

test('roles and wiring: one selected tab, its panel shown, the rest hidden', async ({ page }) => {
  await mount(page, tabs());
  await expect(page.getByRole('tablist', { name: 'Sections' })).toBeVisible();
  await expect(page.getByRole('tab')).toHaveCount(4);
  await expect(page.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toHaveCount(1);
  await expect(page.getByRole('tabpanel', { name: 'One' })).toHaveText('Panel one');
  expect(await page.getByRole('tab').evaluateAll((ts) => ts.map((t) => t.tabIndex))).toEqual([0, -1, -1, -1]);
  const axe = await new AxeBuilder({ page }).include('kit-tabs').withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
});

test('arrows choose as they move, skip disabled tabs, wrap; Home and End jump', async ({ page }) => {
  await mount(page, tabs());
  await page.evaluate(() => { window.changes = []; document.querySelector('kit-tabs').addEventListener('change', (e) => window.changes.push(e.detail.value)); });
  await page.getByRole('tab', { name: 'One' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Two' })).toBeFocused();
  await expect(page.getByRole('tabpanel')).toHaveText('Panel two');
  await page.keyboard.press('ArrowRight'); // skips "Off"
  await expect(page.getByRole('tab', { name: 'Four' })).toBeFocused();
  await page.keyboard.press('ArrowRight'); // wraps
  await expect(page.getByRole('tab', { name: 'One' })).toBeFocused();
  await page.keyboard.press('End');
  await page.keyboard.press('Home');
  await page.getByRole('tab', { name: 'Two' }).click();
  expect(await page.evaluate(() => window.changes)).toEqual(['two', 'Four', 'One', 'Four', 'One', 'two']);
  await expect(page.locator('kit-tabs')).toHaveAttribute('value', 'two');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('tabpanel')).toBeFocused();
});

test('manual activation: arrows move focus, Enter chooses', async ({ page }) => {
  await mount(page, tabs('activation="manual"'));
  await page.getByRole('tab', { name: 'One' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Two' })).toBeFocused();
  await expect(page.getByRole('tabpanel')).toHaveText('Panel one');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('tabpanel')).toHaveText('Panel two');
});

test('a value attribute picks the first tab shown; setting value switches', async ({ page }) => {
  await mount(page, tabs('value="Four"'));
  await expect(page.getByRole('tabpanel')).toHaveText('Panel four');
  await page.evaluate(() => { document.querySelector('kit-tabs').value = 'two'; });
  await expect(page.getByRole('tabpanel')).toHaveText('Panel two');
});

test('vertical tabs use up and down', async ({ page }) => {
  await mount(page, tabs('data-orientation="vertical"'));
  await expect(page.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
  await page.getByRole('tab', { name: 'One' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('tab', { name: 'Two' })).toBeFocused();
});

test('before the script runs, every panel is visible and the tabs are not', async ({ page }) => {
  await mount(page, tabs(), false);
  await page.evaluate(() => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = '/components/tabs/tabs.css';
    document.head.append(l);
    return new Promise((r) => { l.onload = r; });
  });
  await expect(page.locator('.kit-tablist')).toBeHidden();
  for (const t of ['Panel one', 'Panel two', 'Panel four']) await expect(page.getByText(t)).toBeVisible();
});
