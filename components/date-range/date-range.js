// SPDX-License-Identifier: MIT
//
// <kit-date-range>: a button showing a range of days that opens presets and
// a range calendar in a popover.
//
//   <kit-date-range label="Period" presets="last7 last30 thisMonth lastMonth">
//     <input class="kit-input" type="date" name="from" aria-label="From">
//     <input class="kit-input" type="date" name="to" aria-label="To">
//   </kit-date-range>
//
// It enhances two native date inputs: without the script, people type the
// dates; with it, the inputs stay in the form (hidden) and carry the values,
// so forms submit the same fields either way. Choosing a preset or a second
// day closes the popover and fires `change` with { from, to, preset }.
// Escape or a press outside closes it and focus returns to the button.

import { KitElement } from '../../core/element.js';
import { define } from '../../core/define.js';
import { uid } from '../../core/a11y.js';
import { follow } from '../../core/position.js';
import { showLayer, hideLayer, onOutside } from '../../core/layer.js';
import * as D from '../../core/dates.js';
import '../calendar/calendar.js';

const ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3"/></svg>';

/** Preset names (core/dates.js presets) and their labels; replace for other languages. */
export const PRESET_LABELS = {
  today: 'Today', yesterday: 'Yesterday', last7: 'Last 7 days', last30: 'Last 30 days', last90: 'Last 90 days',
  thisWeek: 'This week', lastWeek: 'Last week', thisMonth: 'This month', lastMonth: 'Last month', thisYear: 'This year',
};

export class KitDateRange extends KitElement {
  static shadow = false;
  static props = {
    from: { type: String, reflect: true },
    to: { type: String, reflect: true },
    label: { type: String },
    placeholder: { type: String },
    presets: { type: String }, // space-separated preset names
    min: { type: String },
    max: { type: String },
    locale: { type: String },
    weekStart: { type: Number, attribute: 'week-start' },
  };

  /** Labels for the presets, by name. */
  presetLabels = PRESET_LABELS;

  #button = null;
  #pop = null;
  #cal = null;
  #list = null;
  #stop = null;
  #closer = null;

  get #inputs() { return [...this.querySelectorAll(':scope > input')]; }

  get open() { return this.#pop?.hasAttribute('data-open') ?? false; }

  connected() {
    const [a, b] = this.#inputs;
    if (!a || !b) {
      console.error('[kit] <kit-date-range> needs two date inputs as children: from, then to');
      return;
    }
    this.from ??= D.isDay(a.value) ? a.value : null;
    this.to ??= D.isDay(b.value) ? b.value : null;
    if (!this.#button) this.#build();
  }

  #build() {
    for (const input of this.#inputs) input.hidden = true;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'kit-button kit-range-trigger';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = ICON + '<span class="kit-range-text"></span>';
    const pop = document.createElement('div');
    pop.className = 'kit-range-pop';
    pop.id = uid('kit-range');
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', this.label || 'Choose dates');
    button.setAttribute('aria-controls', pop.id);
    const list = document.createElement('div');
    list.className = 'kit-range-presets';
    list.setAttribute('role', 'group');
    list.setAttribute('aria-label', 'Presets');
    const cal = document.createElement('kit-calendar');
    cal.setAttribute('range', '');
    cal.toggleAttribute('data-bare', true);
    pop.append(list, cal);
    this.append(button, pop);
    this.#button = button;
    this.#pop = pop;
    this.#cal = cal;
    this.#list = list;

    const on = { signal: this.signal };
    button.addEventListener('click', () => (this.open ? this.close() : this.show()), on);
    list.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-preset]');
      if (!b) return;
      const r = D.presets(D.today(), this.#weekStart)[b.dataset.preset];
      this.#set(D.clamp(r.from, this.min, this.max), D.clamp(r.to, this.min, this.max), b.dataset.preset);
      this.close(true);
    }, on);
    cal.addEventListener('change', (e) => {
      e.stopPropagation(); // ours is the change that counts
      this.#set(e.detail.from, e.detail.to, null);
      this.close(true);
    }, on);
    pop.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); this.close(true); }
    }, on);
  }

  get #weekStart() { return this.weekStart ?? D.weekStartFor(this.locale); }

  #set(from, to, preset) {
    this.from = from;
    this.to = to;
    const [a, b] = this.#inputs;
    a.value = from || ''; // the hidden inputs carry the values into the form
    b.value = to || '';
    this.emit('change', { from, to, preset });
  }

  updated() {
    if (!this.#button) return;
    const text = this.from && this.to ? D.formatRange(this.from, this.to, 'medium', this.locale) : this.placeholder || 'Choose dates';
    this.#button.querySelector('.kit-range-text').textContent = text;
    this.#button.setAttribute('aria-label', `${this.label || 'Dates'}: ${this.from && this.to ? D.formatRange(this.from, this.to, 'long', this.locale) : 'none chosen'}`);
    this.#button.toggleAttribute('data-empty', !(this.from && this.to));
    const names = (this.presets ?? 'last7 last30 thisMonth lastMonth thisYear').split(/\s+/).filter((n) => n in PRESET_LABELS);
    const now = D.presets(D.today(), this.#weekStart);
    this.#list.hidden = !names.length;
    this.#list.replaceChildren(...names.map((n) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.preset = n;
      b.textContent = this.presetLabels[n] ?? PRESET_LABELS[n];
      b.setAttribute('aria-pressed', String(now[n].from === this.from && now[n].to === this.to));
      return b;
    }));
  }

  /** Opens the popover, on the chosen range (or this month). */
  show() {
    if (this.open || !this.#pop) return;
    const cal = this.#cal;
    for (const k of ['min', 'max', 'locale']) { if (this[k]) cal.setAttribute(k, this[k]); else cal.removeAttribute(k); }
    if (this.weekStart != null) cal.weekStart = this.weekStart;
    cal.from = this.from;
    cal.to = this.to;
    cal.goTo(this.from || D.clamp(D.today(), this.min, this.max));
    showLayer(this.#pop);
    this.#button.setAttribute('aria-expanded', 'true');
    this.#stop = follow(this.#pop, this.#button, { placement: 'bottom-start' });
    this.#closer = new AbortController();
    onOutside([this.#pop, this.#button], () => this.close(false), this.#closer.signal);
    cal.focus();
  }

  /** Closes the popover; refocus returns focus to the button. */
  close(refocus = false) {
    if (!this.open) return;
    hideLayer(this.#pop);
    this.#button.setAttribute('aria-expanded', 'false');
    this.#stop?.();
    this.#closer?.abort();
    if (refocus) this.#button.focus();
  }

  disconnected() { this.close(false); }
}

KitDateRange.version = '0.1.0';
define('kit-date-range', KitDateRange);
