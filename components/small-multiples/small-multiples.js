// SPDX-License-Identifier: MIT
//
// <kit-multiples>: one small chart per series, on one shared scale, from
// one table, so series can be compared without a tangle of lines.
//
//   <kit-multiples type="line" format="compact">
//     <table>…the same shape as a kit-chart's table…</table>
//   </kit-multiples>
//
// Each series gets its own <kit-chart> (line by default, or area or bar),
// named after it, in a grid; every one shares the same value axis, which is
// what makes them comparable. The table stays for screen readers, behind
// "Show table".

import { KitElement } from '../../core/element.js';
import { define } from '../../core/define.js';
import { uid } from '../../core/a11y.js';
import { niceTicks } from '../../core/scale.js';
import { tableData } from '../line-chart/chart.js';

export class KitMultiples extends KitElement {
  static shadow = false;
  static props = { type: { type: String }, format: { type: String } };

  #grid = null;

  connected() {
    const table = this.querySelector(':scope > table');
    if (!table || this.#grid) return;
    const d = tableData(table);
    const vals = d.series.flatMap((s) => s.values).filter((v) => v != null);
    const type = this.type || 'line';
    const y = niceTicks(type === 'line' ? Math.min(...vals) : Math.min(0, ...vals), Math.max(...vals), 4);
    const head = document.createElement('div');
    head.className = 'kit-multiples-head';
    if (d.title) {
      const t = document.createElement('p');
      t.className = 'kit-multiples-title';
      t.textContent = d.title;
      head.append(t);
    }
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'kit-chart-toggle';
    toggle.textContent = 'Show table';
    toggle.setAttribute('aria-expanded', 'false');
    const wrap = document.createElement('div');
    wrap.className = 'kit-chart-table kit-table-wrap';
    wrap.id = uid('kit-multiples-table');
    toggle.setAttribute('aria-controls', wrap.id);
    table.classList.add('kit-table');
    table.before(wrap);
    wrap.append(table);
    head.append(toggle);
    toggle.addEventListener('click', () => {
      const show = wrap.classList.toggle('kit-chart-table-shown');
      toggle.setAttribute('aria-expanded', String(show));
      toggle.textContent = show ? 'Hide table' : 'Show table';
    });
    const grid = document.createElement('div');
    grid.className = 'kit-multiples-grid';
    d.series.forEach((s, i) => {
      const c = document.createElement('kit-chart');
      c.setAttribute('type', type);
      if (this.format) c.setAttribute('format', this.format);
      c.setAttribute('min', String(y.min));
      c.setAttribute('max', String(y.max));
      c.className = `kit-multiples-chart kit-s${(i % 6) + 1}`;
      c.data = { title: s.name, labels: d.labels, series: [s] };
      const name = document.createElement('p');
      name.className = 'kit-multiples-name';
      name.textContent = s.name;
      const cell = document.createElement('div');
      cell.className = 'kit-multiples-cell';
      cell.append(name, c);
      grid.append(cell);
    });
    this.prepend(head, grid);
    this.#grid = grid;
  }
}

KitMultiples.version = '0.1.0';
define('kit-multiples', KitMultiples);
