// table-sort.js: header buttons, aria-sort, natural, number and date order.
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:8151/tests/harness.html');
  await page.evaluate(async () => {
    document.getElementById('app').innerHTML = `
      <table class="kit-table" data-sortable>
        <thead><tr><th>Name</th><th data-sort="number">Count</th><th data-sort="date">When</th><th data-sort="none">Notes</th></tr></thead>
        <tbody>
          <tr><td>Item 10</td><td data-value="5">5</td><td data-value="2026-02-01">1 Feb</td><td>a</td></tr>
          <tr><td>Item 2</td><td data-value="1200">1,200</td><td data-value="2025-12-01">1 Dec</td><td>b</td></tr>
          <tr><td>item 1</td><td data-value="40">40</td><td data-value="2026-01-01">1 Jan</td><td>c</td></tr>
        </tbody>
      </table>`;
    await import('/components/data-table/table-sort.js');
    await new Promise((r) => setTimeout(r));
  });
});

const names = (page) => page.locator('tbody tr td:first-child').allTextContents();

test('headers become sort buttons, except data-sort="none"', async ({ page }) => {
  await expect(page.getByRole('columnheader').getByRole('button')).toHaveCount(3);
  await expect(page.getByRole('columnheader', { name: 'Notes' }).getByRole('button')).toHaveCount(0);
});

test('text sorts naturally and ignores case; a second press reverses; it is announced', async ({ page }) => {
  await page.getByRole('button', { name: 'Name' }).click();
  expect(await names(page)).toEqual(['item 1', 'Item 2', 'Item 10']);
  await expect(page.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'ascending');
  await page.getByRole('button', { name: 'Name' }).click();
  expect(await names(page)).toEqual(['Item 10', 'Item 2', 'item 1']);
  await expect(page.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'descending');
  await expect.poll(() => page.evaluate(() => document.querySelector('[data-kit-live="polite"]')?.textContent)).toBe('Sorted by Name, descending');
});

test('numbers and dates sort by data-value; only one column is sorted at a time', async ({ page }) => {
  await page.getByRole('button', { name: 'Count' }).click();
  expect(await names(page)).toEqual(['Item 10', 'item 1', 'Item 2']);
  await page.getByRole('button', { name: 'When' }).click();
  expect(await names(page)).toEqual(['Item 2', 'item 1', 'Item 10']);
  await expect(page.getByRole('columnheader', { name: 'Count' })).not.toHaveAttribute('aria-sort', /./);
});
