// <kit-combobox>: enhancement of a select, filtering, keyboard, forms.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const harness = 'http://127.0.0.1:8151/tests/harness.html';
const markup = `
<form id="f">
  <label for="c">Fruit</label>
  <kit-combobox>
    <select class="kit-select" id="c" name="fruit" aria-describedby="h">
      <option value="">Choose a fruit</option>
      <option value="apple">Apple</option>
      <option value="apricot">Apricot</option>
      <option value="banana" selected>Banana</option>
      <option value="pineapple">Pineapple</option>
      <option value="cherry" disabled>Cherry</option>
      <option value="creme">Crème</option>
    </select>
  </kit-combobox>
  <p id="h">Hint</p>
  <button type="reset">Reset</button>
  <button id="next" type="button">Next</button>
</form>`;

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(harness);
  await page.evaluate(async (m) => {
    document.getElementById('app').innerHTML = m;
    await import('/components/combobox/combobox.js');
    await document.querySelector('kit-combobox').updateComplete;
    window.changes = [];
    document.querySelector('kit-combobox').addEventListener('change', (e) => window.changes.push(e.detail.value));
  }, markup);
});

const box = (page) => page.getByRole('combobox', { name: 'Fruit' });
const form = (page) => page.evaluate(() => new FormData(document.getElementById('f')).get('fruit'));

test('the select becomes a labelled combobox showing the current choice', async ({ page }) => {
  await expect(box(page)).toHaveValue('Banana');
  await expect(box(page)).toHaveAttribute('placeholder', 'Choose a fruit');
  await expect(box(page)).toHaveAccessibleDescription('Hint');
  await expect(page.locator('select')).toBeHidden();
  expect(await form(page)).toBe('banana');
  await box(page).click();
  await expect(page.getByRole('listbox', { name: 'Fruit' })).toBeVisible();
  await expect(page.getByRole('option')).toHaveCount(6);
  await expect(page.getByRole('option', { name: 'Banana' })).toHaveAttribute('aria-selected', 'true');
  const axe = await new AxeBuilder({ page }).include('form').withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
});

test('typing filters (starts-with first, accents ignored) and Enter chooses', async ({ page }) => {
  await box(page).fill('ap');
  await expect(page.getByRole('option')).toHaveText(['Apple', 'Apricot', 'Pineapple']);
  await expect(box(page)).toHaveAttribute('aria-activedescendant', /.+/);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(box(page)).toHaveValue('Apricot');
  expect(await form(page)).toBe('apricot');
  await box(page).fill('creme');
  await expect(page.getByRole('option')).toHaveText(['Crème']);
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.changes)).toEqual(['apricot', 'creme']);
});

test('no matches says so; Escape closes and restores, then clears', async ({ page }) => {
  await box(page).fill('zzz');
  await expect(page.getByText('No matches')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(box(page)).toHaveValue('Banana');
  await page.keyboard.press('Escape');
  await expect(box(page)).toHaveValue('');
  expect(await form(page)).toBe('');
});

test('arrows skip disabled options; leaving with an exact match chooses it, otherwise reverts', async ({ page }) => {
  await box(page).fill('');
  await page.keyboard.press('ArrowUp'); // already open from typing: moves up, wrapping to the end
  await expect(page.getByRole('option', { name: 'Crème' })).toHaveAttribute('data-active', '');
  await page.keyboard.press('ArrowUp'); // skips Cherry
  await expect(page.getByRole('option', { name: 'Pineapple' })).toHaveAttribute('data-active', '');
  await page.keyboard.press('Escape');
  await box(page).fill('APPLE');
  await page.mouse.click(700, 10); // somewhere empty
  expect(await form(page)).toBe('apple');
  await expect(box(page)).toHaveValue('Apple');
  await box(page).fill('zzz');
  await page.mouse.click(700, 10);
  await expect(box(page)).toHaveValue('Apple');
  expect(await form(page)).toBe('apple');
});

test('a click picks, Tab picks the highlighted option and moves on, and reset restores', async ({ page }) => {
  await box(page).click();
  await page.getByRole('option', { name: 'Pineapple' }).click();
  await expect(box(page)).toHaveValue('Pineapple');
  await expect(box(page)).toBeFocused();
  await box(page).fill('apr');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(box(page)).toHaveValue('Apricot');
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(box(page)).toHaveValue('Banana');
  expect(await form(page)).toBe('banana');
});
