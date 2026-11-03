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
