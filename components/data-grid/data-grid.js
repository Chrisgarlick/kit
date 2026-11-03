// SPDX-License-Identifier: MIT
//
// <kit-data-grid>: a fast grid for large datasets (APG data grid).
//
//   <kit-data-grid label="Items"></kit-data-grid>
//   grid.columns = [
//     { key: 'name', label: 'Name', width: 220 },
//     { key: 'count', label: 'Count', format: 'number', align: 'end', sort: 'number' },
//     { key: 'status', label: 'Status', cell: (value, row) => badge(value) },
//   ];
//   grid.rows = [{ name: 'Item 1', count: 1024, status: 'Online' }, …];
//
// Only the rows in view are in the page, recycled as it scrolls, so 100,000
// rows cost the same as 100. Headers sort (text in natural order, number,
// date); `query` keeps the rows containing every word; one cell is current,
// moved with the arrow keys, Home and End, Page Up and Down, with focus on
// the grid and the cell as aria-activedescendant, so scrolling never loses
// it. Enter on a row fires `rowactivate` ({ row, index }); sorting fires
// `sort` ({ key, direction }).
//
// Column options: key, label, width (px number or CSS track), align
// ("end" for figures), format (number, compact, percent, currency:GBP, date),
// sort (text, number, date, none), cell(value, row) returning a Node or text.

import { KitElement } from '../../core/element.js';
import { define } from '../../core/define.js';
import { uid, announce } from '../../core/a11y.js';
import { formatter } from '../../core/scale.js';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const OVERSCAN = 6;
// Comparators on [key, index] pairs, closing over nothing (see table-sort.js).
const byText = (a, b) => collator.compare(a[0], b[0]) || a[1] - b[1];
const byTextDesc = (a, b) => collator.compare(b[0], a[0]) || a[1] - b[1];
const byNumber = (a, b) => a[0] - b[0] || a[1] - b[1];
const byNumberDesc = (a, b) => b[0] - a[0] || a[1] - b[1];
const norm = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

function formatFor(col) {
  if (col.format === 'date') {
    const f = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
    return (v) => (v == null || v === '' ? '' : f.format(new Date(v)));
  }
  if (!col.format) return (v) => (v == null ? '' : String(v));
  const f = formatter(col.format);
  return (v) => (v == null || v === '' ? '' : f(Number(v)));
}

export class KitDataGrid extends KitElement {
  static shadow = false;
  static props = {
    label: { type: String },
    query: { type: String },
  };
  static state = { columns: [], rows: [] };

  #grid = null;
  #head = null;
  #body = null;
  #window = null;
  #foot = null;
  #view = []; // indices into rows, filtered and sorted
  #texts = null; // per-row search text, built on first search
  #sort = null; // { col, direction }
  #active = { r: 0, c: 0 }; // r = -1 is the header row
  #rowH = 38;
  #frame = 0;
  #fmts = [];
  #pool = [];
  #queryTimer = 0;

  connected() {
    if (!this.#grid) this.#build();
    const on = { signal: this.signal };
    this.#grid.addEventListener('scroll', () => this.#schedule(), { ...on, passive: true });
    this.#grid.addEventListener('keydown', (e) => this.#key(e), on);
    this.#grid.addEventListener('click', (e) => this.#click(e), on);
    this.#grid.addEventListener('dblclick', (e) => {
      const r = e.target.closest('[data-r]');
      if (r && Number(r.dataset.r) >= 0) this.#activate(Number(r.dataset.r));
    }, on);
    this.#grid.addEventListener('focus', () => this.#paintActive(), on);
    const ro = new ResizeObserver(() => { this.#measure(); this.#schedule(); });
    ro.observe(this.#grid);
    this.signal.addEventListener('abort', () => ro.disconnect(), { once: true });
  }

  #build() {
    const grid = document.createElement('div');
    grid.className = 'kit-dg-scroll';
    grid.id = uid('kit-dg');
    grid.tabIndex = 0;
    grid.setAttribute('role', 'grid');
    const head = document.createElement('div');
    head.className = 'kit-dg-head';
    head.setAttribute('role', 'rowgroup');
    const body = document.createElement('div');
    body.className = 'kit-dg-body';
    body.setAttribute('role', 'rowgroup');
    const win = document.createElement('div');
    win.className = 'kit-dg-window';
    body.append(win);
    grid.append(head, body);
    const foot = document.createElement('p');
    foot.className = 'kit-dg-foot';
    this.append(grid, foot);
    this.#grid = grid;
    this.#head = head;
    this.#body = body;
    this.#window = win;
    this.#foot = foot;
  }

  updated(changed) {
    if (changed.has('label')) this.#grid.setAttribute('aria-label', this.label || 'Data');
    if (changed.has('columns')) { this.#fmts = this.columns.map(formatFor); this.#renderHead(); this.#pool = []; this.#window.replaceChildren(); }
    if (changed.has('rows')) this.#texts = null;
    if (changed.has('rows') || changed.has('columns') || changed.has('query')) {
      this.#recompute();
      if (changed.has('query') && !changed.has('rows')) {
        clearTimeout(this.#queryTimer);
        this.#queryTimer = setTimeout(() => announce(`${this.#view.length.toLocaleString()} ${this.#view.length === 1 ? 'row' : 'rows'}`), 500);
      }
    }
    this.#measure();
    this.#render();
  }

  /** The rows currently shown, in order (after the query and sort). */
  get visibleRows() { return this.#view.map((i) => this.rows[i]); }

  /** Sorts by a column key: 'ascending', 'descending', or null to unsort. */
  sortBy(key, direction = 'ascending') {
    const col = this.columns.findIndex((c) => c.key === key);
    this.#sort = col >= 0 && direction ? { col, direction } : null;
    this.#recompute();
    this.#renderHead();
    this.#render();
    if (this.#sort) {
      announce(`Sorted by ${this.columns[col].label ?? key}, ${direction}`);
      this.emit('sort', { key, direction });
    }
  }

  #recompute() {
    const rows = this.rows;
    let view = rows.map((_, i) => i);
    const words = norm(this.query || '').split(/\s+/).filter(Boolean);
    if (words.length) {
      this.#texts ??= rows.map((r) => norm(this.columns.map((c) => r[c.key]).join(' ')));
      view = view.filter((i) => words.every((w) => this.#texts[i].includes(w)));
    }
    if (this.#sort) {
      const col = this.columns[this.#sort.col];
      const kind = col.sort || 'text';
      const desc = this.#sort.direction === 'descending';
      const key = kind === 'number' ? (v) => { const n = Number(v); return Number.isFinite(n) ? n : -Infinity; }
        : kind === 'date' ? (v) => { const t = new Date(v).getTime(); return Number.isFinite(t) ? t : -Infinity; }
          : (v) => String(v ?? '');
      const pairs = view.map((i) => [key(rows[i][col.key]), i]);
      pairs.sort(kind === 'text' ? (desc ? byTextDesc : byText) : (desc ? byNumberDesc : byNumber));
      view = pairs.map((p) => p[1]);
    }
    this.#view = view;
    this.#active.r = Math.min(this.#active.r, view.length - 1);
    if (this.#active.r < 0 && view.length && this.#active.r !== -1) this.#active.r = 0;
    this.#grid.setAttribute('aria-rowcount', String(view.length + 1));
    this.#grid.setAttribute('aria-colcount', String(this.columns.length));
    this.#body.style.setProperty('--kit-dg-total', `${view.length * this.#rowH}px`);
    this.#foot.textContent = words.length
      ? `${view.length.toLocaleString()} of ${rows.length.toLocaleString()} rows`
      : `${rows.length.toLocaleString()} ${rows.length === 1 ? 'row' : 'rows'}`;
  }

  #measure() {
    const h = parseFloat(getComputedStyle(this).getPropertyValue('--kit-dg-row')) || 38;
    if (h !== this.#rowH) {
      this.#rowH = h;
      this.#body.style.setProperty('--kit-dg-total', `${this.#view.length * h}px`);
    }
    const tracks = this.columns.map((c) => (typeof c.width === 'number' ? `${c.width}px` : c.width || 'minmax(8rem, 1fr)'));
    const min = this.columns.reduce((a, c) => a + (typeof c.width === 'number' ? c.width : 128), 0);
    this.#grid.style.setProperty('--kit-dg-cols', tracks.join(' ') || '1fr');
    this.#grid.style.setProperty('--kit-dg-min', `${min}px`);
  }

  #renderHead() {
    const row = document.createElement('div');
    row.className = 'kit-dg-row';
    row.setAttribute('role', 'row');
    row.setAttribute('aria-rowindex', '1');
    row.dataset.r = '-1';
    this.columns.forEach((c, j) => {
      const h = document.createElement('div');
      h.className = `kit-dg-cell${c.align === 'end' ? ' kit-dg-end' : ''}`;
      h.setAttribute('role', 'columnheader');
      h.setAttribute('aria-colindex', String(j + 1));
      h.id = `${this.#grid.id}-h-${j}`;
      h.dataset.c = String(j);
      if (c.sort !== 'none') h.dataset.sortable = '';
      if (this.#sort?.col === j) h.setAttribute('aria-sort', this.#sort.direction);
      h.textContent = c.label ?? c.key;
      row.append(h);
    });
    this.#head.replaceChildren(row);
  }

  #schedule() {
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(() => this.#render());
  }

  // Draws the rows in view, reusing the same row elements.
  #render() {
    const grid = this.#grid;
    const rowH = this.#rowH;
    const headH = this.#head.offsetHeight;
    const top = Math.max(0, grid.scrollTop - headH);
    const first = Math.max(0, Math.floor(top / rowH) - OVERSCAN);
    const count = Math.min(this.#view.length - first, Math.ceil((grid.clientHeight || 400) / rowH) + OVERSCAN * 2);
    this.#window.style.setProperty('--kit-dg-offset', `${first * rowH}px`);
    const cols = this.columns;
    while (this.#pool.length < count) {
      const row = document.createElement('div');
      row.className = 'kit-dg-row';
      row.setAttribute('role', 'row');
      for (let j = 0; j < cols.length; j++) {
        const cell = document.createElement('div');
        cell.className = `kit-dg-cell${cols[j].align === 'end' ? ' kit-dg-end' : ''}`;
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-colindex', String(j + 1));
        cell.dataset.c = String(j);
        row.append(cell);
      }
      this.#pool.push(row);
      this.#window.append(row);
    }
    this.#pool.forEach((row, k) => {
      if (k >= count) { row.hidden = true; return; }
      row.hidden = false;
      const r = first + k;
      const data = this.rows[this.#view[r]];
      if (row.dataset.r === String(r) && row._data === data) return; // already showing this row
      row.dataset.r = String(r);
      row._data = data;
      row.setAttribute('aria-rowindex', String(r + 2));
      for (let j = 0; j < cols.length; j++) {
        const cell = row.children[j];
        cell.id = `${grid.id}-${r}-${j}`;
        const v = data[cols[j].key];
        if (cols[j].cell) {
          const out = cols[j].cell(v, data);
          if (out instanceof Node) cell.replaceChildren(out);
          else cell.textContent = out ?? '';
        } else cell.textContent = this.#fmts[j](v);
      }
    });
    this.#paintActive();
  }

  #cellId(r, c) {
    return r < 0 ? `${this.#grid.id}-h-${c}` : `${this.#grid.id}-${r}-${c}`;
  }

  #paintActive() {
    const { r, c } = this.#active;
    this.#grid.querySelector('[data-active]')?.removeAttribute('data-active');
    const el = document.getElementById(this.#cellId(r, c));
    if (el && this.#grid.contains(el) && !el.closest('[hidden]')) {
      el.setAttribute('data-active', '');
      this.#grid.setAttribute('aria-activedescendant', el.id);
    } else this.#grid.removeAttribute('aria-activedescendant');
  }

  #moveTo(r, c) {
    const last = this.#view.length - 1;
    r = Math.max(-1, Math.min(last, r));
    c = Math.max(0, Math.min(this.columns.length - 1, c));
    this.#active = { r, c };
    // Keep the current cell in view, below the sticky header.
    const grid = this.#grid;
    const headH = this.#head.offsetHeight;
    if (r >= 0) {
      const y = headH + r * this.#rowH;
      if (y < grid.scrollTop + headH) grid.scrollTop = y - headH;
      else if (y + this.#rowH > grid.scrollTop + grid.clientHeight) grid.scrollTop = y + this.#rowH - grid.clientHeight;
    } else grid.scrollTop = 0;
    this.#render();
    const el = document.getElementById(this.#cellId(r, c));
    if (el) {
      const x = el.offsetLeft;
      if (x < grid.scrollLeft) grid.scrollLeft = x;
      else if (x + el.offsetWidth > grid.scrollLeft + grid.clientWidth) grid.scrollLeft = x + el.offsetWidth - grid.clientWidth;
    }
  }

  #key(e) {
    const { r, c } = this.#active;
    const page = Math.max(1, Math.floor((this.#grid.clientHeight - this.#head.offsetHeight) / this.#rowH) - 1);
    const lastC = this.columns.length - 1;
    const ctrl = e.ctrlKey || e.metaKey;
    const rtl = getComputedStyle(this).direction === 'rtl';
    switch (e.key) {
      case 'ArrowDown': this.#moveTo(r + 1, c); break;
      case 'ArrowUp': this.#moveTo(r - 1, c); break;
      case 'ArrowRight': this.#moveTo(r, c + (rtl ? -1 : 1)); break;
      case 'ArrowLeft': this.#moveTo(r, c + (rtl ? 1 : -1)); break;
      case 'Home': this.#moveTo(ctrl ? 0 : r, 0); break;
      case 'End': this.#moveTo(ctrl ? this.#view.length - 1 : r, lastC); break;
      case 'PageDown': this.#moveTo(Math.max(0, r) + page, c); break;
      case 'PageUp': this.#moveTo(r - page, c); break;
      case 'Enter': case ' ':
        if (r < 0) this.#toggleSort(c);
        else if (e.key === 'Enter') this.#activate(r);
        else return;
        break;
      default: return;
    }
    e.preventDefault();
  }

  #click(e) {
    const cell = e.target.closest('[data-c]');
    const row = e.target.closest('[data-r]');
    if (!cell || !row) return;
    const r = Number(row.dataset.r);
    const c = Number(cell.dataset.c);
    this.#active = { r, c };
    if (r < 0) this.#toggleSort(c);
    else this.#paintActive();
  }

  #toggleSort(c) {
    const col = this.columns[c];
    if (!col || col.sort === 'none') return;
    const next = this.#sort?.col === c && this.#sort.direction === 'ascending' ? 'descending' : 'ascending';
    this.sortBy(col.key, next);
  }

  #activate(r) {
    const index = this.#view[r];
    if (index == null) return;
    this.emit('rowactivate', { row: this.rows[index], index });
  }
}

KitDataGrid.version = '0.1.0';
define('kit-data-grid', KitDataGrid);
