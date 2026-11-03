// SPDX-License-Identifier: MIT
//
// <kit-command>: a command palette, opened with ⌘K (Ctrl+K elsewhere).
//
//   <kit-command id="palette" shortcut="k" label="Search commands">
//     <a href="/settings" data-group="Pages" data-keywords="preferences account">Settings</a>
//     <button value="new" data-group="Actions" data-hint="N">New project</button>
//   </kit-command>
//   <button commandfor="palette" command="--open">Search</button>
//
// The links and buttons inside are its items (they stay hidden); choosing
// one follows the link or clicks the button, so its own handlers run, and
// fires `select` with detail { value, item }. For results from a server,
// set `source`: async (query, signal) => [{ label, group, href | value, hint, keywords }].
// Typing filters by every word, in labels, keywords and group names, best
// matches first.

import { KitElement } from '../../core/element.js';
import { define } from '../../core/define.js';
import { uid, announce } from '../../core/a11y.js';

const norm = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const ICON = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="9" r="5.5"/><path d="m13.2 13.2 3.3 3.3"/></svg>';

/** How well `item` matches the query words; 0 means it doesn't. */
function score(item, words) {
  if (!words.length) return 1;
  const label = norm(item.label);
  const hay = `${label} ${norm(item.keywords || '')} ${norm(item.group || '')}`;
  let total = 0;
  for (const w of words) {
    if (!hay.includes(w)) return 0;
    total += label.startsWith(w) ? 4 : new RegExp(`(^|[\\s/_-])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(label) ? 3 : label.includes(w) ? 2 : 1;
  }
  return total;
}

export class KitCommand extends KitElement {
  static shadow = false;
  static props = {
    shortcut: { type: String }, // a letter used with ⌘ or Ctrl; "k" by default, "" for none
    label: { type: String },
    placeholder: { type: String },
  };

  /** Optional async (query, signal) => items, merged with the markup items. */
  source = null;

  #dialog = null;
  #input = null;
  #list = null;
  #empty = null;
  #shown = []; // items in display order
  #active = -1;
  #timer = 0;

  /** The markup items: direct link and button children. */
  #markupItems() {
    return [...this.querySelectorAll(':scope > :is(a[href], button)')].map((el) => ({
      label: (el.getAttribute('aria-label') || el.textContent).trim(),
      group: el.dataset.group || '',
      keywords: el.dataset.keywords || '',
      hint: el.dataset.hint || '',
      value: el.getAttribute('value') ?? el.getAttribute('href') ?? '',
      href: el.localName === 'a' ? el.href : null,
      el,
      disabled: el.disabled,
    }));
  }

  connected() {
    if (!this.#dialog) this.#build();
    const on = { signal: this.signal };
    document.addEventListener('keydown', (e) => {
      const key = (this.shortcut ?? 'k').toLowerCase();
      if (!key || e.repeat || e.altKey || e.shiftKey || e.key.toLowerCase() !== key) return;
      if (!(isMac ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey)) return;
      e.preventDefault();
      if (this.#dialog.open) this.hide(); else this.show();
    }, on);
    document.addEventListener('click', (e) => {
      const b = e.target.closest?.('button[commandfor]');
      if (b && this.id && b.getAttribute('commandfor') === this.id && b.getAttribute('command') === '--open') this.show();
    }, on);
    this.#input.addEventListener('input', () => this.#update(), on);
    this.#input.addEventListener('keydown', (e) => this.#key(e), on);
    this.#list.addEventListener('click', (e) => {
      const li = e.target.closest('[role="option"]');
      if (li) this.#pick(this.#shown[Number(li.dataset.i)]);
    }, on);
    this.#list.addEventListener('pointermove', (e) => {
      const li = e.target.closest('[role="option"]');
      if (li) this.#setActive(Number(li.dataset.i), false);
    }, on);
    // A press on the backdrop closes it.
    this.#dialog.addEventListener('click', (e) => { if (e.target === this.#dialog) this.hide(); }, on);
  }

  #build() {
    const dialog = document.createElement('dialog');
    dialog.className = 'kit-dialog kit-command';
    const label = this.label || 'Command palette';
    dialog.setAttribute('aria-label', label);
    const bar = document.createElement('div');
    bar.className = 'kit-command-bar';
    bar.insertAdjacentHTML('beforeend', ICON);
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'kit-command-input';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.placeholder = this.placeholder || 'Search…';
    input.setAttribute('aria-label', label);
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'true');
    input.setAttribute('aria-autocomplete', 'list');
    const esc = document.createElement('kbd');
    esc.className = 'kit-kbd';
    esc.textContent = 'Esc';
    bar.append(input, esc);
    const list = document.createElement('div');
    list.className = 'kit-command-list';
    list.id = uid('kit-command-list');
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', 'Results');
    input.setAttribute('aria-controls', list.id);
    const empty = document.createElement('p');
    empty.className = 'kit-command-empty';
    empty.hidden = true;
    const foot = document.createElement('div');
    foot.className = 'kit-command-foot';
    foot.setAttribute('aria-hidden', 'true');
    foot.innerHTML = '<span><kbd class="kit-kbd">↑</kbd><kbd class="kit-kbd">↓</kbd> move</span><span><kbd class="kit-kbd">↵</kbd> open</span><span><kbd class="kit-kbd">esc</kbd> close</span>';
    dialog.append(bar, list, empty, foot);
    this.append(dialog);
    this.#dialog = dialog;
    this.#input = input;
    this.#list = list;
    this.#empty = empty;
  }

  /** Opens the palette with an empty search. */
  show() {
    const d = this.#dialog;
    if (d.open) return;
    this.#input.value = '';
    d.showModal();
    this.#input.focus();
    this.#update();
  }

  hide() {
    if (this.#dialog.open) this.#dialog.close();
  }

  async #update() {
    const q = this.#input.value.trim();
    const words = norm(q).split(/\s+/).filter(Boolean);
    let items = this.#markupItems();
    if (this.source) {
      this.#render(items, words); // markup results straight away, server results when they come
      const extra = await this.run('source', (signal) => this.source(q, signal));
      if (extra === undefined) return; // a newer search took over
      items = items.concat(extra);
    }
    this.#render(items, words);
    clearTimeout(this.#timer);
    if (q) this.#timer = setTimeout(() => { const n = this.#shown.length; announce(n ? `${n} ${n === 1 ? 'result' : 'results'}` : 'No results'); }, 500);
  }

  #render(items, words) {
    // Score, keep the matches, and order groups by their best match.
    const groups = new Map();
    for (const it of items) {
      if (it.disabled) continue;
      const s = score(it, words);
      if (!s) continue;
      const g = it.group || '';
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push({ it, s });
    }
    const ordered = [...groups.entries()];
    if (words.length) {
      for (const [, list] of ordered) list.sort((a, b) => b.s - a.s);
      ordered.sort((a, b) => b[1][0].s - a[1][0].s);
    }
    this.#shown = [];
    const frag = document.createDocumentFragment();
    for (const [name, list] of ordered) {
      const group = document.createElement('ul');
      group.setAttribute('role', name ? 'group' : 'presentation');
      if (name) {
        const h = document.createElement('li');
        h.setAttribute('role', 'presentation');
        h.className = 'kit-command-heading';
        h.id = uid('kit-command-group');
        h.textContent = name;
        group.setAttribute('aria-labelledby', h.id);
        group.append(h);
      }
      for (const { it } of list.slice(0, 50)) {
        const i = this.#shown.push(it) - 1;
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.id = `${this.#list.id}-${i}`;
        li.dataset.i = String(i);
        li.setAttribute('aria-selected', 'false');
        const text = document.createElement('span');
        text.textContent = it.label;
        li.append(text);
        if (it.hint) {
          const k = document.createElement('kbd');
          k.className = 'kit-kbd';
          k.textContent = it.hint;
          k.setAttribute('aria-hidden', 'true');
          li.append(k);
        }
        group.append(li);
      }
      frag.append(group);
    }
    this.#list.replaceChildren(frag);
    this.#empty.hidden = this.#shown.length > 0;
    this.#empty.textContent = words.length ? `No results for “${this.#input.value.trim()}”` : 'Nothing here yet';
    this.#active = -1;
    this.#setActive(this.#shown.length ? 0 : -1, true);
  }

  #setActive(i, scroll) {
    const prev = this.#list.querySelector('[aria-selected="true"]');
    prev?.setAttribute('aria-selected', 'false');
    this.#active = i;
    const li = i >= 0 ? this.#list.querySelector(`[data-i="${i}"]`) : null;
    if (li) {
      li.setAttribute('aria-selected', 'true');
      this.#input.setAttribute('aria-activedescendant', li.id);
      if (scroll) li.scrollIntoView({ block: 'nearest' });
    } else this.#input.removeAttribute('aria-activedescendant');
  }

  #key(e) {
    const n = this.#shown.length;
    switch (e.key) {
      case 'ArrowDown': if (n) this.#setActive((this.#active + 1) % n, true); break;
      case 'ArrowUp': if (n) this.#setActive((this.#active - 1 + n) % n, true); break;
      case 'Enter': if (this.#active >= 0) this.#pick(this.#shown[this.#active]); break;
      default: return;
    }
    e.preventDefault();
  }

  #pick(item) {
    this.hide();
    const go = this.emit('select', { value: item.value ?? item.href ?? '', item }, { cancelable: true });
    if (!go) return;
    if (item.el) item.el.click(); // a link follows itself; a button runs its own handlers
    else if (item.href) location.assign(item.href);
  }
}

KitCommand.version = '0.1.0';
define('kit-command', KitCommand);
