// SPDX-License-Identifier: MIT
//
// kit's chart renderer: data in, SVG out, with no DOM, so the same code
// draws <kit-chart> in the browser and static charts for Typeset (PDF) and
// Motion (animated SVG) from Node or an embedded JS engine.
//
//   const { svg, summary, legend, geom, height } = renderChart(data, { type: 'bar', width: 640 });
//
// For PDFs, video and anything outside the browser, renderStatic() in
// charts-static.js draws the same chart as a standalone SVG.
//
// data is { title, labels, series: [{ name, values, texts }] }, as tableData()
// reads from a table. The SVG uses kit's classes, which chart.css styles.
// Every mark carries data-part (bar, line, area, slice, point, cell, or
// label for a value printed on a mark) and data-i (its index: the category,
// series, part, point or cell), so other renderers, such as Motion, can
// animate marks one by one.

import { niceTicks, linear, formatter } from './scale.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const TYPES = ['line', 'area', 'bar', 'donut', 'scatter', 'histogram', 'heatmap', 'funnel', 'bullet'];

// Splits a label into at most two lines of about `max` characters, ending
// the second with an ellipsis if it still doesn't fit.
function wrap(text, max) {
  const s = String(text);
  if (s.length <= max) return [s];
  const words = s.split(' ');
  let first = '';
  while (words.length && (first ? `${first} ${words[0]}` : words[0]).length <= max) first = first ? `${first} ${words.shift()}` : words.shift();
  if (!first) first = words.shift();
  let second = words.join(' ');
  if (second.length > max) second = `${second.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
  return second ? [first, second] : [first];
}

// A <text> of one or two lines, centred on y when `middle`, else hanging from it.
function labelText(cls, x, y, text, max, anchor, middle) {
  const lines = wrap(text, max);
  const attrs = `class="${cls}" x="${x}" y="${y}"${anchor ? ` text-anchor="${anchor}"` : ''}`;
  if (lines.length === 1) return `<text ${attrs}${middle ? ' dominant-baseline="middle"' : ''}>${esc(lines[0])}</text>`;
  const start = middle ? '-0.55em' : '0';
  return `<text ${attrs}${middle ? ' dominant-baseline="middle"' : ''}><tspan x="${x}" dy="${start}">${esc(lines[0])}</tspan><tspan x="${x}" dy="1.15em">${esc(lines[1])}</tspan></text>`;
}

/** The height a chart wants: funnels and bullets grow with their rows, others take the box. */
export function chartHeight(type, m, box = 240) {
  if (type === 'funnel') return Math.max(120, m.labels.length * 52);
  if (type === 'bullet') return Math.max(120, m.labels.length * 46);
  return Math.max(120, Math.round(box) || 240);
}

/**
 * Draws a chart. options: type, width, height, format, stacked, zero, min,
 * max, center ('first'), bins, values (print each bar's value).
 * Returns { svg, summary, legend, geom, height }: legend is a list of
 * { label, series } (or { scale: [lo, hi] } for heatmaps); geom is what
 * hover and keyboard exploration need.
 */
export function renderChart(m, options = {}) {
  const o = { ...options };
  const type = TYPES.includes(o.type) ? o.type : 'line';
  const fmt = formatter(o.format || 'number');
  const W = Math.max(120, Math.round(o.width || 640));
  const H = o.height ? Math.round(o.height) : chartHeight(type, m);
  const r = { geom: null, legend: null, histo: null };
  const draw = {
    donut: () => donut(m, W, H, fmt, o, r),
    scatter: () => scatter(m, W, H, o, r),
    histogram: () => histogram(m, W, H, o, r),
    heatmap: () => heatmap(m, W, H, fmt, o, r),
    funnel: () => funnel(m, W, H, fmt, o, r),
    bullet: () => bullet(m, W, H, fmt, o, r),
  }[type];
  let svg = draw ? draw() : cartesian(m, type, W, H, o, r);
  let legend = r.legend;
  if (!legend) {
    if (type === 'scatter') legend = scatterGroups(m).map((label, i) => ({ label, series: i }));
    else if (type === 'bullet') legend = [{ label: 'Value', series: 0 }, { label: 'Target', target: true }];
    else if (type === 'donut') legend = o.center === 'first' ? [] : m.labels.map((label, i) => ({ label, series: i }));
    else if (['line', 'area', 'bar'].includes(type) && m.series.length > 1) legend = m.series.map((s, i) => ({ label: s.name, series: i }));
    else legend = [];
  }
  const summary = type === 'histogram' && r.histo ? histogramSummary(m, r.histo, fmt) : summarise(m, type, fmt);
  return { svg, summary, legend, geom: r.geom, height: H, width: W };
}

function cartesian(m, type, W, H, o, res) {
  const bar = type === 'bar';
  const stacked = bar && o.stacked;
  const n = m.labels.length;
  const vals = m.series.flatMap((s) => s.values).filter((v) => v != null);
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  if (stacked) {
    const sums = m.labels.map((_, i) => m.series.reduce((a, s) => a + Math.max(0, s.values[i] ?? 0), 0));
    hi = Math.max(...sums);
    lo = Math.min(0, ...m.labels.map((_, i) => m.series.reduce((a, s) => a + Math.min(0, s.values[i] ?? 0), 0)));
  }
  if (bar || o.zero || type === 'area') { lo = Math.min(0, lo); hi = Math.max(0, hi); }
  if (o.min != null) lo = o.min;
  if (o.max != null) hi = o.max;
  const axis = formatter(o.format === 'percent' ? 'percent' : (Math.abs(hi) >= 10000 || o.format === 'compact') ? 'compact' : o.format || 'number');
  const y = niceTicks(lo, hi, Math.max(2, Math.round(H / 56)));
  const left = 10 + Math.max(...y.ticks.map((t) => axis(t).length)) * 7;
  const slot = (W - left - 10) / Math.max(1, n);
  const twoLines = bar && m.labels.some((l) => String(l).length * 6.2 > slot - 6);
  const top = o.values ? 22 : 10;
  const bottom = H - (twoLines ? 38 : 26);
  const right = W - 10;
  const sy = linear(y.min, y.max, bottom, top);
  const band = (right - left) / n;
  const sx = bar ? (i) => left + band * (i + 0.5) : linear(0, Math.max(1, n - 1), left + 4, right - 4);
  const out = [`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false">`];
  // Grid and value axis.
  for (const t of y.ticks) {
    const ty = sy(t).toFixed(1);
    out.push(`<line class="kit-chart-grid${t === 0 ? ' kit-chart-zero' : ''}" x1="${left}" x2="${right}" y1="${ty}" y2="${ty}"/>`,
      `<text class="kit-chart-tick" x="${left - 8}" y="${ty}" text-anchor="end" dominant-baseline="middle">${esc(axis(t))}</text>`);
  }
  // Category labels, thinned so they don't collide.
  const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor((right - left) / 56))));
  m.labels.forEach((l, i) => {
    if (i % every && i !== n - 1) return;
    if (!bar && i === n - 1 && i % every && n - 1 - Math.floor((n - 1) / every) * every < every / 2) return;
    out.push(bar
      ? labelText('kit-chart-tick', sx(i).toFixed(1), bottom + 16, l, Math.max(4, Math.floor((band * every - 6) / 6.2)), 'middle', false)
      : `<text class="kit-chart-tick" x="${sx(i).toFixed(1)}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`);
  });
  out.push('<g class="kit-chart-hover"></g>');
  if (bar) {
    const inner = band * 0.72;
    const k = m.series.length;
    const base = sy(Math.max(y.min, Math.min(0, y.max)));
    m.labels.forEach((_, i) => {
      let up = 0;
      let down = 0;
      m.series.forEach((s, j) => {
        const v = s.values[i];
        if (v == null) return;
        let x; let w; let y0; let y1;
        if (stacked) {
          w = inner; x = sx(i) - w / 2;
          if (v >= 0) { y0 = sy(up); up += v; y1 = sy(up); } else { y0 = sy(down); down += v; y1 = sy(down); }
        } else {
          w = Math.max(1, inner / k - 2); x = sx(i) - inner / 2 + j * (inner / k) + 1;
          y0 = base; y1 = sy(v);
        }
        const yTop = Math.min(y0, y1);
        const h = Math.max(1, Math.abs(y1 - y0));
        out.push(`<rect class="kit-s${(j % 6) + 1} kit-chart-bar" data-part="bar" data-i="${i}" x="${x.toFixed(1)}" y="${yTop.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(3, w / 4).toFixed(1)}"/>`);
        // values: print each bar's value at its end (for print, where there's no hover).
        if (o.values && !stacked && w >= 18) out.push(`<text class="kit-chart-tick kit-chart-value" data-part="label" data-i="${i}" x="${(x + w / 2).toFixed(1)}" y="${(v >= 0 ? yTop - 5 : yTop + h + 12).toFixed(1)}" text-anchor="middle">${esc(formatter(o.format === 'percent' ? 'percent' : 'compact')(v))}</text>`);
      });
    });
  } else {
    m.series.forEach((s, j) => {
      const pts = s.values.map((v, i) => (v == null ? null : [sx(i), sy(v)]));
      const runs = [];
      let run = [];
      for (const p of pts) { if (p) run.push(p); else if (run.length) { runs.push(run); run = []; } }
      if (run.length) runs.push(run);
      const cls = `kit-s${(j % 6) + 1}`;
      for (const r of runs) {
        const d = r.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');
        if (type === 'area') {
          const base = sy(Math.max(y.min, 0)).toFixed(1);
          out.push(`<path class="${cls} kit-chart-area" data-part="area" data-i="${j}" d="${d}L${r.at(-1)[0].toFixed(1)} ${base}L${r[0][0].toFixed(1)} ${base}Z"/>`);
        }
        out.push(`<path class="${cls} kit-chart-line" data-part="line" data-i="${j}" d="${d}"/>`);
      }
    });
  }
  out.push('</svg>');
  res.geom = { kind: bar ? 'bar' : 'line', n, sx, sy, left, right, top, bottom, band };
  return out.join('');
}

function donut(m, W, H, fmt, o, res) {
  const vals = (m.series[0]?.values ?? []).map((v) => Math.max(0, v ?? 0));
  const total = vals.reduce((a, b) => a + b, 0) || 1;
  const r = Math.min(W, H) / 2 - 6;
  const ri = r * 0.64;
  const cx = W / 2;
  const cy = H / 2;
  const out = [`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false">`];
  let a0 = -Math.PI / 2;
  const arcs = [];
  vals.forEach((v, i) => {
    const a1 = a0 + (v / total) * Math.PI * 2;
    arcs.push([a0, a1]);
    if (v > 0) {
      const big = a1 - a0 > Math.PI ? 1 : 0;
      const p = (a, rr) => `${(cx + rr * Math.cos(a)).toFixed(2)} ${(cy + rr * Math.sin(a)).toFixed(2)}`;
      const full = v === total;
      const d = full
        ? `M${p(-Math.PI / 2, r)}A${r} ${r} 0 1 1 ${p(Math.PI * 1.5 - 0.0001, r)}L${p(Math.PI * 1.5 - 0.0001, ri)}A${ri} ${ri} 0 1 0 ${p(-Math.PI / 2, ri)}Z`
        : `M${p(a0, r)}A${r} ${r} 0 ${big} 1 ${p(a1, r)}L${p(a1, ri)}A${ri} ${ri} 0 ${big} 0 ${p(a0, ri)}Z`;
      // A gauge (center="first") draws what's left as a quiet track, not a second series.
      const cls = o.center === 'first' && i > 0 ? 'kit-chart-track' : `kit-s${(i % 6) + 1}`;
      out.push(`<path class="${cls} kit-chart-slice" data-part="slice" data-i="${i}" d="${d}"/>`);
    }
    a0 = a1;
  });
  // center="first" shows the first part instead of the total, for a donut used as a gauge.
  const middle = o.center === 'first' ? vals[0] ?? 0 : vals.reduce((a, b) => a + b, 0);
  out.push(`<text class="kit-chart-total" x="${cx}" y="${cy - 4}" text-anchor="middle">${esc(fmt(middle))}</text>`,
    `<text class="kit-chart-tick" x="${cx}" y="${cy + 16}" text-anchor="middle">${esc(m.series[0]?.name || 'Total')}</text>`, '</svg>');
  res.geom = { kind: 'donut', n: vals.length, cx, cy, r, ri, arcs, total };
  return out.join('');
}

function axes(out, x, y, sx, sy, box, fx, fy) {
  for (const t of y.ticks) {
    const ty = sy(t).toFixed(1);
    out.push(`<line class="kit-chart-grid" x1="${box.left}" x2="${box.right}" y1="${ty}" y2="${ty}"/>`,
      `<text class="kit-chart-tick" x="${box.left - 8}" y="${ty}" text-anchor="end" dominant-baseline="middle">${esc(fy(t))}</text>`);
  }
  const every = Math.max(1, Math.ceil(x.ticks.length / Math.max(2, Math.floor((box.right - box.left) / 56))));
  x.ticks.forEach((t, i) => {
    if (i % every) return;
    out.push(`<text class="kit-chart-tick" x="${sx(t).toFixed(1)}" y="${box.bottom + 18}" text-anchor="middle">${esc(fx(t))}</text>`);
  });
}

function plotBox(y, H, W, fy, titles) {
  const left = 10 + Math.max(...y.ticks.map((t) => fy(t).length)) * 7;
  return { left, right: W - 12, top: titles ? 22 : 10, bottom: H - (titles ? 38 : 26) };
}

function scatter(m, W, H, o, res) {
  const [xs, ys, gs] = m.series;
  const groupNames = gs && gs.values.every((v) => v == null) ? [...new Set(gs.texts)] : [];
  const pts = m.labels.map((label, i) => ({ label, x: xs?.values[i], y: ys?.values[i], g: groupNames.length ? groupNames.indexOf(gs.texts[i]) : 0 }))
    .filter((p) => p.x != null && p.y != null)
    .sort((a, b) => a.x - b.x);
  const fx = formatter(o.format === 'percent' ? 'percent' : 'compact');
  const fy = fx;
  const fmt = formatter(o.format || 'number');
  const x = niceTicks(Math.min(...pts.map((p) => p.x)), Math.max(...pts.map((p) => p.x)), Math.max(2, Math.round(W / 90)));
  const y = niceTicks(Math.min(...pts.map((p) => p.y)), Math.max(...pts.map((p) => p.y)), Math.max(2, Math.round(H / 56)));
  const box = plotBox(y, H, W, fy, true);
  const sx = linear(x.min, x.max, box.left + 6, box.right - 6);
  const sy = linear(y.min, y.max, box.bottom, box.top);
  const out = [`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false">`];
  axes(out, x, y, sx, sy, box, fx, fy);
  out.push(`<text class="kit-chart-tick kit-chart-axis-title" x="${box.right}" y="${H - 4}" text-anchor="end">${esc(xs?.name ?? 'x')} →</text>`,
    `<text class="kit-chart-tick kit-chart-axis-title" x="${box.left}" y="10" text-anchor="start">↑ ${esc(ys?.name ?? 'y')}</text>`,
    '<g class="kit-chart-hover"></g>');
  pts.forEach((p, i) => {
    out.push(`<circle class="kit-s${(p.g % 6) + 1} kit-chart-point" data-part="point" data-i="${i}" cx="${sx(p.x).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="4.5"/>`);
  });
  out.push('</svg>');
  const describe = (i) => {
    const p = pts[i];
    return `${p.label}: ${xs.name} ${fmt(p.x)}, ${ys.name} ${fmt(p.y)}${groupNames.length ? `, ${groupNames[p.g]}` : ''}`;
  };
  res.geom = {
    kind: 'scatter', n: pts.length,
    hit: (px, py) => {
      let best = -1;
      let d = 24;
      pts.forEach((p, i) => { const k = Math.hypot(sx(p.x) - px, sy(p.y) - py); if (k < d) { d = k; best = i; } });
      return best;
    },
    mark: (i) => {
      const p = pts[i];
      const cx = sx(p.x);
      const cy = sy(p.y);
      return {
        svg: `<line class="kit-chart-cross" x1="${cx}" x2="${cx}" y1="${cy}" y2="${box.bottom}"/><line class="kit-chart-cross" x1="${box.left}" x2="${cx}" y1="${cy}" y2="${cy}"/><circle class="kit-s${(p.g % 6) + 1} kit-chart-dot" cx="${cx}" cy="${cy}" r="6"/>`,
        tip: `<p class="kit-chart-tip-label">${esc(p.label)}</p><p class="kit-s${(p.g % 6) + 1}"><span></span>${esc(xs.name)}<b>${esc(fmt(p.x))}</b></p><p class="kit-s${(p.g % 6) + 1}"><span></span>${esc(ys.name)}<b>${esc(fmt(p.y))}</b></p>${groupNames.length ? `<p>${esc(groupNames[p.g])}</p>` : ''}`,
        x: cx, y: cy - 10,
      };
    },
    say: describe,
  };
  return out.join('');
}

function histogram(m, W, H, o, res) {
  const vals = (m.series[0]?.values ?? []).filter((v) => v != null);
  const fmt = formatter(o.format || 'number');
  const want = Number(o.bins) || Math.ceil(Math.log2(Math.max(1, vals.length))) + 1;
  const edges = niceTicks(Math.min(...vals), Math.max(...vals), want);
  const bins = edges.ticks.slice(0, -1).map((lo, i) => ({ lo, hi: edges.ticks[i + 1], n: 0 }));
  for (const v of vals) {
    const i = Math.min(bins.length - 1, Math.floor((v - edges.min) / edges.step));
    bins[Math.max(0, i)].n++;
  }
  const y = niceTicks(0, Math.max(1, ...bins.map((b) => b.n)), Math.max(2, Math.round(H / 56)));
  const count = formatter('number');
  const box = plotBox(y, H, W, count, true);
  const sx = linear(edges.min, edges.max, box.left, box.right);
  const sy = linear(0, y.max, box.bottom, box.top);
  const out = [`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false">`];
  axes(out, { ticks: edges.ticks }, y, sx, sy, box, formatter(o.format === 'percent' ? 'percent' : 'compact'), count);
  out.push(`<text class="kit-chart-tick kit-chart-axis-title" x="${box.right}" y="${H - 4}" text-anchor="end">${esc(m.series[0]?.name ?? 'Value')} →</text>`,
    `<text class="kit-chart-tick kit-chart-axis-title" x="${box.left}" y="10">↑ Count</text>`, '<g class="kit-chart-hover"></g>');
  bins.forEach((b, i) => {
    const x0 = sx(b.lo) + 1;
    const x1 = sx(b.hi) - 1;
    const y1 = sy(b.n);
    if (b.n) out.push(`<rect class="kit-s1 kit-chart-bar" data-part="bar" data-i="${i}" x="${x0.toFixed(1)}" y="${y1.toFixed(1)}" width="${Math.max(1, x1 - x0).toFixed(1)}" height="${Math.max(1, box.bottom - y1).toFixed(1)}" rx="2"/>`);
  });
  out.push('</svg>');
  const range = (b) => `${fmt(b.lo)} to ${fmt(b.hi)}`;
  res.geom = {
    kind: 'histogram', n: bins.length,
    hit: (px) => { const i = Math.floor((px - box.left) / ((box.right - box.left) / bins.length)); return i >= 0 && i < bins.length ? i : -1; },
    mark: (i) => {
      const b = bins[i];
      return {
        svg: `<rect class="kit-chart-band" x="${sx(b.lo).toFixed(1)}" y="${box.top}" width="${(sx(b.hi) - sx(b.lo)).toFixed(1)}" height="${box.bottom - box.top}"/>`,
        tip: `<p class="kit-chart-tip-label">${esc(range(b))}</p><p class="kit-s1"><span></span>Count<b>${esc(count(b.n))}</b></p><p>Share<b>${Math.round((b.n / (vals.length || 1)) * 100)}%</b></p>`,
        x: (sx(b.lo) + sx(b.hi)) / 2, y: box.top,
      };
    },
    say: (i) => `${range(bins[i])}: ${bins[i].n} ${bins[i].n === 1 ? 'value' : 'values'}`,
  };
  res.histo = { bins, total: vals.length, step: edges.step };
  return out.join('');
}

function funnel(m, W, H, fmt, o, res) {
  const vals = (m.series[0]?.values ?? []).map((v) => Math.max(0, v ?? 0));
  const n = vals.length;
  const first = vals[0] || 1;
  const top = Math.max(...vals) || 1;
  const left = Math.min(W * 0.32, 14 + Math.max(...m.labels.map((l) => l.length)) * 6.5);
  const right = W - 54;
  const rowH = (H - 4) / n;
  const bh = Math.min(40, rowH * 0.72);
  const out = [`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false"><g class="kit-chart-hover"></g>`];
  const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
  vals.forEach((v, i) => {
    const cy = 2 + rowH * (i + 0.5);
    const w = Math.max(2, ((right - left) * v) / top);
    const x = left + (right - left - w) / 2;
    out.push(labelText('kit-chart-tick kit-chart-funnel-label', 0, cy.toFixed(1), m.labels[i], Math.max(6, Math.floor((left - 12) / 6.6)), null, true),
      `<rect class="kit-s1 kit-chart-bar" data-part="bar" data-i="${i}" x="${x.toFixed(1)}" y="${(cy - bh / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${bh.toFixed(1)}" rx="4"/>`);
    const label = esc(formatter('compact')(v));
    if (w > 48) out.push(`<text class="kit-chart-bar-value" data-part="label" data-i="${i}" x="${(x + w / 2).toFixed(1)}" y="${cy.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${label}</text>`);
    else out.push(`<text class="kit-chart-tick" data-part="label" data-i="${i}" x="${(x + w + 6).toFixed(1)}" y="${cy.toFixed(1)}" dominant-baseline="middle">${label}</text>`);
    if (i) out.push(`<text class="kit-chart-tick kit-chart-funnel-step" x="${W}" y="${cy.toFixed(1)}" text-anchor="end" dominant-baseline="middle">${pct(v, vals[i - 1])}%</text>`);
  });
  out.push('</svg>');
  const say = (i) => `${m.labels[i]}: ${fmt(vals[i])}${i ? `, ${pct(vals[i], vals[i - 1])}% of ${m.labels[i - 1]}, ${pct(vals[i], first)}% of ${m.labels[0]}` : ''}`;
  res.geom = {
    kind: 'funnel', n,
    hit: (px, py) => { const i = Math.floor((py - 2) / rowH); return i >= 0 && i < n ? i : -1; },
    mark: (i) => ({
      svg: `<rect class="kit-chart-band" x="0" y="${(2 + rowH * i).toFixed(1)}" width="${W}" height="${rowH.toFixed(1)}" rx="4"/>`,
      tip: `<p class="kit-chart-tip-label">${esc(m.labels[i])}</p><p class="kit-s1"><span></span>${esc(m.series[0].name)}<b>${esc(fmt(vals[i]))}</b></p>${i ? `<p>Of previous<b>${pct(vals[i], vals[i - 1])}%</b></p><p>Of first<b>${pct(vals[i], first)}%</b></p>` : ''}`,
      x: (left + right) / 2, y: 2 + rowH * i,
    }),
    say,
  };
  return out.join('');
}

function bullet(m, W, H, fmt, o, res) {
  const [value, target, max] = m.series;
  const n = m.labels.length;
  const left = Math.min(W * 0.3, 14 + Math.max(...m.labels.map((l) => l.length)) * 6.5);
  const right = W - 52;
  const rowH = (H - 4) / n;
  const th = Math.min(26, rowH * 0.6);
  const out = [`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false"><g class="kit-chart-hover"></g>`];
  const rows = m.labels.map((label, i) => {
    const v = value?.values[i] ?? 0;
    const t = target?.values[i];
    const top = max?.values[i] ?? niceTicks(0, Math.max(v, t ?? 0) * 1.1, 4).max;
    return { label, v, t, top };
  });
  rows.forEach((r, i) => {
    const cy = 2 + rowH * (i + 0.5);
    const sx = linear(0, r.top || 1, left, right);
    out.push(labelText('kit-chart-tick kit-chart-funnel-label', 0, cy.toFixed(1), r.label, Math.max(6, Math.floor((left - 12) / 6.6)), null, true),
      `<rect class="kit-chart-bullet-track" x="${left}" y="${(cy - th / 2).toFixed(1)}" width="${(right - left).toFixed(1)}" height="${th.toFixed(1)}" rx="3"/>`,
      `<rect class="kit-chart-bullet-band" x="${left}" y="${(cy - th / 2).toFixed(1)}" width="${(sx(r.top * 0.8) - left).toFixed(1)}" height="${th.toFixed(1)}" rx="3"/>`,
      `<rect class="kit-s1 kit-chart-bar" data-part="bar" data-i="${i}" x="${left}" y="${(cy - th / 6).toFixed(1)}" width="${Math.max(1, Math.min(right, sx(r.v)) - left).toFixed(1)}" height="${(th / 3).toFixed(1)}" rx="2"/>`);
    if (r.t != null) out.push(`<line class="kit-chart-target" x1="${sx(r.t).toFixed(1)}" x2="${sx(r.t).toFixed(1)}" y1="${(cy - th / 2 - 3).toFixed(1)}" y2="${(cy + th / 2 + 3).toFixed(1)}"/>`);
    out.push(`<text class="kit-chart-tick kit-chart-bullet-pct" x="${W}" y="${cy.toFixed(1)}" text-anchor="end" dominant-baseline="middle">${r.t ? `${Math.round((r.v / r.t) * 100)}%` : esc(formatter('compact')(r.v))}</text>`);
  });
  out.push('</svg>');
  const say = (i) => { const r = rows[i]; return `${r.label}: ${fmt(r.v)}${r.t != null ? ` against a target of ${fmt(r.t)} (${Math.round((r.v / r.t) * 100)}%)` : ''}`; };
  res.geom = {
    kind: 'bullet', n,
    hit: (px, py) => { const i = Math.floor((py - 2) / rowH); return i >= 0 && i < n ? i : -1; },
    mark: (i) => {
      const r = rows[i];
      return {
        svg: `<rect class="kit-chart-band" x="0" y="${(2 + rowH * i).toFixed(1)}" width="${W}" height="${rowH.toFixed(1)}" rx="4"/>`,
        tip: `<p class="kit-chart-tip-label">${esc(r.label)}</p><p class="kit-s1"><span></span>${esc(value?.name ?? 'Value')}<b>${esc(fmt(r.v))}</b></p>${r.t != null ? `<p>${esc(target.name)}<b>${esc(fmt(r.t))}</b></p><p>Of target<b>${Math.round((r.v / r.t) * 100)}%</b></p>` : ''}`,
        x: linear(0, r.top || 1, left, right)(r.v), y: 2 + rowH * i,
      };
    },
    say,
  };
    return out.join('');
}

function heatmap(m, W, H, fmt, o, res) {
  const rows = m.labels;
  const cols = m.series.map((s) => s.name);
  const all = m.series.flatMap((s) => s.values).filter((v) => v != null);
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const left = 12 + Math.max(...rows.map((r) => r.length)) * 6.5;
  const top = 22;
  const cw = (W - left - 4) / cols.length;
  const ch = (H - top - 4) / rows.length;
  const out = [`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false">`];
  const every = Math.max(1, Math.ceil(cols.length / Math.max(1, Math.floor((W - left) / 40))));
  cols.forEach((c, j) => { if (!(j % every)) out.push(`<text class="kit-chart-tick" x="${(left + cw * (j + 0.5)).toFixed(1)}" y="14" text-anchor="middle">${esc(c)}</text>`); });
  rows.forEach((r, i) => out.push(`<text class="kit-chart-tick" x="${left - 8}" y="${(top + ch * (i + 0.5)).toFixed(1)}" text-anchor="end" dominant-baseline="middle">${esc(r)}</text>`));
  const showValues = cw >= 34 && ch >= 20;
  rows.forEach((_, i) => cols.forEach((__, j) => {
    const v = m.series[j].values[i];
    const t = v == null ? 0 : (v - lo) / (hi - lo || 1);
    const x = left + cw * j + 1;
    const yy = top + ch * i + 1;
    out.push(`<rect class="kit-chart-heat${v == null ? ' kit-chart-empty' : ''}" data-part="cell" data-i="${i * cols.length + j}" x="${x.toFixed(1)}" y="${yy.toFixed(1)}" width="${(cw - 2).toFixed(1)}" height="${(ch - 2).toFixed(1)}" rx="3" fill-opacity="${v == null ? 1 : (0.1 + t * 0.9).toFixed(3)}"/>`);
    if (showValues && v != null) out.push(`<text class="kit-chart-heat-value${t > 0.55 ? ' kit-chart-heat-on' : ''}" data-part="label" data-i="${i * cols.length + j}" x="${(x + cw / 2 - 1).toFixed(1)}" y="${(yy + ch / 2 - 1).toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${esc(formatter('compact')(v))}</text>`);
  }));
  out.push('<g class="kit-chart-hover"></g></svg>');
  res.legend = { scale: [fmt(lo), fmt(hi)] };
  const say = (k) => { const i = Math.floor(k / cols.length); const j = k % cols.length; const v = m.series[j].values[i]; return `${rows[i]}, ${cols[j]}: ${v == null ? 'no value' : fmt(v)}`; };
  res.geom = {
    kind: 'heatmap', n: rows.length * cols.length, cols: cols.length,
    hit: (px, py) => {
      const j = Math.floor((px - left) / cw);
      const i = Math.floor((py - top) / ch);
      return i >= 0 && j >= 0 && i < rows.length && j < cols.length ? i * cols.length + j : -1;
    },
    mark: (k) => {
      const i = Math.floor(k / cols.length);
      const j = k % cols.length;
      const v = m.series[j].values[i];
      return {
        svg: `<rect class="kit-chart-heat-ring" x="${(left + cw * j).toFixed(1)}" y="${(top + ch * i).toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}" rx="4"/>`,
        tip: `<p class="kit-chart-tip-label">${esc(rows[i])} · ${esc(cols[j])}</p><p>Value<b>${v == null ? '–' : esc(fmt(v))}</b></p>`,
        x: left + cw * (j + 1), y: top + ch * i,
      };
    },
    say,
  };
  return out.join('');
}

/** A sentence or two describing the chart, for screen readers and as a caption. */
export function summarise(m, type, fmt) {
  const n = m.labels.length;
  if (type === 'donut') {
    const vals = m.series[0]?.values ?? [];
    const total = vals.reduce((a, b) => a + (b ?? 0), 0) || 1;
    const order = vals.map((v, i) => [v ?? 0, i]).sort((a, b) => b[0] - a[0]);
    const top = order.slice(0, 3).map(([v, i]) => `${m.labels[i]} ${Math.round((v / total) * 100)}%`).join(', ');
    return `Donut chart of ${n} parts, totalling ${fmt(total)}. Largest: ${top}.`;
  }
  if (type === 'scatter') {
    const [xs, ys] = m.series;
    const pairs = m.labels.map((_, i) => [xs?.values[i], ys?.values[i]]).filter(([a, b]) => a != null && b != null);
    if (!pairs.length) return 'Scatter chart with no points.';
    const c = correlation(pairs.map((p) => p[0]), pairs.map((p) => p[1]));
    const range = (vs) => `${fmt(Math.min(...vs))} to ${fmt(Math.max(...vs))}`;
    return `Scatter chart of ${pairs.length} points. ${xs.name} from ${range(pairs.map((p) => p[0]))}, ${ys.name} from ${range(pairs.map((p) => p[1]))}${c ? `, showing ${c.text} (r = ${c.r.toFixed(2)})` : ''}.`;
  }
  if (type === 'heatmap') {
    const cells = [];
    m.series.forEach((s, j) => s.values.forEach((v, i) => { if (v != null) cells.push([v, i, j]); }));
    if (!cells.length) return 'Heatmap with no values.';
    const hi = cells.reduce((a, b) => (b[0] > a[0] ? b : a));
    const lo = cells.reduce((a, b) => (b[0] < a[0] ? b : a));
    return `Heatmap of ${m.labels.length} rows by ${m.series.length} columns, values from ${fmt(lo[0])} to ${fmt(hi[0])}. Highest: ${m.labels[hi[1]]}, ${m.series[hi[2]].name} (${fmt(hi[0])}). Lowest: ${m.labels[lo[1]]}, ${m.series[lo[2]].name} (${fmt(lo[0])}).`;
  }
  if (type === 'funnel') {
    const vals = (m.series[0]?.values ?? []).map((v) => v ?? 0);
    if (!vals.length) return 'Funnel with no stages.';
    let worst = null;
    for (let i = 1; i < vals.length; i++) {
      const lost = vals[i - 1] ? 1 - vals[i] / vals[i - 1] : 0;
      if (!worst || lost > worst.lost) worst = { i, lost };
    }
    const overall = vals[0] ? Math.round((vals.at(-1) / vals[0]) * 1000) / 10 : 0;
    return `Funnel of ${vals.length} stages, from ${m.labels[0]} (${fmt(vals[0])}) to ${m.labels.at(-1)} (${fmt(vals.at(-1))}): ${overall}% make it through.${worst ? ` The biggest drop is from ${m.labels[worst.i - 1]} to ${m.labels[worst.i]}, losing ${Math.round(worst.lost * 100)}%.` : ''}`;
  }
  if (type === 'bullet') {
    const [v, t] = m.series;
    return `Bullet chart of ${m.labels.length} measures. ${m.labels.map((l, i) => `${l} ${fmt(v?.values[i] ?? 0)}${t?.values[i] != null ? ` against ${fmt(t.values[i])} (${Math.round(((v?.values[i] ?? 0) / t.values[i]) * 100)}%)` : ''}`).join('; ')}.`;
  }
  if (type === 'histogram') return `Histogram of ${(m.series[0]?.values ?? []).filter((v) => v != null).length} values.`;
  const what = { line: 'Line chart', area: 'Area chart', bar: 'Bar chart' }[type] ?? 'Chart';
  const parts = m.series.map((s) => {
    const pts = s.values.map((v, i) => [v, i]).filter(([v]) => v != null);
    if (!pts.length) return `${s.name}: no values`;
    const [first] = pts;
    const last = pts.at(-1);
    const hi = pts.reduce((a, b) => (b[0] > a[0] ? b : a));
    const lo = pts.reduce((a, b) => (b[0] < a[0] ? b : a));
    const trend = last[0] > first[0] ? 'rose' : last[0] < first[0] ? 'fell' : 'held';
    return `${s.name} ${trend} from ${fmt(first[0])} to ${fmt(last[0])}, highest ${fmt(hi[0])} (${m.labels[hi[1]]}), lowest ${fmt(lo[0])} (${m.labels[lo[1]]})`;
  });
  return `${what}, ${n} points from ${m.labels[0]} to ${m.labels[n - 1]}. ${parts.join('. ')}.`;
}

function scatterGroups(m) {
  const gs = m.series[2];
  if (!gs || !gs.values.every((v) => v == null)) return [];
  return [...new Set(gs.texts)];
}

function histogramSummary(m, h, fmt) {
  const top = h.bins.reduce((a, b) => (b.n > a.n ? b : a), h.bins[0]);
  return `Histogram of ${h.total} values of ${m.series[0]?.name ?? 'the data'}, in ${h.bins.length} bins ${fmt(h.step)} wide, from ${fmt(h.bins[0].lo)} to ${fmt(h.bins.at(-1).hi)}. Most common: ${fmt(top.lo)} to ${fmt(top.hi)}, ${top.n} values.`;
}

/** Pearson's r for paired values, and a word for its strength. */
export function correlation(xs, ys) {
  const n = xs.length;
  if (n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0; let sxx = 0; let syy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i] - mx; const dy = ys[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  const r = sxy / Math.sqrt(sxx * syy || 1);
  const a = Math.abs(r);
  const word = a >= 0.7 ? 'strong' : a >= 0.4 ? 'moderate' : a >= 0.2 ? 'weak' : 'no clear';
  return { r, text: word === 'no clear' ? 'no clear relationship' : `a ${word} ${r > 0 ? 'positive' : 'negative'} relationship` };
}
