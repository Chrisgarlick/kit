// core/dates.js: days as YYYY-MM-DD, arithmetic that survives clock changes
// and month ends, and Intl for names, formats and relative time.
import { test, expect } from '@playwright/test';

const harness = 'http://127.0.0.1:8151/tests/harness.html';
const run = (page, fn) => page.evaluate(async (src) => {
  const d = await import('/core/dates.js');
  // eslint-disable-next-line no-new-func
  return new Function('d', `return (${src})(d)`)(d);
}, fn.toString());

test.beforeEach(async ({ page }) => { await page.goto(harness); });

test('arithmetic: days across a clock change, months clamped, years, differences', async ({ page }) => {
  const r = await run(page, (d) => [
    d.addDays('2026-03-28', 2), d.addDays('2026-10-24', 2), d.addDays('2026-12-31', 1), d.addDays('2026-03-01', -1),
    d.addMonths('2026-01-31', 1), d.addMonths('2028-01-31', 1), d.addMonths('2026-03-31', -1), d.addMonths('2026-11-15', 3),
    d.addYears('2028-02-29', 1), d.diffDays('2026-03-28', '2026-03-30'), d.diffDays('2026-11-04', '2026-10-29'),
  ]);
  expect(r).toEqual(['2026-03-30', '2026-10-26', '2027-01-01', '2026-02-28', '2026-02-28', '2028-02-29', '2026-02-28', '2027-02-15', '2029-02-28', 2, -6]);
});

test('validity, weeks, ISO weeks and month grids', async ({ page }) => {
  const r = await run(page, (d) => ({
    valid: [d.isDay('2026-02-28'), d.isDay('2026-02-30'), d.isDay('2026-2-1'), d.isDay('')],
    week: [d.startOfWeek('2026-11-04', 1), d.endOfWeek('2026-11-04', 1), d.startOfWeek('2026-11-04', 0)],
    iso: [d.isoWeek('2026-01-01'), d.isoWeek('2026-12-31'), d.isoWeek('2027-01-03'), d.isoWeek('2026-11-04')],
    grid: (() => { const g = d.monthGrid('2026-11', 1); return [g.length, g[0].length, g[0][0], g[5][6]]; })(),
    months: [d.startOfMonth('2026-11-04'), d.endOfMonth('2026-02-10'), d.endOfMonth('2028-02-10')],
    range: [d.inRange('2026-11-04', '2026-11-10', '2026-11-01'), d.inRange('2026-11-11', '2026-11-01', '2026-11-10'), d.clamp('2026-01-01', '2026-02-01', '')],
  }));
  expect(r.valid).toEqual([true, false, false, false]);
  expect(r.week).toEqual(['2026-11-02', '2026-11-08', '2026-11-01']);
  expect(r.iso).toEqual([{ year: 2026, week: 1 }, { year: 2026, week: 53 }, { year: 2026, week: 53 }, { year: 2026, week: 45 }]);
  expect(r.grid).toEqual([6, 7, '2026-10-26', '2026-12-06']);
  expect(r.months).toEqual(['2026-11-01', '2026-02-28', '2028-02-29']);
  expect(r.range).toEqual([true, false, '2026-02-01']);
});

test('presets end on the given day', async ({ page }) => {
  const p = await run(page, (d) => d.presets('2026-11-04', 1));
  expect(p.today).toEqual({ from: '2026-11-04', to: '2026-11-04' });
  expect(p.last7).toEqual({ from: '2026-10-29', to: '2026-11-04' });
  expect(p.last30.from).toBe('2026-10-06');
  expect(p.thisWeek).toEqual({ from: '2026-11-02', to: '2026-11-08' });
  expect(p.lastWeek).toEqual({ from: '2026-10-26', to: '2026-11-01' });
  expect(p.lastMonth).toEqual({ from: '2026-10-01', to: '2026-10-31' });
  expect(p.thisYear).toEqual({ from: '2026-01-01', to: '2026-12-31' });
});

test('names, formats and relative time come from Intl, in the given language', async ({ page }) => {
  const r = await run(page, (d) => ({
    weekStarts: [d.weekStartFor('en-GB'), d.weekStartFor('en-US'), d.weekStartFor('ar-EG'), d.weekStartFor('not a tag!')],
    days: d.weekdayNames(1, 'short', 'en-GB'),
    sun: d.weekdayNames(0, 'narrow', 'en-US')[0],
    month: d.monthNames('long', 'en-GB')[10],
    one: d.formatDay('2026-11-04', 'medium', 'en-GB'),
    long: d.formatDay('2026-11-04', 'long', 'en-GB'),
    span: d.formatRange('2026-11-04', '2026-11-11', 'medium', 'en-GB'),
    back: d.formatRange('2026-11-11', '2026-11-04', 'medium', 'en-GB'),
    rel: [d.relative('2026-11-01', '2026-11-04', 'en-GB'), d.relative('2026-11-03', '2026-11-04', 'en-GB'), d.relative('2026-11-18', '2026-11-04', 'en-GB'),
      d.relative('2026-11-04T10:00:00Z', '2026-11-04T12:00:00Z', 'en-GB'), d.relative('2026-11-04T12:00:30Z', '2026-11-04T12:00:00Z', 'en-GB')],
  }));
  expect(r.weekStarts).toEqual([1, 0, 6, 1]);
  expect(r.days).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  expect(r.sun).toBe('S');
  expect(r.month).toBe('November');
  expect(r.one).toBe('4 Nov 2026');
  expect(r.long).toMatch(/^Wednesday,? 4 November 2026$/); // ICU versions differ on the comma
  expect(r.span).toMatch(/^4\s?–\s?11 Nov 2026$/);
  expect(r.back).toBe(r.span);
  expect(r.rel).toEqual(['3 days ago', 'yesterday', 'in 2 weeks', '2 hours ago', 'in 30 seconds']);
});
