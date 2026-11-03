// <kit-data-grid>: virtual rows, grid semantics, keyboard, sorting, search.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:8151/tests/harness.html');
  await page.evaluate(async () => {
    document.getElementById('app').innerHTML = '<kit-data-grid label="Things" style="--kit-data-grid-height: 300px; width: 700px"></kit-data-grid>';
    await import('/components/data-grid/data-grid.js');
    const g = document.querySelector('kit-data-grid');
    g.columns = [
      { key: 'name', label: 'Name', width: 160 },
      { key: 'count', label: 'Count', format: 'number', align: 'end', sort: 'number' },
      { key: 'tag', label: 'Tag', cell: (v) => { const b = document.createElement('b'); b.textContent = v; return b; } },
    ];
    g.rows = Array.from({ length: 50000 }, (_, i) => ({ name: `Item ${i + 1}`, count: (i * 7919) % 10007, tag: i % 3 ? 'plain' : 'café <x>' }));
    window.activated = [];
    g.addEventListener('rowactivate', (e) => window.activated.push(e.detail.row.name));
    await g.updateComplete;
    await new Promise((r) => requestAnimationFrame(r));
  });
});

const grid = (page) => page.getByRole('grid', { name: 'Things' });
const activeCell = (page) => grid(page).evaluate((g) => document.getElementById(g.getAttribute('aria-activedescendant'))?.textContent);

test('50,000 rows, but only the ones in view are in the page; counts are for the whole set', async ({ page }) => {
  await expect(grid(page)).toHaveAttribute('aria-rowcount', '50001');
  await expect(grid(page)).toHaveAttribute('aria-colcount', '3');
  const rendered = await page.locator('.kit-dg-body [role="row"]:not([hidden])').count();
  expect(rendered).toBeGreaterThan(5);
  expect(rendered).toBeLessThan(40);
  await expect(page.getByRole('columnheader')).toHaveText(['Name', 'Count', 'Tag']);
  await expect(page.locator('.kit-dg-foot')).toHaveText('50,000 rows');
  // Cell content from cell() is a node; its text is never parsed as HTML.
  await expect(page.locator('.kit-dg-body b').first()).toHaveText('café <x>');
  const axe = await new AxeBuilder({ page }).include('kit-data-grid').withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
});

test('the arrow keys, Page Down and Ctrl+End move the current cell and scroll it into view', async ({ page }) => {
  await grid(page).focus();
  expect(await activeCell(page)).toBe('Item 1');
  await page.keyboard.press('ArrowRight');
  expect(await activeCell(page)).toBe('0');
  await page.keyboard.press('ArrowDown');
  expect(await activeCell(page)).toBe('7,919');
  await page.keyboard.press('PageDown');
  const row = await grid(page).evaluate((g) => document.getElementById(g.getAttribute('aria-activedescendant')).parentElement.getAttribute('aria-rowindex'));
  expect(Number(row)).toBeGreaterThan(5);
  await page.keyboard.press('Control+End');
  await expect.poll(() => activeCell(page)).toBe('plain'); // row 50,000 is a plain one
  await page.keyboard.press('Home');
  expect(await activeCell(page)).toBe('Item 50000');
  await expect(grid(page)).toHaveAttribute('aria-activedescendant', /.+/);
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.activated)).toEqual(['Item 50000']);
});

test('headers sort, natural for text and numeric for numbers, and say so', async ({ page }) => {
  await page.getByRole('columnheader', { name: 'Count' }).click();
  await expect(page.getByRole('columnheader', { name: 'Count' })).toHaveAttribute('aria-sort', 'ascending');
  await expect(page.locator('.kit-dg-body [role="row"]:not([hidden])').first().locator('[aria-colindex="2"]')).toHaveText('0');
  await page.getByRole('columnheader', { name: 'Count' }).click();
  await expect(page.locator('.kit-dg-body [role="row"]:not([hidden])').first().locator('[aria-colindex="2"]')).toHaveText('10,006');
  // From the keyboard: up to the header row, across, and Enter.
  await grid(page).focus();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'ascending');
  await expect(page.locator('.kit-dg-body [role="row"]:not([hidden])').nth(1).locator('[aria-colindex="1"]')).toHaveText('Item 2');
  await expect.poll(() => page.evaluate(() => document.querySelector('[data-kit-live="polite"]')?.textContent)).toBe('Sorted by Name, ascending');
});

test('query keeps rows with every word; the count updates and is announced', async ({ page }) => {
  await page.evaluate(() => { document.querySelector('kit-data-grid').query = 'item 4999 cafe'; });
  await expect(page.locator('.kit-dg-foot')).toHaveText(/^\d+ of 50,000 rows$/);
  // Every word can match any column: "4999" in the name or the count.
  const rows = await page.locator('.kit-dg-body [role="row"]:not([hidden])').allTextContents();
  expect(rows.length).toBeGreaterThan(0);
  for (const r of rows) expect(r.replace(/,/g, '')).toMatch(/4999/);
  for (const r of rows) expect(r).toContain('café');
  await expect.poll(() => page.evaluate(() => document.querySelector('[data-kit-live="polite"]')?.textContent)).toMatch(/^\d+ rows?$/);
});

test('scrolling far down shows the right rows', async ({ page }) => {
  await grid(page).evaluate((g) => { g.scrollTop = 38 * 30000; });
  await expect.poll(() => page.locator('.kit-dg-body [role="row"]:not([hidden]) [aria-colindex="1"]').allTextContents()).toContain('Item 30001');
});
