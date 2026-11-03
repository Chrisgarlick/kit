// SPDX-License-Identifier: MIT
//
// File drop: for a label.kit-drop around a native file input, adds
// dropping files onto it (filtered by accept, and appended when the input
// is multiple), and a list after it of the chosen files, with sizes and a
// remove button each. The input's files always match the list, so the form
// submits what's shown. Importing it twice is harmless.

import { announce } from '../../core/a11y.js';

const KEY = Symbol.for('kit.drop');
const X = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m4.5 4.5 7 7m0-7-7 7"/></svg>';
const size = (n) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`);

function accepts(input, file) {
  const rules = (input.accept || '').split(',').map((r) => r.trim().toLowerCase()).filter(Boolean);
  if (!rules.length) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return rules.some((r) => (r.startsWith('.') ? name.endsWith(r) : r.endsWith('/*') ? type.startsWith(r.slice(0, -1)) : type === r));
}

function setFiles(input, files) {
  const dt = new DataTransfer();
  for (const f of files) dt.items.add(f);
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function render(zone) {
  const input = zone.querySelector('input[type="file"]');
  let list = zone.nextElementSibling?.classList.contains('kit-drop-list') ? zone.nextElementSibling : null;
  if (!input.files.length) { list?.remove(); return; }
  if (!list) {
    list = document.createElement('ul');
    list.className = 'kit-drop-list';
    list.setAttribute('aria-label', 'Chosen files');
    zone.after(list);
  }
  list.replaceChildren(...[...input.files].map((f, i) => {
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.className = 'kit-drop-name';
    name.textContent = f.name;
    const sz = document.createElement('span');
    sz.className = 'kit-drop-size';
    sz.textContent = size(f.size);
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Remove ${f.name}`);
    b.innerHTML = X;
    b.addEventListener('click', () => {
      setFiles(input, [...input.files].filter((_, j) => j !== i));
      announce(`${f.name} removed`);
      (list.querySelector('button') ?? input).focus();
    });
    li.append(name, sz, b);
    return li;
  }));
}

function install() {
  if (globalThis[KEY]) return;
  globalThis[KEY] = true;
  const zoneOf = (e) => e.target.closest?.('.kit-drop');
  document.addEventListener('dragover', (e) => {
    const z = zoneOf(e);
    if (!z || !e.dataTransfer?.types.includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    z.dataset.over = '';
  });
  document.addEventListener('dragleave', (e) => { const z = zoneOf(e); if (z && !z.contains(e.relatedTarget)) delete z.dataset.over; });
  document.addEventListener('drop', (e) => {
    const z = zoneOf(e);
    if (!z) return;
    e.preventDefault();
    delete z.dataset.over;
    const input = z.querySelector('input[type="file"]');
    if (!input || input.disabled) return;
    const dropped = [...e.dataTransfer.files];
    const ok = dropped.filter((f) => accepts(input, f));
    const kept = input.multiple ? [...input.files, ...ok] : ok.slice(0, 1);
    setFiles(input, kept);
    const skipped = dropped.length - ok.length;
    announce(`${ok.length} ${ok.length === 1 ? 'file' : 'files'} added${skipped ? `, ${skipped} not allowed` : ''}`);
  });
  document.addEventListener('change', (e) => {
    const z = e.target.closest?.('.kit-drop');
    if (z && e.target.matches('input[type="file"]')) render(z);
  });
}

install();
