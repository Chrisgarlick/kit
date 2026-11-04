// <kit-calendar>, <kit-date-range> and <kit-event-calendar>: the APG date
// grid by keyboard, ranges, limits, forms, the popover, and the month view.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const harness = 'http://127.0.0.1:8151/tests/harness.html';

async function mount(page, markup, { lang = 'en-GB', width } = {}) {
  if (width) await page.setViewportSize({ width, height: 900 });
  await page.goto(harness);
  await page.evaluate(async ([m, lang]) => {
    // These components' styles load here, not in the shared harness page.
    await Promise.all(['button/button', 'calendar/calendar', 'date-range/date-range', 'event-calendar/event-calendar'].map((f) => new Promise((ok) => {
      const l = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: `/components/${f}.css` });
      l.onload = ok;
      document.head.append(l);
    })));
    document.documentElement.lang = lang;
    document.getElementById('app').innerHTML = m;
    await import('/components/calendar/calendar.js');
    await import('/components/date-range/date-range.js');
    await import('/components/event-calendar/event-calendar.js');
    await Promise.all([...document.querySelectorAll('kit-calendar, kit-date-range, kit-event-calendar')].map((el) => el.updateComplete));
  }, [markup, lang]);
}
const axe = async (page, sel) => (await new AxeBuilder({ page }).include(sel).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze()).violations.map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.any.map((a) => a.message).join(';').slice(0, 160)).join(' | ')}`);
const day = (page, name) => page.getByRole('gridcell', { name, exact: true });

test('a grid named by its month, in the language\'s week, with the chosen day selected', async ({ page }) => {
  await mount(page, '<kit-calendar value="2026-11-12"></kit-calendar>');
  const grid = page.getByRole('grid', { name: 'November 2026' });
  await expect(grid).toBeVisible();
  await expect(page.locator('kit-calendar th').first()).toHaveText('Mon');
  await expect(day(page, /^Thursday,? 12 November 2026$/)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('kit-calendar td[tabindex="0"]')).toHaveCount(1);
  expect(await axe(page, 'kit-calendar')).toEqual([]);
  await mount(page, '<kit-calendar value="2026-11-12"></kit-calendar>', { lang: 'en-US' });
  await expect(page.locator('kit-calendar th').first()).toHaveText('Sun');
});

test('keyboard: arrows, Home and End, Page Up and Down, Enter chooses and fires change', async ({ page }) => {
  await mount(page, '<kit-calendar value="2026-11-12"></kit-calendar>');
  await page.evaluate(() => { window.got = []; document.querySelector('kit-calendar').addEventListener('change', (e) => window.got.push(e.detail.value)); });
  await page.locator('kit-calendar td[tabindex="0"]').focus();
  const focused = () => page.evaluate(() => document.activeElement.dataset.day);
  await page.keyboard.press('ArrowRight'); expect(await focused()).toBe('2026-11-13');
  await page.keyboard.press('ArrowDown'); expect(await focused()).toBe('2026-11-20');
  await page.keyboard.press('Home'); expect(await focused()).toBe('2026-11-16');
  await page.keyboard.press('End'); expect(await focused()).toBe('2026-11-22');
  await page.keyboard.press('PageDown'); expect(await focused()).toBe('2026-12-22');
  await expect(page.getByRole('grid', { name: 'December 2026' })).toBeVisible();
  await page.keyboard.press('Shift+PageUp'); expect(await focused()).toBe('2025-12-22');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => [window.got, document.querySelector('kit-calendar').value])).toEqual([['2025-12-22'], '2025-12-22']);
});

test('min, max and isDateDisabled: those days can\'t be chosen and focus stops at the limits', async ({ page }) => {
  await mount(page, '<kit-calendar value="2026-11-12" min="2026-11-10" max="2026-11-20"></kit-calendar>');
  await page.evaluate(() => { document.querySelector('kit-calendar').isDateDisabled = (d) => d === '2026-11-14'; document.querySelector('kit-calendar').requestUpdate(); });
  await expect(day(page, /^\w+,? 9 November 2026$/)).toHaveAttribute('aria-disabled', 'true');
  await expect(day(page, /^\w+,? 14 November 2026$/)).toHaveAttribute('aria-disabled', 'true');
  await day(page, /^\w+,? 9 November 2026$/).click({ force: true }); // Playwright won't click aria-disabled
  await day(page, /^\w+,? 14 November 2026$/).click({ force: true });
  expect(await page.evaluate(() => document.querySelector('kit-calendar').value)).toBe('2026-11-12');
  await page.locator('kit-calendar td[tabindex="0"]').focus();
  await page.keyboard.press('PageDown');
  expect(await page.evaluate(() => document.activeElement.dataset.day)).toBe('2026-11-20');
});

test('a range: first day, a preview as you move, then the last day; a form gets an ISO interval', async ({ page }) => {
  await mount(page, '<form><kit-calendar name="period" range month="2026-11"></kit-calendar></form>');
  await page.evaluate(() => { window.got = []; document.querySelector('kit-calendar').addEventListener('change', (e) => window.got.push(e.detail)); });
  await day(page, /^Friday,? 13 November 2026$/).click();
  await day(page, /^Monday,? 9 November 2026$/).hover();
  await expect(page.locator('kit-calendar td[data-in-range]')).toHaveCount(5);
  await day(page, /^Monday,? 9 November 2026$/).click();
  expect(await page.evaluate(() => [window.got, new FormData(document.querySelector('form')).get('period')]))
    .toEqual([[{ from: '2026-11-09', to: '2026-11-13' }], '2026-11-09/2026-11-13']);
  await expect(page.locator('kit-calendar td[aria-selected="true"]')).toHaveCount(2);
});

test('date range: presets and the calendar in a popover; the inputs carry the values', async ({ page }) => {
  await mount(page, `<form><kit-date-range label="Period" presets="last7 thisMonth">
    <input type="date" name="from" aria-label="From"><input type="date" name="to" aria-label="To"></kit-date-range></form>`);
  const trigger = page.locator('.kit-range-trigger');
  await expect(trigger).toHaveAccessibleName('Period: none chosen');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Period' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('grid')).toBeVisible();
  expect(await page.evaluate(() => document.activeElement.getAttribute('role'))).toBe('gridcell');
  expect(await axe(page, 'kit-date-range')).toEqual([]);
  await dialog.getByRole('button', { name: 'Last 7 days' }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  const [from, to] = await page.evaluate(() => { const f = new FormData(document.querySelector('form')); return [f.get('from'), f.get('to')]; });
  const today = await page.evaluate(async () => (await import('/core/dates.js')).today());
  expect(to).toBe(today);
  expect(from).toBe(await page.evaluate(async (t) => (await import('/core/dates.js')).addDays(t, -6), today));
  await expect(trigger).toHaveAccessibleName(/^Period: \S/);
  await trigger.click();
  await expect(dialog.getByRole('button', { name: 'Last 7 days' })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

const events = `<kit-event-calendar month="2026-11" max-items="2">
  <ul>
    <li><time datetime="2026-11-05">5 Nov</time> <a href="#a">Launch post</a></li>
    <li data-tone="good"><time datetime="2026-11-12T09:30">12 Nov, 09:30</time> Weekly audit</li>
    <li><time datetime="2026-11-12T11:00">12 Nov, 11:00</time> Review</li>
    <li data-tone="bad"><time datetime="2026-11-12T16:00">12 Nov, 16:00</time> Deadline</li>
    <li><time datetime="2026-12-01">1 Dec</time> Next month</li>
  </ul></kit-event-calendar>`;

test('event calendar: items on their days, "+N more", and moving between months', async ({ page }) => {
  await mount(page, events, { width: 1200 });
  const table = page.getByRole('table', { name: 'November 2026' });
  await expect(table).toBeVisible();
  const d12 = page.locator('td[data-day="2026-11-12"]');
  await expect(d12.locator('.kit-evcal-item')).toHaveCount(2);
  await expect(d12.locator('.kit-evcal-item').first()).toContainText('09:30 Weekly audit');
  await expect(page.locator('td[data-day="2026-11-05"] .kit-evcal-item a')).toHaveAttribute('href', '#a');
  const more = d12.getByRole('button', { name: '+1 more' });
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await more.click();
  await expect(d12.locator('.kit-evcal-item')).toHaveCount(3);
  await expect(d12.getByRole('button', { name: 'Show fewer' })).toBeFocused();
  expect(await axe(page, 'kit-event-calendar')).toEqual([]);
  await page.getByRole('button', { name: 'Next month' }).click();
  await expect(page.getByRole('table', { name: 'December 2026' })).toBeVisible();
  await expect(page.locator('td[data-day="2026-12-01"] .kit-evcal-item')).toHaveText('Next month');
});

const toned = (attrs) => `<kit-event-calendar month="2026-11" ${attrs}>
  <ul>${Array.from({ length: 20 }, (_, i) => `<li data-tone="info"><time datetime="2026-11-12T${String(8 + (i % 10)).padStart(2, '0')}:00">12 Nov</time> Job ${i + 1}</li>`).join('')}
    <li data-tone="accent"><time datetime="2026-11-12T18:00">12 Nov</time> <a href="/r/1">Reminder</a></li>
    <li data-tone="good"><time datetime="2026-11-20">20 Nov</time> Workout</li>
  </ul></kit-event-calendar>`;

test('narrow: a compact month with a dot per tone, days as links, and a key', async ({ page }) => {
  await mount(page, toned('day-href="/d/{day}" data-tone-labels="accent:Reminder,good:Workout,info:Job,neutral:Done"'), { width: 390 });
  const cell = page.locator('td[data-day="2026-11-12"]');
  await expect(cell.locator('.kit-evcal-dots i')).toHaveCount(2); // 20 jobs and a reminder: two dots
  await expect(cell.locator('.kit-evcal-dots i').first()).toHaveAttribute('data-tone', 'accent');
  await expect(cell.locator('.kit-evcal-items')).toBeHidden();
  const link = page.getByRole('link', { name: /12 November 2026: Reminder 1, Job 20$/ });
  await expect(link).toHaveAttribute('href', '/d/2026-11-12');
  await expect(page.getByRole('link', { name: /^\w+,? 3 November 2026$/ })).toHaveAttribute('href', '/d/2026-11-03');
  const key = page.getByRole('list', { name: 'Key' });
  await expect(key.locator('li')).toHaveText(['Reminder', 'Job', 'Workout']); // only the tones in use
  expect(await axe(page, 'kit-event-calendar')).toEqual([]);
  // Wide, the same calendar shows the items and links each day's number.
  await mount(page, toned('day-href="/d/{day}"'), { width: 1200 });
  await expect(page.locator('td[data-day="2026-11-12"] .kit-evcal-items')).toBeVisible();
  await expect(page.locator('td[data-day="2026-11-12"] a.kit-evcal-date')).toHaveAttribute('href', '/d/2026-11-12');
  await expect(page.getByRole('list', { name: 'Key' })).toBeHidden(); // no labels, no key
});

test('month-href makes Today, previous and next real links; layout picks agenda or compact', async ({ page }) => {
  await mount(page, toned('month-href="/calendar/{month}"'), { width: 1200 });
  await expect(page.getByRole('link', { name: 'Previous month' })).toHaveAttribute('href', '/calendar/2026-10');
  await expect(page.getByRole('link', { name: 'Next month' })).toHaveAttribute('href', '/calendar/2026-12');
  const today = await page.evaluate(async () => (await import('/core/dates.js')).today().slice(0, 7));
  await expect(page.getByRole('link', { name: 'Today' })).toHaveAttribute('href', `/calendar/${today}`);
  await mount(page, toned('layout="agenda"'), { width: 390 });
  await expect(page.locator('.kit-evcal-grid')).toBeHidden();
  await expect(page.getByRole('list', { name: 'November 2026' }).locator('> li')).toHaveCount(2);
  await mount(page, toned('layout="compact"'), { width: 1200 });
  await expect(page.locator('td[data-day="2026-11-12"] .kit-evcal-dots i')).toHaveCount(2);
  await expect(page.locator('td[data-day="2026-11-12"] .kit-evcal-items')).toBeHidden();
  await mount(page, toned('layout="grid"'), { width: 390 });
  await expect(page.locator('td[data-day="2026-11-12"] .kit-evcal-items')).toBeVisible();
});

test('without the script, the list is what people see', async ({ page }) => {
  await page.goto(harness);
  await page.evaluate((m) => { document.getElementById('app').innerHTML = m; }, events);
  await expect(page.getByText('Weekly audit')).toBeVisible();
  await expect(page.locator('kit-event-calendar table')).toHaveCount(0);
});
