// SPDX-License-Identifier: MIT
//
// Dates without a library. A day is a plain ISO string, "YYYY-MM-DD": no time
// zone, so a day can't drift across midnight or a clock change. Arithmetic
// runs on UTC; names, formats and "3 days ago" come from Intl, in the page's
// language unless one is given.
//
//   addDays('2026-03-28', 2)            -> '2026-03-30' (across the clock change)
//   addMonths('2026-01-31', 1)          -> '2026-02-28' (clamped, not 3 March)
//   monthGrid('2026-11', 1)             -> 6 weeks of 7 days, Monday first
//   relative('2026-11-01', '2026-11-04') -> '3 days ago'
//   presets('2026-11-04').last7          -> { from: '2026-10-29', to: '2026-11-04' }

const DAY = 86400000;
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A day's UTC time value, or NaN for anything that isn't a real YYYY-MM-DD. */
function utc(iso) {
  const m = ISO.exec(iso ?? '');
  if (!m) return NaN;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  return new Date(t).getUTCDate() === +m[3] ? t : NaN; // rejects 2026-02-30
}
const fromUTC = (t) => new Date(t).toISOString().slice(0, 10);

/** True for a real day in YYYY-MM-DD form. */
export const isDay = (iso) => !Number.isNaN(utc(iso));

/** Today (or the day of a Date), in local time, as YYYY-MM-DD. */
export function today(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** A day as a local Date at midnight (for Intl), or null. */
export function toDate(iso) {
  const t = utc(iso);
  if (Number.isNaN(t)) return null;
  const d = new Date(t);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export const addDays = (iso, n) => fromUTC(utc(iso) + n * DAY);

/** Adds months, clamping to the last day: 31 January + 1 month is 28 (or 29) February. */
export function addMonths(iso, n) {
  const d = new Date(utc(iso));
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return fromUTC(d.getTime());
}

export const addYears = (iso, n) => addMonths(iso, 12 * n);

/** Whole days from a to b (negative when b is earlier). */
export const diffDays = (a, b) => Math.round((utc(b) - utc(a)) / DAY);

/** -1, 0 or 1. ISO days sort as strings, so this is a string comparison. */
export const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** The day of the week, 0 = Sunday … 6 = Saturday. */
export const weekday = (iso) => new Date(utc(iso)).getUTCDay();

export const startOfMonth = (iso) => iso.slice(0, 8) + '01';
export const endOfMonth = (iso) => addDays(addMonths(startOfMonth(iso), 1), -1);
export const startOfYear = (iso) => iso.slice(0, 4) + '-01-01';

/** The first day of the week holding iso, for a week starting on weekStart (0 = Sunday, 1 = Monday). */
export const startOfWeek = (iso, weekStart = 1) => addDays(iso, -((weekday(iso) - weekStart + 7) % 7));
export const endOfWeek = (iso, weekStart = 1) => addDays(startOfWeek(iso, weekStart), 6);

/** The ISO 8601 week: { year, week }. Weeks start on Monday; week 1 holds the first Thursday. */
export function isoWeek(iso) {
  const thursday = addDays(iso, 3 - ((weekday(iso) + 6) % 7));
  const year = +thursday.slice(0, 4);
  return { year, week: 1 + Math.floor(diffDays(`${year}-01-01`, thursday) / 7) };
}

/** Clamps a day between min and max (either may be empty). */
export function clamp(iso, min, max) {
  if (min && iso < min) return min;
  if (max && iso > max) return max;
  return iso;
}

/** True when iso is within from…to, inclusive, whichever order they come in. */
export function inRange(iso, from, to) {
  if (!from || !to) return false;
  const [a, b] = from <= to ? [from, to] : [to, from];
  return iso >= a && iso <= b;
}

/**
 * The days a month view shows: 6 rows of 7, from the start of the week that
 * holds the 1st. month is "YYYY-MM" (or any day in it).
 */
export function monthGrid(month, weekStart = 1) {
  const first = startOfWeek(month.slice(0, 7) + '-01', weekStart);
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(first, w * 7 + d)));
}

const lang = (locale) => locale || (typeof document !== 'undefined' && document.documentElement.lang) || undefined;

// Regions whose week starts on Sunday (and a few on Saturday), for engines
// without Intl.Locale's week info. Everywhere else starts on Monday.
const SUNDAY = /-(US|CA|JP|IL|BR|MX|PH|KR|TW|HK|IN|ZA|AU|SA|PE|CO|VE|GT|HN|NI|PA|PR|DO|SV|PY|BO|TH|ID|KH|LA|MM|NP|PK|BD|ET|KE|ZW|BW|BZ|BS|JM|TT|AG|DM|VI|GU|AS|MH|UM|MT|MO|BT|YE|WS)$/i;
const SATURDAY = /-(AE|AF|BH|DJ|DZ|EG|IQ|IR|JO|KW|LY|OM|QA|SD|SY)$/i;

/** The first day of the week where locale is used: 0 = Sunday, 1 = Monday, 6 = Saturday. */
export function weekStartFor(locale) {
  const tag = lang(locale) || 'en-GB';
  try {
    const l = new Intl.Locale(tag);
    const info = l.getWeekInfo?.() ?? l.weekInfo;
    if (info?.firstDay) return info.firstDay % 7; // Intl counts Monday = 1 … Sunday = 7
  } catch { /* an odd tag: fall through */ }
  let region = '';
  try { region = new Intl.Locale(tag).maximize().region ?? ''; } catch { /* Monday */ }
  const t = `-${region}`;
  return SATURDAY.test(t) ? 6 : SUNDAY.test(t) ? 0 : 1;
}

const formats = new Map();
function fmt(locale, opts) {
  const key = lang(locale) + JSON.stringify(opts);
  if (!formats.has(key)) formats.set(key, new Intl.DateTimeFormat(lang(locale), opts));
  return formats.get(key);
}

const STYLES = {
  short: { day: 'numeric', month: 'short' },
  medium: { day: 'numeric', month: 'short', year: 'numeric' },
  long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  month: { month: 'long', year: 'numeric' },
};

/** A day for people: style is short (4 Nov), medium (4 Nov 2026), long, month, or Intl options. */
export function formatDay(iso, style = 'medium', locale) {
  const d = toDate(iso);
  return d ? fmt(locale, STYLES[style] ?? style).format(d) : '';
}

/** A range for people, without repeating what both ends share: "4–11 Nov 2026". */
export function formatRange(from, to, style = 'medium', locale) {
  const a = toDate(from);
  const b = toDate(to);
  if (!a || !b) return a ? formatDay(from, style, locale) : '';
  const [x, y] = a <= b ? [a, b] : [b, a];
  const f = fmt(locale, STYLES[style] ?? style);
  return f.formatRange ? f.formatRange(x, y) : `${f.format(x)} – ${f.format(y)}`;
}

/** Weekday names in display order from weekStart: width is narrow (M), short (Mon) or long. */
export function weekdayNames(weekStart = 1, width = 'short', locale) {
  const f = fmt(locale, { weekday: width, timeZone: 'UTC' });
  return Array.from({ length: 7 }, (_, i) => f.format(new Date(Date.UTC(2026, 0, 4 + ((weekStart + i) % 7))))); // 4 Jan 2026 was a Sunday
}

/** Month names, January first: width is long or short. */
export function monthNames(width = 'long', locale) {
  const f = fmt(locale, { month: width, timeZone: 'UTC' });
  return Array.from({ length: 12 }, (_, i) => f.format(new Date(Date.UTC(2026, i, 1))));
}

const UNITS = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]];
const relFormats = new Map();

/**
 * How long ago (or until) a moment is, in words: "3 days ago", "in 2 hours",
 * "yesterday". Takes YYYY-MM-DD days (counted in whole days) or anything
 * Date understands; now defaults to the present.
 */
export function relative(when, now = new Date(), locale) {
  const key = lang(locale) ?? '';
  if (!relFormats.has(key)) relFormats.set(key, new Intl.RelativeTimeFormat(lang(locale), { numeric: 'auto' }));
  const rtf = relFormats.get(key);
  if (typeof when === 'string' && isDay(when)) {
    const days = diffDays(typeof now === 'string' ? now : today(now), when);
    if (Math.abs(days) < 7) return rtf.format(days, 'day');
    if (Math.abs(days) < 30) return rtf.format(Math.trunc(days / 7), 'week');
    if (Math.abs(days) < 365) return rtf.format(Math.trunc(days / 30), 'month');
    return rtf.format(Math.trunc(days / 365), 'year');
  }
  const secs = (new Date(when).getTime() - new Date(now).getTime()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(secs) >= size || unit === 'second') return rtf.format(Math.trunc(secs / size), unit);
  }
  return '';
}

/**
 * Common ranges ending on (or holding) a day, as { from, to }: today,
 * yesterday, last7, last30, last90, thisWeek, lastWeek, thisMonth,
 * lastMonth, thisYear. Weeks start on weekStart.
 */
export function presets(day = today(), weekStart = 1) {
  const lastMonthEnd = addDays(startOfMonth(day), -1);
  return {
    today: { from: day, to: day },
    yesterday: { from: addDays(day, -1), to: addDays(day, -1) },
    last7: { from: addDays(day, -6), to: day },
    last30: { from: addDays(day, -29), to: day },
    last90: { from: addDays(day, -89), to: day },
    thisWeek: { from: startOfWeek(day, weekStart), to: endOfWeek(day, weekStart) },
    lastWeek: { from: startOfWeek(addDays(day, -7), weekStart), to: endOfWeek(addDays(day, -7), weekStart) },
    thisMonth: { from: startOfMonth(day), to: endOfMonth(day) },
    lastMonth: { from: startOfMonth(lastMonthEnd), to: lastMonthEnd },
    thisYear: { from: startOfYear(day), to: day.slice(0, 4) + '-12-31' },
  };
}
