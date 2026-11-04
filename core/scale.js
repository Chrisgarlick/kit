// SPDX-License-Identifier: MIT
//
// Scales for kit's charts: one place that turns data into positions, so
// marks, ticks and labels always agree.

/** Round tick values for an axis covering [min, max], about `count` of them. */
export function niceTicks(min, max, count = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) { min = 0; max = 1; }
  if (min === max) { if (min === 0) max = 1; else if (min > 0) min = 0; else max = 0; }
  const raw = (max - min) / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const f = raw / mag;
  const step = (f >= 7.5 ? 10 : f >= 3.5 ? 5 : f >= 1.5 ? 2 : 1) * mag;
  const lo = Math.floor(min / step + 1e-9) * step;
  const hi = Math.ceil(max / step - 1e-9) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toPrecision(12)));
  return { min: lo, max: hi, step, ticks };
}

/** A linear scale: maps [d0, d1] onto [r0, r1]. */
export function linear(d0, d1, r0, r1) {
  const k = (r1 - r0) / (d1 - d0 || 1);
  return (v) => r0 + (v - d0) * k;
}

/** A number formatter by name: number, compact, percent, or currency:GBP. */
export function formatter(kind = 'number', locale) {
  // Engines without Intl (QuickJS, embedded in Typeset and Motion) get the
  // same output for en-GB from plainFormat.
  if (typeof Intl === 'undefined') return (v) => plainFormat(v, kind);
  if (kind.startsWith('currency:')) {
    const f = new Intl.NumberFormat(locale, { style: 'currency', currency: kind.slice(9), maximumFractionDigits: 2 });
    return (v) => f.format(v);
  }
  if (kind === 'percent') {
    const f = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
    return (v) => `${f.format(v)}%`;
  }
  const f = new Intl.NumberFormat(locale, kind === 'compact' ? { notation: 'compact', maximumFractionDigits: 1 } : { maximumFractionDigits: 2 });
  return (v) => f.format(v);
}

const SYMBOLS = { GBP: '£', USD: 'US$', EUR: '€' };

// grouped(1234567.891, 2) is "1,234,567.89": thousands commas, up to `max`
// decimals, trailing zeros dropped.
function grouped(v, max, min = 0) {
  const neg = v < 0;
  let s = Math.abs(v).toFixed(max);
  if (min < max) s = s.replace(/\.?0+$/, (m) => (min ? m.slice(0, 0) : ''));
  let [int, frac = ''] = s.split('.');
  if (frac.length < min) frac = frac.padEnd(min, '0');
  int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '-' : '') + int + (frac ? `.${frac}` : '');
}

/** formatter() without Intl: the en-GB results, for engines that lack it. */
export function plainFormat(v, kind = 'number') {
  if (!Number.isFinite(v)) return String(v);
  if (kind.startsWith('currency:')) {
    const code = kind.slice(9);
    const sym = SYMBOLS[code];
    const body = grouped(Math.abs(v), 2, 2);
    return `${v < 0 ? '-' : ''}${sym ?? `${code} `}${body}`;
  }
  if (kind === 'percent') return `${grouped(v, 1)}%`;
  if (kind === 'compact') {
    const a = Math.abs(v);
    for (const [n, unit] of [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']]) {
      // Move up a unit when the value, rounded as the unit below would show
      // it, reaches it: 999,999 is "1M" (not "1,000K"), 950 stays "950".
      const lower = n / 1000;
      if ((Math.round((a / lower) * 10) / 10) * lower >= n) {
        const x = Math.round((v / n) * 10) / 10;
        return `${grouped(x, 1)}${unit}`;
      }
    }
    return grouped(v, 1);
  }
  return grouped(v, 2);
}
