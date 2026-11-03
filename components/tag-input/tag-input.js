// SPDX-License-Identifier: MIT
//
// <kit-tags>: several values in one field, as removable chips.
//
//   <kit-tags [max="5"] [separator=", "]>
//     <input class="kit-input" id="topics" name="topics" value="Design, Research">
//   </kit-tags>
//
// It enhances a plain text input of comma-separated values: the input stays
// (hidden) as the form value, a list of chips shows the tags, and a new text
// box (which takes the input's id, so its label still works) adds more.
// `change` fires with detail { tags }.

import { KitElement } from '../../core/element.js';
import { define } from '../../core/define.js';
import { announce } from '../../core/a11y.js';

const X = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m4.5 4.5 7 7m0-7-7 7"/></svg>';

export class KitTags extends KitElement {
  static shadow = false;
  static props = { max: { type: Number }, separator: { type: String } };

  #source = null; // the original input, now hidden, holding the value
  #entry = null;
  #list = null;
  #tags = [];

  get tags() { return [...this.#tags]; }
  set tags(v) { this.#tags = []; for (const t of v) this.#add(t, false); this.#sync(false); }

  connected() {
    const source = this.querySelector(':scope > input');
    if (!source) { console.error('[kit] <kit-tags> needs an <input> child'); return; }
    if (!this.#entry) this.#build(source);
    const on = { signal: this.signal };
    const entry = this.#entry;
    entry.addEventListener('keydown', (e) => {
      const text = entry.value.trim();
      if ((e.key === 'Enter' || e.key === ',' || (e.key === 'Tab' && text)) && text) {
        e.preventDefault();
        this.#commit(text);
      } else if (e.key === 'Enter') {
        e.preventDefault(); // an empty Enter doesn't submit half-typed tags away
      } else if (e.key === 'Backspace' && !entry.value && this.#tags.length) {
        this.#remove(this.#tags.length - 1);
      }
    }, on);
    entry.addEventListener('input', () => {
      if (entry.value.includes(',')) { this.#commit(entry.value); }
    }, on);
    entry.addEventListener('change', () => { if (entry.value.trim() && entry.list) this.#commit(entry.value); }, on);
    entry.addEventListener('blur', () => { if (entry.value.trim()) this.#commit(entry.value); }, on);
    this.#list.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-i]');
      if (b) { this.#remove(Number(b.dataset.i)); entry.focus(); }
    }, on);
    this.querySelector('.kit-tags-box').addEventListener('click', (e) => { if (e.target === e.currentTarget) entry.focus(); }, on);
    source.form?.addEventListener('reset', () => setTimeout(() => { this.#tags = []; this.#parse(source.defaultValue).forEach((t) => this.#add(t, false)); this.#sync(false); }), on);
  }

  #build(source) {
    this.#source = source;
    const box = document.createElement('div');
    box.className = 'kit-tags-box';
    const list = document.createElement('ul');
    list.className = 'kit-tags-list';
    const entry = document.createElement('input');
    entry.className = 'kit-tags-entry';
    entry.type = 'text';
    entry.autocomplete = 'off';
    for (const a of ['aria-describedby', 'aria-invalid', 'placeholder', 'list', 'disabled']) if (source.hasAttribute(a)) entry.setAttribute(a, source.getAttribute(a));
    if (source.id) {
      entry.id = source.id;
      source.removeAttribute('id');
      const label = document.querySelector(`label[for="${CSS.escape(entry.id)}"]`);
      if (label) { label.id ||= `${entry.id}-label`; list.setAttribute('aria-labelledby', label.id); }
    }
    source.hidden = true;
    source.tabIndex = -1;
    box.append(list, entry);
    this.append(box);
    this.#entry = entry;
    this.#list = list;
    for (const t of this.#parse(source.value)) this.#add(t, false);
    this.#sync(false);
  }

  #parse(text) { return text.split(',').map((t) => t.trim()).filter(Boolean); }

  #commit(text) {
    for (const t of this.#parse(text)) this.#add(t, true);
    this.#entry.value = '';
    this.#sync(true);
  }

  #add(tag, say) {
    if (this.max && this.#tags.length >= this.max) { if (say) announce(`No more than ${this.max}`); return; }
    if (this.#tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    this.#tags.push(tag);
    if (say) announce(`${tag} added`);
  }

  #remove(i) {
    const [tag] = this.#tags.splice(i, 1);
    announce(`${tag} removed`);
    this.#sync(true);
  }

  #sync(fire) {
    this.#list.replaceChildren(...this.#tags.map((t, i) => {
      const li = document.createElement('li');
      li.className = 'kit-tag';
      const span = document.createElement('span');
      span.textContent = t;
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.i = String(i);
      b.setAttribute('aria-label', `Remove ${t}`);
      b.innerHTML = X;
      li.append(span, b);
      return li;
    }));
    this.#source.value = this.#tags.join(this.separator ?? ', ');
    this.#entry.disabled = this.#source.disabled || Boolean(this.max && this.#tags.length >= this.max);
    if (fire) {
      this.#source.dispatchEvent(new Event('change', { bubbles: true }));
      this.emit('change', { tags: this.tags });
    }
  }
}

KitTags.version = '0.1.0';
define('kit-tags', KitTags);
