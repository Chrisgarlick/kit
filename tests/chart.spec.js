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

test('a flat line sits on a small range, and points mark each value', async ({ page }) => {
  await mount(page, `<kit-chart type="line" points><table><thead><tr><th>Audit</th><th>Score</th></tr></thead><tbody><tr><th>1 Nov</th><td>77</td></tr><tr><th>4 Nov</th><td>77</td></tr></tbody></table></kit-chart>`);
  await expect(page.locator('kit-chart .kit-chart-mark')).toHaveCount(2);
  const ticks = await page.locator('kit-chart .kit-chart-plot text').allTextContents();
  expect(ticks).not.toContain('0');
  expect(ticks.some((t) => Number(t) > 77) && ticks.some((t) => Number(t) < 77 && Number(t) > 0)).toBe(true);
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

test('funnel, bullet and small multiples: drawn, summarised, and shared scales', async ({ page }) => {
  await mount(page, `
    <kit-chart type="funnel" id="fu"><table><thead><tr><th>Stage</th><th>People</th></tr></thead><tbody><tr><th>Visited</th><td>1000</td></tr><tr><th>Signed up</th><td>200</td></tr><tr><th>Paid</th><td>50</td></tr></tbody></table></kit-chart>
    <kit-chart type="bullet" id="bu"><table><thead><tr><th>Measure</th><th>Value</th><th>Target</th></tr></thead><tbody><tr><th>Revenue</th><td>270</td><td>250</td></tr></tbody></table></kit-chart>
    <kit-multiples id="mu"><table><caption>Many</caption><thead><tr><th>M</th><th>A</th><th>B</th></tr></thead><tbody><tr><th>1</th><td>10</td><td>100</td></tr><tr><th>2</th><td>20</td><td>90</td></tr></tbody></table></kit-multiples>`);
  await page.evaluate(() => import('/components/small-multiples/small-multiples.js'));
  await expect(page.locator('#fu .kit-chart-plot')).toHaveAccessibleDescription('Funnel of 3 stages, from Visited (1,000) to Paid (50): 5% make it through. The biggest drop is from Visited to Signed up, losing 80%.');
  await page.locator('#fu .kit-chart-plot').focus();
  await page.keyboard.press('End');
  await expect.poll(() => page.evaluate(() => document.querySelector('[data-kit-live="polite"]')?.textContent)).toBe('Paid: 50, 25% of Signed up, 5% of Visited');
  await expect(page.locator('#bu .kit-chart-plot')).toHaveAccessibleDescription('Bullet chart of 1 measures. Revenue 270 against 250 (108%).');
  await expect(page.locator('#bu .kit-chart-target')).toHaveCount(1);
  await expect(page.locator('#mu kit-chart')).toHaveCount(2);
  const ticks = await page.locator('#mu kit-chart').evaluateAll((cs) => cs.map((c) => [...c.querySelectorAll('.kit-chart-tick')].map((t) => t.textContent).filter((t) => /^\d+$/.test(t)).join(',')));
  expect(ticks[0]).toBe(ticks[1]); // one shared value axis
  await expect(page.getByRole('group', { name: 'A', exact: true })).toBeVisible();
  await expect(page.locator('#mu').getByRole('button', { name: 'Show table' })).toHaveCount(1);
});

test('renderStatic: a standalone, valid SVG with theme colours as attributes, a title and the summary', async ({ page }) => {
  await page.goto(harness);
  const r = await page.evaluate(async () => {
    const { renderStatic } = await import('/core/charts-static.js');
    const { renderChart } = await import('/core/charts.js');
    const data = { title: 'Scores', labels: ['One', 'Two', 'Three'], series: [{ name: 'A', values: [3, 5, 4] }, { name: 'B', values: [2, 6, 1] }] };
    const out = {};
    for (const type of ['line', 'area', 'bar', 'donut', 'scatter', 'histogram', 'heatmap', 'funnel', 'bullet']) {
      const s = renderStatic(data, { type, width: 480, theme: { accent: '#123456', 'series-1': '#abcdef' } });
      const doc = new DOMParser().parseFromString(s.svg, 'image/svg+xml');
      out[type] = {
        error: doc.querySelector('parsererror')?.textContent ?? null,
        classes: /class="kit-(s\d|chart)/.test(s.svg),
        vars: /var\(--|currentColor/.test(s.svg),
        title: doc.querySelector('title')?.textContent,
        desc: doc.querySelector('desc')?.textContent === s.summary,
        xmlns: doc.documentElement.getAttribute('xmlns'),
        themed: s.svg.includes('#abcdef') || s.svg.includes('#123456'),
        marks: type === 'bar' ? [s.svg.split('<g class="kit-legend"')[0].match(/<rect[^>]*fill="#abcdef"/g)?.length, renderChart(data, { type, width: 480 }).svg.match(/kit-s1 kit-chart-bar/g)?.length] : null,
      };
    }
    return out;
  });
  for (const [type, x] of Object.entries(r)) {
    expect(x.error, type).toBeNull();
    expect(x.classes, `${type} still has kit classes`).toBe(false);
    expect(x.vars, `${type} still depends on CSS`).toBe(false);
    expect(x.title, type).toBe('Scores');
    expect(x.desc, type).toBe(true);
    expect(x.xmlns, type).toBe('http://www.w3.org/2000/svg');
    expect(x.themed, `${type} uses the theme`).toBe(true);
  }
  expect(r.bar.marks[0]).toBe(r.bar.marks[1]); // the same bars as the browser draws
});
