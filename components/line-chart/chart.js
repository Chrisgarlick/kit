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
  const n = Number(raw.replace(/[^\d.eE+-]/g, ''));
  return raw === '' || Number.isNaN(n) ? null : n;
};

/** Reads { title, labels, series } from a table. */
export function tableData(table) {
  const head = table.tHead?.rows[0] ?? table.rows[0];
  const names = [...head.cells].slice(1).map((c) => c.textContent.trim());
  const rows = [...(table.tBodies[0]?.rows ?? [])];
  return {
    title: table.caption?.textContent.trim() ?? '',
    labels: rows.map((r) => r.cells[0]?.textContent.trim() ?? ''),
    series: names.map((name, i) => ({ name, values: rows.map((r) => num(r.cells[i + 1])) })),
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
    const label = m.title || this.getAttribute('aria-label') || `${type === 'donut' ? 'Donut' : type[0].toUpperCase() + type.slice(1)} chart`;
    this.#plot.setAttribute('aria-label', label);
    this.#summary.textContent = summarise(m, type, fmt);
    this.#legend.innerHTML = m.series.length > 1 || type === 'donut'
      ? (type === 'donut' ? m.labels : m.series.map((s) => s.name)).map((n, i) => `<li class="kit-s${(i % 6) + 1}"><span></span>${esc(n)}</li>`).join('')
      : '';
    const svg = type === 'donut' ? this.#donut(m, W, H, fmt) : this.#cartesian(m, type, W, H);
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
    out.push(`<text class="kit-chart-total" x="${cx}" y="${cy - 4}" text-anchor="middle">${esc(fmt(vals.reduce((a, b) => a + b, 0)))}</text>`,
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
    if (g.kind === 'bar') i = Math.floor((x - g.left) / g.band);
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
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') i = i < 0 ? 0 : Math.min(g.n - 1, i + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') i = i < 0 ? g.n - 1 : Math.max(0, i - 1);
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = g.n - 1;
    else if (e.key === 'Escape') i = -1;
    else return;
    e.preventDefault();
    this.active = i;
    if (i >= 0) announce(this.#describe(this.#model(), i));
  }

  #describe(m, i) {
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
    for (const el of svg.querySelectorAll('[data-i]')) el.classList.toggle('kit-chart-dim', i >= 0 && el.dataset.i !== String(i));
    if (hover) hover.innerHTML = '';
    if (i < 0) { this.#tip.hidden = true; return; }
    const fmt = formatter(this.format || 'number');
    let tx;
    let ty;
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
    const w = this.#tip.offsetWidth;
    const left = Math.max(4, Math.min(this.#width - w - 4, tx + 12 > this.#width - w ? tx - w - 12 : tx + 12));
    this.#tip.style.setProperty('left', `${left}px`);
    this.#tip.style.setProperty('top', `${Math.max(0, ty)}px`);
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

KitChart.version = '0.1.0';
define('kit-chart', KitChart);
