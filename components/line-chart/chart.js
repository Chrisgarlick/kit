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
import { formatter } from '../../core/scale.js';
import { renderChart, chartHeight } from '../../core/charts.js';

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
    min: { type: Number }, // fix the value axis, for charts that must compare (small multiples)
    max: { type: Number },
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
    // Redraw on the next frame, never inside the observer callback, so a
    // redraw that changes the box can't loop.
    let frame = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const w = Math.round(this.#plot.clientWidth);
        if (w && w !== this.#width) { this.#width = w; this.requestUpdate(); }
      });
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
    const H = chartHeight(type, m, this.#plot.clientHeight);
    // Funnels and bullets are as tall as their rows; others fill their box.
    if (type === 'funnel' || type === 'bullet') this.#plot.style.setProperty('block-size', `${H}px`);
    const label = m.title || this.getAttribute('aria-label') || `${type[0].toUpperCase() + type.slice(1)} chart`;
    this.#plot.setAttribute('aria-label', label);
    const out = renderChart(m, {
      type, width: this.#width, height: H, format: this.format, stacked: this.stacked, zero: this.zero,
      min: this.min, max: this.max, center: this.getAttribute('center'), bins: this.getAttribute('bins'),
    });
    this.#geom = out.geom;
    this.#summary.textContent = out.summary;
    this.#legend.innerHTML = legendHTML(out.legend);
    this.#plot.querySelector('svg')?.remove();
    this.#tip.insertAdjacentHTML('beforebegin', out.svg);
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

}

function legendHTML(legend) {
  if (legend?.scale) return `<li class="kit-chart-scale"><small>${esc(legend.scale[0])}</small><i></i><small>${esc(legend.scale[1])}</small></li>`;
  return (legend || []).map((it) => (it.target
    ? `<li class="kit-chart-legend-target"><span></span>${esc(it.label)}</li>`
    : `<li class="kit-s${(it.series % 6) + 1}"><span></span>${esc(it.label)}</li>`)).join('');
}

// The renderer's helpers, for anyone who imported them from here.
export { summarise, correlation, renderChart } from '../../core/charts.js';

KitChart.version = '0.1.0';
define('kit-chart', KitChart);
