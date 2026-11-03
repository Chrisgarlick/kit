// SPDX-License-Identifier: MIT
//
// <kit-combobox>: a select you can type into to filter (APG combobox, list
// autocomplete).
//
//   <label for="country">Country</label>
//   <kit-combobox>
//     <select class="kit-select" id="country" name="country">
//       <option value="">Choose a country</option>
//       <option value="fr">France</option> …
//     </select>
//   </kit-combobox>
//
// Without the script it's the select. With it, a text input takes the
// select's place (and its id, so the label still points at it) with a list
// of the matching options below. The select stays, hidden, holding the
// value, so the form submits, validates and resets as it always did.
// `change` fires on the select (as a select's would) and on the element,
// with detail { value, label }.

import { KitElement } from '../../core/element.js';
import { define } from '../../core/define.js';
import { uid, announce } from '../../core/a11y.js';
import { follow } from '../../core/position.js';
import { showLayer, hideLayer, onOutside } from '../../core/layer.js';

const LIMIT = 100; // options shown at once; more means keep typing

const norm = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export class KitCombobox extends KitElement {
  static shadow = false;

  #input = null;
  #popup = null;
  #list = null;
  #empty = null;
  #matches = []; // the <option>s shown, in order
  #active = -1;
  #close = null;
  #announceTimer = 0;

  get select() { return this.querySelector(':scope > select'); }

  /** The chosen value (the select's). */
  get value() { return this.select?.value ?? ''; }
  set value(v) {
    if (!this.select) return;
    this.select.value = v;
    this.#showChosen();
  }

  get open() { return this.#close !== null; }

  connected() {
    const select = this.select;
    if (!select) {
      console.error('[kit] <kit-combobox> needs a <select> child holding its options');
      return;
    }
    if (!this.#input) this.#build(select);
    const on = { signal: this.signal };
    const input = this.#input;
    input.addEventListener('input', () => this.#filter(input.value, true), on);
    input.addEventListener('keydown', (e) => this.#key(e), on);
    input.addEventListener('click', () => { if (!this.open) this.#filter('', false); }, on);
    input.addEventListener('blur', () => this.#commitTyped(), on);
    this.#list.addEventListener('pointerdown', (e) => e.preventDefault(), on); // keep focus in the input
    this.#list.addEventListener('click', (e) => {
      const li = e.target.closest('[role="option"]');
      if (li && li.getAttribute('aria-disabled') !== 'true') this.#pick(this.#matches[Number(li.dataset.i)]);
    }, on);
    this.#list.addEventListener('pointermove', (e) => {
      const li = e.target.closest('[role="option"]');
      if (li) this.#setActive(Number(li.dataset.i), false);
    }, on);
    select.form?.addEventListener('reset', () => setTimeout(() => this.#showChosen()), on);
    this.#showChosen();
  }

  disconnected() {
    this.hide();
  }

  #build(select) {
    const input = document.createElement('input');
    input.className = select.className.replace(/\bkit-select\b/, 'kit-input') || 'kit-input';
    input.classList.add('kit-combobox-input');
    if (select.id) { input.id = select.id; select.id = ''; }
    for (const a of ['aria-describedby', 'aria-invalid', 'aria-label', 'aria-labelledby']) {
      if (select.hasAttribute(a)) input.setAttribute(a, select.getAttribute(a));
    }
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.disabled = select.disabled;
    input.required = select.required;
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    const placeholder = [...select.options].find((o) => o.value === '');
    if (placeholder) input.placeholder = placeholder.textContent.trim();

    const popup = document.createElement('div');
    popup.className = 'kit-combobox-popup';
    const list = document.createElement('ul');
    list.id = uid('kit-listbox');
    list.setAttribute('role', 'listbox');
    if (input.id) {
      const label = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
      if (label) { label.id ||= uid('kit-label'); list.setAttribute('aria-labelledby', label.id); }
    }
    const empty = document.createElement('p');
    empty.className = 'kit-combobox-empty';
    empty.textContent = 'No matches';
    empty.hidden = true;
    popup.append(list, empty);
    input.setAttribute('aria-controls', list.id);

    select.hidden = true;
    select.tabIndex = -1;
    select.required = false; // the input carries required, so the browser points at something visible
    this.prepend(input);
    this.append(popup);
    this.#input = input;
    this.#popup = popup;
    this.#list = list;
    this.#empty = empty;
  }

  /** The options people can choose (not the empty placeholder). */
  #options() {
    return [...this.select.options].filter((o) => o.value !== '' || o.textContent.trim() !== this.#input.placeholder);
  }

  #filter(text, typed) {
    const q = norm(text.trim());
    const all = this.#options();
    const hits = q ? all.filter((o) => norm(o.textContent).includes(q)) : all;
    // Options that start with the text come first.
    if (q) hits.sort((a, b) => norm(b.textContent).startsWith(q) - norm(a.textContent).startsWith(q));
    this.#matches = hits.slice(0, LIMIT);
    this.#render(q);
    this.show();
    const chosen = this.#matches.findIndex((o) => o.selected && o.value !== '');
    this.#setActive(typed ? (this.#matches.length ? 0 : -1) : chosen, true);
    if (typed) {
      clearTimeout(this.#announceTimer);
      const n = hits.length;
      this.#announceTimer = setTimeout(() => announce(n === 0 ? 'No matches' : `${n} ${n === 1 ? 'match' : 'matches'}`), 500);
    }
  }

  #render(q) {
    const list = this.#list;
    list.replaceChildren();
    this.#matches.forEach((o, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.id = `${list.id}-${i}`;
      li.dataset.i = String(i);
      li.setAttribute('aria-selected', String(o.selected && o.value !== ''));
      if (o.disabled) li.setAttribute('aria-disabled', 'true');
      const text = o.textContent.trim();
      const at = q ? norm(text).indexOf(q) : -1;
      // norm() keeps lengths for Latin text, so the match lines up with the original.
      if (at >= 0 && norm(text).length === text.length) {
        const mark = document.createElement('mark');
        mark.textContent = text.slice(at, at + q.length);
        li.append(text.slice(0, at), mark, text.slice(at + q.length));
      } else li.textContent = text;
      list.append(li);
    });
    this.#empty.hidden = this.#matches.length > 0;
  }

  #setActive(i, scroll) {
    const items = this.#list.children;
    if (this.#active >= 0) items[this.#active]?.removeAttribute('data-active');
    this.#active = i;
    const li = items[i];
    if (li) {
      li.setAttribute('data-active', '');
      this.#input.setAttribute('aria-activedescendant', li.id);
      if (scroll) li.scrollIntoView({ block: 'nearest' });
    } else this.#input.removeAttribute('aria-activedescendant');
  }

  #move(by) {
    const n = this.#matches.length;
    if (!n) return;
    let i = this.#active;
    for (let step = 0; step < n; step++) {
      i = i < 0 ? (by > 0 ? 0 : n - 1) : (i + by + n) % n;
      if (!this.#matches[i].disabled) break;
    }
    this.#setActive(i, true);
  }

  #key(e) {
    switch (e.key) {
      case 'ArrowDown':
        if (!this.open) this.#filter('', false);
        else if (!e.altKey) this.#move(1);
        break;
      case 'ArrowUp':
        if (!this.open) this.#filter('', false);
        else this.#move(-1);
        break;
      case 'Enter':
        if (!this.open) return; // let Enter submit the form
        if (this.#active >= 0 && !this.#matches[this.#active].disabled) this.#pick(this.#matches[this.#active]);
        else this.hide();
        break;
      case 'Escape':
        if (this.open) { this.hide(); this.#showChosen(); }
        else if (this.#input.value) { this.#input.value = ''; this.#choose(null); }
        else return;
        break;
      case 'Home': case 'End':
        return; // move the caret, as in any text field
      case 'Tab':
        if (this.open) {
          if (this.#active >= 0 && this.#input.value.trim() && !this.#matches[this.#active].disabled) this.#choose(this.#matches[this.#active]);
          this.hide();
        }
        return;
      default:
        return;
    }
    e.preventDefault();
  }

  show() {
    if (this.open) return;
    const popup = this.#popup;
    popup.style.setProperty('--kit-anchor-width', `${this.#input.offsetWidth}px`);
    showLayer(popup);
    this.#input.setAttribute('aria-expanded', 'true');
    const ctl = new AbortController();
    const stop = follow(popup, this.#input, { placement: 'bottom-start', offset: 4 });
    onOutside([popup, this.#input], () => { this.hide(); this.#commitTyped(); }, ctl.signal);
    this.#close = () => { ctl.abort(); stop(); };
  }

  hide() {
    if (!this.open) return;
    this.#close();
    this.#close = null;
    hideLayer(this.#popup);
    this.#input.setAttribute('aria-expanded', 'false');
    this.#input.removeAttribute('aria-activedescendant');
    this.#active = -1;
  }

  #pick(option) {
    this.#choose(option);
    this.hide();
    this.#input.select?.();
  }

  // Sets the select (and fires change) when the choice differs.
  #choose(option) {
    const select = this.select;
    const before = select.value;
    if (option) option.selected = true;
    else select.value = '';
    if (!option && select.value !== '') select.selectedIndex = -1;
    this.#showChosen();
    if (select.value !== before) {
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
      this.emit('change', { value: select.value, label: option?.textContent.trim() ?? '' });
    }
  }

  // Leaving the field: an exact match is chosen, anything else goes back to
  // the current choice (the value is always one of the options).
  #commitTyped() {
    if (this.open || !this.#input) return;
    const text = norm(this.#input.value.trim());
    if (!text) { if (this.value !== '') this.#choose(null); return; }
    const exact = this.#options().find((o) => !o.disabled && norm(o.textContent.trim()) === text);
    if (exact) this.#choose(exact);
    else this.#showChosen();
  }

  #showChosen() {
    const o = this.select?.selectedOptions[0];
    if (this.#input) this.#input.value = o && o.value !== '' ? o.textContent.trim() : '';
  }
}

KitCombobox.version = '0.1.0';
define('kit-combobox', KitCombobox);
