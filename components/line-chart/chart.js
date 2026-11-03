// SPDX-License-Identifier: MIT
//
// <kit-chart>: line, area, bar and donut charts drawn from a table.
//
//   <kit-chart type="line" format="compact">
//     <table>
//       <caption>Title</caption>
//       <thead><tr><th>Month</th><th>Series A</th><th>Series B</th></tr></thead>
//       <tbody><tr><th>Jan</th><td>120</td><td>80</td></tr> …</tbody>
//     </table>
//   </kit-chart>
//
// The table is the data: the first column labels the points, each other
// column is a series (a cell's data-value wins over its text). Without the
// script, people see the table. With it, an SVG chart is drawn, sized to its
// box, with a legend, a text summary, values on hover and from the arrow
// keys, and a button that shows the table. Set `data` ({ labels, series:
// [{ name, values }] }) to draw from script instead.
//
//   type      line (default), area, bar, donut
//   stacked   bars on top of each other instead of side by side
//   format    number (default), compact, percent, currency:GBP
//   zero      start the value axis at zero (always on for bars)

import { KitElement } from '../../core/element.js';
import { define } from '../../core/define.js';
import { uid, announce } from '../../core/a11y.js';
import { niceTicks, linear, formatter } from '../../core/scale.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const num = (cell) => {
  const raw = (cell?.dataset.value ?? cell?.textContent ?? '').trim();
  const digits = raw.replace(/[^\d.eE+-]/g, '');
  if (!/\d/.test(digits)) return null; // text such as a group name, not a number
  const n = Number(digits);
  return Number.isNaN(n) ? null : n;
};

/** Reads { title, labels, series } from a table. */
export function tableData(table) {
  const head = table.tHead?.rows[0] ?? table.rows[0];
  const names = [...head.cells].slice(1).map((c) => c.textContent.trim());
  const rows = [...(table.tBodies[0]?.rows ?? [])];
  return {
    title: table.caption?.textContent.trim() ?? '',
    labels: rows.map((r) => r.cells[0]?.textContent.trim() ?? ''),
    series: names.map((name, i) => ({
      name,
      values: rows.map((r) => num(r.cells[i + 1])),
      texts: rows.map((r) => r.cells[i + 1]?.textContent.trim() ?? ''),
    })),
  };
}

export class KitChart extends KitElement {
  static shadow = false;
  static props = {
    type: { type: String },
    stacked: { type: Boolean },
    format: { type: String },
    zero: { type: Boolean },
  };
  static state = { data: null, active: -1 };

  #plot = null;
  #tip = null;
  #legend = null;
  #summary = null;
  #toggle = null;
  #wrap = null;
  #geom = null; // what the pointer and keys need from the last draw
  #width = 0;
  #histo = null; // the last histogram's bins, for the summary

  get table() { return this.querySelector(':scope > table, :scope > .kit-chart-table > table'); }

  #model() {
    const d = this.data ?? (this.table ? tableData(this.table) : null);
    return d && d.labels?.length ? d : null;
  }

  connected() {
    if (!this.#plot) this.#build();
    const ro = new ResizeObserver(() => {
      const w = Math.round(this.#plot.clientWidth);
      if (w && w !== this.#width) { this.#width = w; this.requestUpdate(); }
    });
    ro.observe(this.#plot);
    this.signal.addEventListener('abort', () => ro.disconnect(), { once: true });
    const on = { signal: this.signal };
    this.#plot.addEventListener('pointermove', (e) => this.#point(e), on);
    this.#plot.addEventListener('pointerleave', () => { this.active = -1; }, on);
    this.#plot.addEventListener('keydown', (e) => this.#key(e), on);
    this.#plot.addEventListener('blur', () => { this.active = -1; }, on);
    this.#toggle.addEventListener('click', () => {
      const show = this.#wrap.classList.toggle('kit-chart-table-shown');
      this.#toggle.setAttribute('aria-expanded', String(show));
      this.#toggle.textContent = show ? 'Hide table' : 'Show table';
    }, on);
    // Redraw when the table changes.
    const mo = new MutationObserver(() => this.requestUpdate());
    if (this.table) mo.observe(this.table, { subtree: true, childList: true, characterData: true, attributes: true });
    this.signal.addEventListener('abort', () => mo.disconnect(), { once: true });
  }

  #build() {
    const table = this.table;
    this.#wrap = document.createElement('div');
    this.#wrap.className = 'kit-chart-table kit-table-wrap';
    if (table) {
      table.classList.add('kit-table');
      table.before(this.#wrap);
      this.#wrap.append(table);
      this.#wrap.id = uid('kit-chart-table');
    }
    this.#plot = document.createElement('div');
    this.#plot.className = 'kit-chart-plot';
    this.#plot.tabIndex = 0;
    this.#plot.setAttribute('role', 'group');
    this.#plot.setAttribute('aria-roledescription', 'chart');
    this.#summary = document.createElement('p');
    this.#summary.className = 'kit-chart-summary';
    this.#summary.id = uid('kit-chart-summary');
    this.#plot.setAttribute('aria-describedby', this.#summary.id);
    this.#tip = document.createElement('div');
    this.#tip.className = 'kit-chart-tip';
    this.#tip.hidden = true;
    this.#tip.setAttribute('aria-hidden', 'true');
    this.#legend = document.createElement('ul');
    this.#legend.className = 'kit-chart-legend';
    this.#toggle = document.createElement('button');
    this.#toggle.type = 'button';
    this.#toggle.className = 'kit-chart-toggle';
    this.#toggle.textContent = 'Show table';
    this.#toggle.setAttribute('aria-expanded', 'false');
    if (table) this.#toggle.setAttribute('aria-controls', this.#wrap.id);
    this.#plot.append(this.#tip);
    const foot = document.createElement('div');
    foot.className = 'kit-chart-foot';
    foot.append(this.#legend, ...(table ? [this.#toggle] : []));
    this.prepend(this.#plot, foot, this.#summary);
    if (table) foot.after(this.#wrap);
  }

  updated(changed) {
    const m = this.#model();
    if (!m || !this.#width) return;
    if (changed.has('active') && changed.size === 1 && this.#geom) { this.#highlight(m); return; }
    this.#draw(m);
    this.#highlight(m);
  }

  #draw(m) {
    const type = this.type || 'line';
    const fmt = formatter(this.format || 'number');
    const W = this.#width;
    const H = Math.max(120, Math.round(this.#plot.clientHeight) || 240);
    const label = m.title || this.getAttribute('aria-label') || `${type[0].toUpperCase() + type.slice(1)} chart`;
    this.#plot.setAttribute('aria-label', label);
    this.#legend.innerHTML = type === 'scatter' ? scatterLegend(m) : m.series.length > 1 || type === 'donut'
      ? (type === 'donut' ? m.labels : m.series.map((s) => s.name)).map((n, i) => `<li class="kit-s${(i % 6) + 1}"><span></span>${esc(n)}</li>`).join('')
      : '';
    const draw = { donut: () => this.#donut(m, W, H, fmt), scatter: () => this.#scatter(m, W, H), histogram: () => this.#histogram(m, W, H), heatmap: () => this.#heatmap(m, W, H, fmt) }[type];
    if (type === 'heatmap') this.#legend.innerHTML = '';
    if (type === 'histogram') this.#legend.innerHTML = '';
    const svg = draw ? draw() : this.#cartesian(m, type, W, H);
    this.#summary.textContent = type === 'histogram' && this.#histo ? histogramSummary(m, this.#histo, fmt) : summarise(m, type, fmt);
    this.#plot.querySelector('svg')?.remove();
    this.#tip.insertAdjacentHTML('beforebegin', svg);
  }

  #cartesian(m, type, W, H) {
    const bar = type === 'bar';
    const stacked = bar && this.stacked;
    const n = m.labels.length;
    const vals = m.series.flatMap((s) => s.values).filter((v) => v != null);
    let lo = Math.min(...vals);
    let hi = Math.max(...vals);
    if (stacked) {
      const sums = m.labels.map((_, i) => m.series.reduce((a, s) => a + Math.max(0, s.values[i] ?? 0), 0));
      hi = Math.max(...sums);
      lo = Math.min(0, ...m.labels.map((_, i) => m.series.reduce((a, s) => a + Math.min(0, s.values[i] ?? 0), 0)));
    }
    if (bar || this.zero || type === 'area') { lo = Math.min(0, lo); hi = Math.max(0, hi); }
    const axis = formatter(this.format === 'percent' ? 'percent' : (Math.abs(hi) >= 10000 || this.format === 'compact') ? 'compact' : this.format || 'number');
    const y = niceTicks(lo, hi, Math.max(2, Math.round(H / 56)));
    const left = 10 + Math.max(...y.ticks.map((t) => axis(t).length)) * 7;
    const top = 10;
    const bottom = H - 26;
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
      out.push(`<text class="kit-chart-tick" x="${sx(i).toFixed(1)}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`);
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
          out.push(`<rect class="kit-s${(j % 6) + 1} kit-chart-bar" data-i="${i}" x="${x.toFixed(1)}" y="${yTop.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(3, w / 4).toFixed(1)}"/>`);
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
            out.push(`<path class="${cls} kit-chart-area" d="${d}L${r.at(-1)[0].toFixed(1)} ${base}L${r[0][0].toFixed(1)} ${base}Z"/>`);
          }
          out.push(`<path class="${cls} kit-chart-line" d="${d}"/>`);
        }
      });
    }
    out.push('</svg>');
    this.#geom = { kind: bar ? 'bar' : 'line', n, sx, sy, left, right, top, bottom, band };
    return out.join('');
  }

  #donut(m, W, H, fmt) {
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
        out.push(`<path class="kit-s${(i % 6) + 1} kit-chart-slice" data-i="${i}" d="${d}"/>`);
      }
      a0 = a1;
    });
    // center="first" shows the first part instead of the total, for a donut used as a gauge.
    const middle = this.getAttribute('center') === 'first' ? vals[0] ?? 0 : vals.reduce((a, b) => a + b, 0);
    out.push(`<text class="kit-chart-total" x="${cx}" y="${cy - 4}" text-anchor="middle">${esc(fmt(middle))}</text>`,
      `<text class="kit-chart-tick" x="${cx}" y="${cy + 16}" text-anchor="middle">${esc(m.series[0]?.name || 'Total')}</text>`, '</svg>');
    this.#geom = { kind: 'donut', n: vals.length, cx, cy, r, ri, arcs, total };
    return out.join('');
  }

  #point(e) {
    const g = this.#geom;
    if (!g) return;
    const box = this.#plot.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    let i = -1;
    if (g.hit) i = g.hit(x, y);
    else if (g.kind === 'bar') i = Math.floor((x - g.left) / g.band);
    else if (g.kind === 'line') i = Math.round(((x - g.left - 4) / (g.right - g.left - 8)) * (g.n - 1));
    else {
      const d = Math.hypot(x - g.cx, y - g.cy);
      if (d >= g.ri && d <= g.r) {
        let a = Math.atan2(y - g.cy, x - g.cx);
        if (a < -Math.PI / 2) a += Math.PI * 2;
        i = g.arcs.findIndex(([a0, a1]) => a >= a0 && a < a1);
      }
    }
    this.active = i >= 0 && i < g.n ? i : -1;
  }

  #key(e) {
    const g = this.#geom;
    if (!g) return;
    let i = this.active;
    const across = g.cols ?? 1; // heatmaps move by rows with up and down
    if (e.key === 'ArrowRight') i = i < 0 ? 0 : Math.min(g.n - 1, i + 1);
    else if (e.key === 'ArrowLeft') i = i < 0 ? g.n - 1 : Math.max(0, i - 1);
    else if (e.key === 'ArrowDown') i = i < 0 ? 0 : Math.min(g.n - 1, i + across);
    else if (e.key === 'ArrowUp') i = i < 0 ? g.n - 1 : Math.max(0, i - across);
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = g.n - 1;
    else if (e.key === 'Escape') i = -1;
    else return;
    e.preventDefault();
    this.active = i;
    if (i >= 0) announce(this.#describe(this.#model(), i));
  }

  #describe(m, i) {
    if (this.#geom?.say) return this.#geom.say(i);
    const fmt = formatter(this.format || 'number');
    if (this.#geom?.kind === 'donut') {
      const v = m.series[0].values[i] ?? 0;
      return `${m.labels[i]}: ${fmt(v)}, ${Math.round((v / this.#geom.total) * 100)}%`;
    }
    return `${m.labels[i]}: ${m.series.map((s) => `${m.series.length > 1 ? `${s.name} ` : ''}${s.values[i] == null ? 'no value' : fmt(s.values[i])}`).join(', ')}`;
  }

  #highlight(m) {
    const g = this.#geom;
    const svg = this.#plot.querySelector('svg');
    if (!g || !svg) return;
    const i = this.active;
    const hover = svg.querySelector('.kit-chart-hover');
    if (g.kind !== 'heatmap') for (const el of svg.querySelectorAll('[data-i]')) el.classList.toggle('kit-chart-dim', i >= 0 && el.dataset.i !== String(i));
    if (hover) hover.innerHTML = '';
    if (i < 0) { this.#tip.hidden = true; return; }
    const fmt = formatter(this.format || 'number');
    let tx;
    let ty;
    if (g.mark) {
      const k = g.mark(i);
      hover.innerHTML = k.svg;
      this.#tip.innerHTML = k.tip;
      this.#tip.hidden = false;
      this.#placeTip(k.x, k.y);
      return;
    }
    if (g.kind === 'line') {
      const x = g.sx(i);
      hover.innerHTML = `<line class="kit-chart-cross" x1="${x}" x2="${x}" y1="${g.top}" y2="${g.bottom}"/>` + m.series.map((s, j) => (s.values[i] == null ? '' : `<circle class="kit-s${(j % 6) + 1} kit-chart-dot" cx="${x}" cy="${g.sy(s.values[i]).toFixed(1)}" r="4"/>`)).join('');
      tx = x; ty = g.top;
    } else if (g.kind === 'bar') {
      hover.innerHTML = `<rect class="kit-chart-band" x="${(g.left + g.band * i).toFixed(1)}" y="${g.top}" width="${g.band.toFixed(1)}" height="${g.bottom - g.top}"/>`;
      tx = g.sx(i); ty = g.top;
    } else {
      const [a0, a1] = g.arcs[i];
      const a = (a0 + a1) / 2;
      tx = g.cx + Math.cos(a) * g.r; ty = g.cy + Math.sin(a) * g.r;
    }
    const rows = g.kind === 'donut'
      ? `<p class="kit-s${(i % 6) + 1}"><span></span>${esc(fmt(m.series[0].values[i] ?? 0))}<b>${Math.round(((m.series[0].values[i] ?? 0) / g.total) * 100)}%</b></p>`
      : m.series.map((s, j) => `<p class="kit-s${(j % 6) + 1}"><span></span>${m.series.length > 1 ? esc(s.name) : ''}<b>${s.values[i] == null ? '–' : esc(fmt(s.values[i]))}</b></p>`).join('');
    this.#tip.innerHTML = `<p class="kit-chart-tip-label">${esc(m.labels[i])}</p>${rows}`;
    this.#tip.hidden = false;
    this.#placeTip(tx, ty);
  }

  #placeTip(tx, ty) {
    const w = this.#tip.offsetWidth;
    const left = Math.max(4, Math.min(this.#width - w - 4, tx + 12 > this.#width - w ? tx - w - 12 : tx + 12));
    this.#tip.style.setProperty('left', `${left}px`);
    this.#tip.style.setProperty('top', `${Math.max(0, ty)}px`);
  }

  // Axes shared by scatter and histogram: grid lines and value ticks for y,
  // ticks along x.
  #axes(out, x, y, sx, sy, box, fx, fy) {
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

  #box(y, H, W, fy, titles) {
    const left = 10 + Math.max(...y.ticks.map((t) => fy(t).length)) * 7;
    return { left, right: W - 12, top: titles ? 22 : 10, bottom: H - (titles ? 38 : 26) };
  }

  #scatter(m, W, H) {
    const [xs, ys, gs] = m.series;
    const groupNames = gs && gs.values.every((v) => v == null) ? [...new Set(gs.texts)] : [];
    const pts = m.labels.map((label, i) => ({ label, x: xs?.values[i], y: ys?.values[i], g: groupNames.length ? groupNames.indexOf(gs.texts[i]) : 0 }))
      .filter((p) => p.x != null && p.y != null)
      .sort((a, b) => a.x - b.x);
    const fx = formatter(this.format === 'percent' ? 'percent' : 'compact');
    const fy = fx;
    const fmt = formatter(this.format || 'number');
    const x = niceTicks(Math.min(...pts.map((p) => p.x)), Math.max(...pts.map((p) => p.x)), Math.max(2, Math.round(W / 90)));
    const y = niceTicks(Math.min(...pts.map((p) => p.y)), Math.max(...pts.map((p) => p.y)), Math.max(2, Math.round(H / 56)));
    const box = this.#box(y, H, W, fy, true);
    const sx = linear(x.min, x.max, box.left + 6, box.right - 6);
    const sy = linear(y.min, y.max, box.bottom, box.top);
    const out = [`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false">`];
    this.#axes(out, x, y, sx, sy, box, fx, fy);
    out.push(`<text class="kit-chart-tick kit-chart-axis-title" x="${box.right}" y="${H - 4}" text-anchor="end">${esc(xs?.name ?? 'x')} →</text>`,
      `<text class="kit-chart-tick kit-chart-axis-title" x="${box.left}" y="10" text-anchor="start">↑ ${esc(ys?.name ?? 'y')}</text>`,
      '<g class="kit-chart-hover"></g>');
    pts.forEach((p, i) => {
      out.push(`<circle class="kit-s${(p.g % 6) + 1} kit-chart-point" data-i="${i}" cx="${sx(p.x).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="4.5"/>`);
    });
    out.push('</svg>');
    const describe = (i) => {
      const p = pts[i];
      return `${p.label}: ${xs.name} ${fmt(p.x)}, ${ys.name} ${fmt(p.y)}${groupNames.length ? `, ${groupNames[p.g]}` : ''}`;
    };
    this.#geom = {
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

  #histogram(m, W, H) {
    const vals = (m.series[0]?.values ?? []).filter((v) => v != null);
    const fmt = formatter(this.format || 'number');
    const want = Number(this.getAttribute('bins')) || Math.ceil(Math.log2(Math.max(1, vals.length))) + 1;
    const edges = niceTicks(Math.min(...vals), Math.max(...vals), want);
    const bins = edges.ticks.slice(0, -1).map((lo, i) => ({ lo, hi: edges.ticks[i + 1], n: 0 }));
    for (const v of vals) {
      const i = Math.min(bins.length - 1, Math.floor((v - edges.min) / edges.step));
      bins[Math.max(0, i)].n++;
    }
    const y = niceTicks(0, Math.max(1, ...bins.map((b) => b.n)), Math.max(2, Math.round(H / 56)));
    const count = formatter('number');
    const box = this.#box(y, H, W, count, true);
    const sx = linear(edges.min, edges.max, box.left, box.right);
    const sy = linear(0, y.max, box.bottom, box.top);
    const out = [`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false">`];
    this.#axes(out, { ticks: edges.ticks }, y, sx, sy, box, formatter(this.format === 'percent' ? 'percent' : 'compact'), count);
    out.push(`<text class="kit-chart-tick kit-chart-axis-title" x="${box.right}" y="${H - 4}" text-anchor="end">${esc(m.series[0]?.name ?? 'Value')} →</text>`,
      `<text class="kit-chart-tick kit-chart-axis-title" x="${box.left}" y="10">↑ Count</text>`, '<g class="kit-chart-hover"></g>');
    bins.forEach((b, i) => {
      const x0 = sx(b.lo) + 1;
      const x1 = sx(b.hi) - 1;
      const y1 = sy(b.n);
      if (b.n) out.push(`<rect class="kit-s1 kit-chart-bar" data-i="${i}" x="${x0.toFixed(1)}" y="${y1.toFixed(1)}" width="${Math.max(1, x1 - x0).toFixed(1)}" height="${Math.max(1, box.bottom - y1).toFixed(1)}" rx="2"/>`);
    });
    out.push('</svg>');
    const range = (b) => `${fmt(b.lo)} to ${fmt(b.hi)}`;
    this.#geom = {
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
    this.#histo = { bins, total: vals.length, step: edges.step };
    return out.join('');
  }

  #heatmap(m, W, H, fmt) {
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
      out.push(`<rect class="kit-chart-heat${v == null ? ' kit-chart-empty' : ''}" data-i="${i * cols.length + j}" x="${x.toFixed(1)}" y="${yy.toFixed(1)}" width="${(cw - 2).toFixed(1)}" height="${(ch - 2).toFixed(1)}" rx="3" fill-opacity="${v == null ? 1 : (0.1 + t * 0.9).toFixed(3)}"/>`);
      if (showValues && v != null) out.push(`<text class="kit-chart-heat-value${t > 0.55 ? ' kit-chart-heat-on' : ''}" x="${(x + cw / 2 - 1).toFixed(1)}" y="${(yy + ch / 2 - 1).toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${esc(formatter('compact')(v))}</text>`);
    }));
    out.push('<g class="kit-chart-hover"></g></svg>');
    this.#legend.innerHTML = `<li class="kit-chart-scale"><small>${esc(fmt(lo))}</small><i></i><small>${esc(fmt(hi))}</small></li>`;
    const say = (k) => { const i = Math.floor(k / cols.length); const j = k % cols.length; const v = m.series[j].values[i]; return `${rows[i]}, ${cols[j]}: ${v == null ? 'no value' : fmt(v)}`; };
    this.#geom = {
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

function scatterLegend(m) {
  const gs = m.series[2];
  if (!gs || !gs.values.every((v) => v == null)) return '';
  return [...new Set(gs.texts)].map((n, i) => `<li class="kit-s${(i % 6) + 1}"><span></span>${esc(n)}</li>`).join('');
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

KitChart.version = '0.1.0';
define('kit-chart', KitChart);
