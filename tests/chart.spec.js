// <kit-chart> and <kit-sparkline>: drawing from a table, the summary,
// keyboard values, the table toggle, script data and the scale maths.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const harness = 'http://127.0.0.1:8151/tests/harness.html';
const table = `<table><caption>Example</caption>
  <thead><tr><th>Month</th><th>A</th><th>B</th></tr></thead>
  <tbody><tr><th>Jan</th><td>10</td><td>5</td></tr><tr><th>Feb</th><td data-value="30">£30</td><td>15</td></tr><tr><th>Mar</th><td>20</td><td></td></tr></tbody></table>`;

async function mount(page, markup) {
  await page.goto(harness);
  await page.evaluate(async (m) => {
    document.getElementById('app').innerHTML = `<div style="width:600px">${m}</div>`;
    await import('/components/line-chart/chart.js');
    await import('/components/sparkline/sparkline.js');
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, markup);
}

test('a line chart is drawn from its table, named by the caption and summarised', async ({ page }) => {
  await mount(page, `<kit-chart type="line">${table}</kit-chart>`);
  const plot = page.getByRole('group', { name: 'Example' });
  await expect(plot).toBeVisible();
  await expect(page.locator('.kit-chart-line')).toHaveCount(2);
  await expect(plot).toHaveAccessibleDescription(/Line chart, 3 points from Jan to Mar\. A rose from 10 to 20, highest 30 \(Feb\), lowest 10 \(Jan\)\. B rose from 5 to 15/);
  await expect(page.locator('.kit-chart-legend li')).toHaveText(['A', 'B']);
  // The table is there for screen readers, out of sight until asked for.
  await expect(page.getByRole('table')).toHaveCount(1);
  const toggle = page.getByRole('button', { name: 'Show table' });
  await toggle.click();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hide table' })).toHaveAttribute('aria-expanded', 'true');
  const axe = await new AxeBuilder({ page }).include('kit-chart').withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
});

test('arrow keys move along the points and announce their values', async ({ page }) => {
  await mount(page, `<kit-chart type="line">${table}</kit-chart>`);
  await page.locator('.kit-chart-plot').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.kit-chart-tip')).toBeVisible();
  await expect(page.locator('.kit-chart-tip-label')).toHaveText('Jan');
  await page.keyboard.press('End');
  await expect(page.locator('.kit-chart-tip-label')).toHaveText('Mar');
  await expect.poll(() => page.evaluate(() => document.querySelector('[data-kit-live="polite"]')?.textContent)).toBe('Mar: A 20, B no value');
  await page.keyboard.press('Escape');
  await expect(page.locator('.kit-chart-tip')).toBeHidden();
});

test('bars start at zero and stack; donuts total their parts', async ({ page }) => {
  await mount(page, `<kit-chart type="bar" stacked id="b">${table}</kit-chart><kit-chart type="donut" id="d"><table><thead><tr><th>Part</th><th>Count</th></tr></thead><tbody><tr><th>One</th><td>3</td></tr><tr><th>Two</th><td>1</td></tr></tbody></table></kit-chart>`);
  await expect(page.locator('#b .kit-chart-bar')).toHaveCount(5); // one row has no B
  const ticks = await page.locator('#b .kit-chart-tick').allTextContents();
  expect(ticks[0]).toBe('0');
  expect(Number(ticks.filter((t) => /^\d+$/.test(t)).at(-1))).toBeGreaterThanOrEqual(45); // 30 + 15 stacked
  await expect(page.locator('#d .kit-chart-slice')).toHaveCount(2);
  await expect(page.locator('#d .kit-chart-total')).toHaveText('4');
  await expect(page.locator('#d .kit-chart-plot')).toHaveAccessibleDescription('Donut chart of 2 parts, totalling 4. Largest: One 75%, Two 25%.');
});

test('data can come from script, and the table redraws the chart when it changes', async ({ page }) => {
  await mount(page, `<kit-chart type="line" id="s"></kit-chart><kit-chart id="t">${table}</kit-chart>`);
  await page.evaluate(() => { document.getElementById('s').data = { labels: ['x', 'y'], series: [{ name: 'S', values: [1, 2] }] }; });
  await expect(page.locator('#s .kit-chart-line')).toHaveCount(1);
  await page.evaluate(() => { document.querySelector('#t tbody').insertAdjacentHTML('beforeend', '<tr><th>Apr</th><td>40</td><td>9</td></tr>'); });
  await expect(page.locator('#t .kit-chart-plot')).toHaveAccessibleDescription(/4 points from Jan to Apr/);
});

test('sparklines describe their data in words', async ({ page }) => {
  await mount(page, '<kit-sparkline values="12 18 15 34" label="Visits"></kit-sparkline>');
  await expect(page.getByRole('img', { name: 'Visits: from 12 to 34, low 12, high 34' })).toBeVisible();
  await expect(page.locator('kit-sparkline svg path')).toHaveCount(1);
});

test('nice ticks land on round numbers that cover the data', async ({ page }) => {
  await page.goto(harness);
  const r = await page.evaluate(async () => {
    const { niceTicks } = await import('/core/scale.js');
    return [niceTicks(0, 87, 5), niceTicks(1200, 2900, 4), niceTicks(-3, 7, 5), niceTicks(5, 5)].map((t) => t.ticks);
  });
  expect(r).toEqual([[0, 20, 40, 60, 80, 100], [1000, 1500, 2000, 2500, 3000], [-4, -2, 0, 2, 4, 6, 8], [0, 1, 2, 3, 4, 5]]);
});

test('scatter, histogram and heatmap: drawn, summarised, and explorable by keyboard', async ({ page }) => {
  await mount(page, `
    <kit-chart type="scatter" id="sc"><table><thead><tr><th>Item</th><th>X</th><th>Y</th><th>Group</th></tr></thead><tbody>
      <tr><th>a</th><td>1</td><td>2</td><td>One</td></tr><tr><th>b</th><td>2</td><td>4.1</td><td>Two</td></tr><tr><th>c</th><td>3</td><td>5.9</td><td>One</td></tr><tr><th>d</th><td>4</td><td>8.2</td><td>Two</td></tr></tbody></table></kit-chart>
    <kit-chart type="histogram" id="hi"><table><thead><tr><th>#</th><th>Value</th></tr></thead><tbody>${[12, 14, 15, 18, 22, 23, 24, 26, 31, 47].map((v, i) => `<tr><th>${i}</th><td>${v}</td></tr>`).join('')}</tbody></table></kit-chart>
    <kit-chart type="heatmap" id="hm"><table><thead><tr><th>Row</th><th>A</th><th>B</th></tr></thead><tbody><tr><th>One</th><td>1</td><td>9</td></tr><tr><th>Two</th><td>5</td><td></td></tr></tbody></table></kit-chart>`);
  await expect(page.locator('#sc .kit-chart-point')).toHaveCount(4);
  await expect(page.locator('#sc .kit-chart-legend li')).toHaveText(['One', 'Two']);
  await expect(page.locator('#sc .kit-chart-plot')).toHaveAccessibleDescription(/4 points\. X from 1 to 4, Y from 2 to 8\.2, showing a strong positive relationship \(r = 1\.00\)/);
  await expect(page.locator('#hi .kit-chart-plot')).toHaveAccessibleDescription(/^Histogram of 10 values of Value, in \d+ bins/);
  await expect(page.locator('#hm .kit-chart-heat')).toHaveCount(4);
  await expect(page.locator('#hm .kit-chart-plot')).toHaveAccessibleDescription('Heatmap of 2 rows by 2 columns, values from 1 to 9. Highest: One, B (9). Lowest: One, A (1).');
  await page.locator('#hm .kit-chart-plot').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown'); // down a row: from One, A to Two, A
  await expect.poll(() => page.evaluate(() => document.querySelector('[data-kit-live="polite"]')?.textContent)).toBe('Two, A: 5');
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => page.evaluate(() => document.querySelector('[data-kit-live="polite"]')?.textContent)).toBe('Two, B: no value');
});
