// <kit-segmented>: roles, keyboard, events, forms and accessibility.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const harness = 'http://127.0.0.1:8151/tests/harness.html';

async function mount(page, markup) {
  await page.goto(harness);
  await page.evaluate(async (m) => {
    document.getElementById('app').innerHTML = m;
    await import('/components/segmented-control/segmented-control.js');
    await Promise.all([...document.querySelectorAll('kit-segmented')].map((el) => el.updateComplete));
  }, markup);
}

const group = `
<form id="f">
  <kit-segmented aria-label="Date range" name="range" value="7d">
    <button value="24h">24 hours</button>
    <button value="7d">7 days</button>
    <button value="30d">30 days</button>
  </kit-segmented>
  <button type="reset" id="reset">Reset</button>
</form>`;

test('it is a radio group: one checked option, and it is the only tab stop', async ({ page }) => {
  await mount(page, group);
  const seg = page.locator('kit-segmented');
  await expect(seg).toHaveAttribute('role', 'radiogroup');
  const radios = page.getByRole('radio');
  await expect(radios).toHaveCount(3);
  await expect(page.getByRole('radio', { name: '7 days' })).toHaveAttribute('aria-checked', 'true');
  expect(await radios.evaluateAll((bs) => bs.map((b) => b.tabIndex))).toEqual([-1, 0, -1]);
  const axe = await new AxeBuilder({ page }).include('kit-segmented').withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
});

test('arrows move and choose, Home and End jump, and change fires with the value', async ({ page }) => {
  await mount(page, group);
  await page.evaluate(() => { window.changes = []; document.querySelector('kit-segmented').addEventListener('change', (e) => window.changes.push(e.detail.value)); });
  await page.getByRole('radio', { name: '7 days' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: '30 days' })).toBeFocused();
  await expect(page.getByRole('radio', { name: '30 days' })).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('ArrowRight'); // wraps
  await expect(page.getByRole('radio', { name: '24 hours' })).toBeFocused();
  await page.keyboard.press('End');
  await page.keyboard.press('Home');
  await page.getByRole('radio', { name: '30 days' }).click();
  expect(await page.evaluate(() => window.changes)).toEqual(['30d', '24h', '30d', '24h', '30d']);
  await expect(page.locator('kit-segmented')).toHaveAttribute('value', '30d');
});

test('right-to-left pages swap the arrows', async ({ page }) => {
  await mount(page, `<div dir="rtl">${group}</div>`);
  await page.getByRole('radio', { name: '7 days' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('radio', { name: '30 days' })).toBeFocused();
});

test('it submits its value with the form, resets, and follows a disabled fieldset', async ({ page }) => {
  await mount(page, `<fieldset id="fs">${group}</fieldset>`);
  await page.getByRole('radio', { name: '30 days' }).click();
  expect(await page.evaluate(() => Object.fromEntries(new FormData(document.getElementById('f'))))).toEqual({ range: '30d' });
  await page.locator('#reset').click();
  await expect(page.getByRole('radio', { name: '7 days' })).toHaveAttribute('aria-checked', 'true');
  expect(await page.evaluate(() => new FormData(document.getElementById('f')).get('range'))).toBe('7d');
  await page.evaluate(() => { document.getElementById('fs').disabled = true; });
  await expect(page.getByRole('radio', { name: '24 hours' })).toBeDisabled();
  await page.evaluate(() => { document.getElementById('fs').disabled = false; });
  await expect(page.getByRole('radio', { name: '24 hours' })).toBeEnabled();
});

test('without a value it takes the server-checked option, else the first', async ({ page }) => {
  await mount(page, `
    <kit-segmented id="a" aria-label="A"><button>One</button><button aria-checked="true">Two</button></kit-segmented>
    <kit-segmented id="b" aria-label="B"><button>One</button><button>Two</button></kit-segmented>`);
  expect(await page.evaluate(() => [document.getElementById('a').value, document.getElementById('b').value])).toEqual(['Two', 'One']);
});

test('a group without an accessible name says so in the console', async ({ page }) => {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await mount(page, '<kit-segmented><button>One</button></kit-segmented>');
  expect(errors.join('\n')).toContain('needs an aria-label or aria-labelledby');
});
