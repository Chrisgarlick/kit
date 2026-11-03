// SPDX-License-Identifier: MIT
//
// Sorting for kit tables (no custom element):
//
//   <table class="kit-table" data-sortable>
//     <thead><tr><th>Name</th><th data-sort="number" data-numeric>Count</th><th data-sort="none">Notes</th></tr></thead>
//     <tbody><tr><td>…</td><td data-value="1024">1,024</td>…</tr></tbody>
//   </table>
//
// Each header's text becomes a button; pressing it sorts the rows by that
// column, ascending then descending, and sets aria-sort. A cell's data-value
// is used if it has one, else its text. data-sort on the header: "text"
// (default, natural order, so "Item 2" < "Item 10"), "number", "date", or
// "none" for a column that doesn't sort. `sort` fires on the table with
// detail { column, direction }. Importing it twice is harmless.

import { announce } from '../../core/a11y.js';

const KEY = Symbol.for('kit.tableSort');
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function cellValue(row, index, type) {
  const cell = row.cells[index];
  const raw = (cell?.dataset.value ?? cell?.textContent ?? '').trim();
  if (type === 'number') { const n = Number(raw.replace(/[^\d.eE+-]/g, '')); return Number.isNaN(n) ? -Infinity : n; }
  if (type === 'date') { const t = Date.parse(raw); return Number.isNaN(t) ? -Infinity : t; }
  return raw;
}

export function sortTable(table, index, direction) {
  const th = table.tHead.rows[0].cells[index];
  const type = th.dataset.sort || 'text';
  for (const h of table.tHead.rows[0].cells) h.removeAttribute('aria-sort');
  th.setAttribute('aria-sort', direction);
  const sign = direction === 'ascending' ? 1 : -1;
  for (const body of table.tBodies) {
    const rows = [...body.rows].map((r, i) => ({ r, i, v: cellValue(r, index, type) }));
    rows.sort((a, b) => {
      const c = type === 'text' ? collator.compare(a.v, b.v) : a.v - b.v;
      return c * sign || a.i - b.i; // stable for equal values
    });
    body.append(...rows.map((x) => x.r));
  }
  const name = th.textContent.trim();
  announce(`Sorted by ${name}, ${direction}`);
  table.dispatchEvent(new CustomEvent('sort', { bubbles: true, detail: { column: index, direction } }));
}

export function enhance(table) {
  if (table.dataset.kitSortReady || !table.tHead?.rows[0]) return;
  table.dataset.kitSortReady = '';
  [...table.tHead.rows[0].cells].forEach((th, i) => {
    if (th.dataset.sort === 'none' || th.querySelector('.kit-sort')) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'kit-sort';
    b.append(...th.childNodes);
    th.append(b);
    b.addEventListener('click', () => sortTable(table, i, th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending'));
  });
}

function install() {
  if (globalThis[KEY]) return;
  globalThis[KEY] = true;
  const all = (root) => { for (const t of root.querySelectorAll('table.kit-table[data-sortable]')) enhance(t); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => all(document), { once: true });
  else all(document);
  new MutationObserver((records) => {
    for (const r of records) for (const n of r.addedNodes) {
      if (n.nodeType !== 1) continue;
      if (n.matches('table.kit-table[data-sortable]')) enhance(n);
      all(n);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
}

install();
