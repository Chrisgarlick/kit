// SPDX-License-Identifier: MIT
//
// <kit-calendar>: a month grid for picking a day, or a range of days.
//
//   <kit-calendar name="due" value="2026-11-04" min="2026-01-01"></kit-calendar>
//   <kit-calendar name="period" range from="2026-11-02" to="2026-11-08"></kit-calendar>
//
// Days are "YYYY-MM-DD" strings (core/dates.js). The grid follows the APG
// date picker: one focusable day; arrows move a day or a week, Home and End
// go to the week's ends, Page Up and Down a month (with Shift, a year), and
// Enter or Space chooses. In a range, the first choice starts it and the
// second ends it, with the days between shown as you move. `change` fires
// with { value } or { from, to }. In a form it submits value, or from/to
// as one ISO interval ("2026-11-02/2026-11-08").
//
// Week start and names come from the page's language (lang), unless
// week-start or locale say otherwise. Set isDateDisabled = (day) => bool to
// rule out days beyond min and max.

import { KitElement } from '../../core/element.js';
import { define } from '../../core/define.js';
import { uid, announce } from '../../core/a11y.js';
import * as D from '../../core/dates.js';

const ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 3.5-4.5 4.5 4.5 4.5"/></svg>';

export class KitCalendar extends KitElement {
  static shadow = false;
  static formAssociated = true;
  static props = {
    value: { type: String, reflect: true },
    from: { type: String, reflect: true },
    to: { type: String, reflect: true },
    range: { type: Boolean },
    min: { type: String },
    max: { type: String },
    month: { type: String }, // the month shown, YYYY-MM
    weekStart: { type: Number, attribute: 'week-start' },
    locale: { type: String },
    name: { type: String },
  };

  /** (day) => true for days that can't be chosen, beyond min and max. */
  isDateDisabled = null;

  #focus = '';
  #hover = '';
  #title = null;
  #body = null;
  #head = null;
  #cells = [];
  #initial = null;

  get #weekStart() { return this.weekStart ?? D.weekStartFor(this.locale); }

  /** The day that has (or will get) focus in the grid. */
  get activeDay() { return this.#focus; }

  disabledDay(day) {
    return (this.min && day < this.min) || (this.max && day > this.max) || !!this.isDateDisabled?.(day);
  }

  connected() {
    this.#initial ??= { value: this.value, from: this.from, to: this.to };
    if (!this.#body) this.#build();
    this.#focus ||= D.clamp(this.range ? this.from || this.to || D.today() : this.value || D.today(), this.min, this.max);
    this.month ||= this.#focus.slice(0, 7);
  }

  #build() {
    const title = document.createElement('p');
    title.className = 'kit-cal-title';
    title.id = uid('kit-cal-title');
    title.setAttribute('aria-live', 'polite');
    const nav = (dir, label) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'kit-button kit-cal-nav';
      b.dataset.variant = 'ghost';
      b.dataset.size = 'sm';
      b.dataset.icon = '';
      b.dataset.step = String(dir);
      b.setAttribute('aria-label', label);
      b.innerHTML = ARROW;
      return b;
    };
    const head = document.createElement('div');
    head.className = 'kit-cal-head';
    head.append(nav(-1, 'Previous month'), title, nav(1, 'Next month'));
    const table = document.createElement('table');
    table.className = 'kit-cal-grid';
    table.setAttribute('role', 'grid');
    table.setAttribute('aria-labelledby', title.id);
    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    for (let i = 0; i < 7; i++) {
      const th = document.createElement('th');
      th.scope = 'col';
      hr.append(th);
    }
    thead.append(hr);
    const tbody = document.createElement('tbody');
    this.#cells = [];
    for (let w = 0; w < 6; w++) {
      const tr = document.createElement('tr');
      for (let d = 0; d < 7; d++) {
        const td = document.createElement('td');
        td.setAttribute('role', 'gridcell');
        td.tabIndex = -1;
        tr.append(td);
        this.#cells.push(td);
      }
      tbody.append(tr);
    }
    table.append(thead, tbody);
    this.replaceChildren(head, table);
    this.#title = title;
    this.#head = hr;
    this.#body = tbody;

    const on = { signal: this.signal };
    head.addEventListener('click', (e) => {
      const b = e.target.closest('[data-step]');
      if (b) this.#moveMonth(Number(b.dataset.step), false);
    });
    tbody.addEventListener('click', (e) => {
      const td = e.target.closest('td[data-day]');
      if (td && td.getAttribute('aria-disabled') !== 'true') this.#choose(td.dataset.day);
    });
    tbody.addEventListener('pointerover', (e) => {
      const td = e.target.closest('td[data-day]');
      if (td && this.range && this.from && !this.to) { this.#hover = td.dataset.day; this.#paint(); }
    }, on);
    tbody.addEventListener('keydown', (e) => this.#key(e), on);
  }

  willUpdate(changed) {
    if (changed.has('month') && this.month && !/^\d{4}-\d{2}$/.test(this.month)) this.month = this.month.slice(0, 7);
  }

  updated(changed) {
    if (!this.#body) return;
    if (['month', 'locale', 'weekStart'].some((k) => changed.has(k)) || !this.#head.textContent) this.#layout();
    this.#paint();
    if (this.internals && this.name) {
      const v = this.range ? (this.from && this.to ? `${this.from}/${this.to}` : null) : this.value || null;
      this.internals.setFormValue(v);
    }
  }

  /** Days, names and title for the month shown. */
  #layout() {
    const ws = this.#weekStart;
    const short = D.weekdayNames(ws, 'short', this.locale);
    const long = D.weekdayNames(ws, 'long', this.locale);
    [...this.#head.children].forEach((th, i) => { th.textContent = short[i]; th.abbr = long[i]; });
    this.#title.textContent = D.formatDay(this.month + '-01', 'month', this.locale);
    const days = D.monthGrid(this.month, ws).flat();
    this.#cells.forEach((td, i) => {
      const day = days[i];
      td.dataset.day = day;
      td.textContent = String(+day.slice(8));
      td.setAttribute('aria-label', D.formatDay(day, 'long', this.locale));
      td.toggleAttribute('data-outside', day.slice(0, 7) !== this.month);
    });
  }

  /** Selection, range, today, disabled and the roving tab stop. */
  #paint() {
    const now = D.today();
    const end = this.to || (this.from && this.#hover) || '';
    const [a, b] = this.from && end && end < this.from ? [end, this.from] : [this.from, end];
    for (const td of this.#cells) {
      const day = td.dataset.day;
      const selected = this.range ? day === this.from || day === this.to : day === this.value;
      td.setAttribute('aria-selected', String(!!selected));
      td.toggleAttribute('data-range-start', !!(this.range && a && day === a));
      td.toggleAttribute('data-range-end', !!(this.range && b && day === b));
      td.toggleAttribute('data-in-range', !!(this.range && D.inRange(day, a, b)));
      td.toggleAttribute('data-preview', !!(this.range && !this.to && this.#hover));
      if (day === now) td.setAttribute('aria-current', 'date'); else td.removeAttribute('aria-current');
      if (this.disabledDay(day)) td.setAttribute('aria-disabled', 'true'); else td.removeAttribute('aria-disabled');
      td.tabIndex = day === this.#focus ? 0 : -1;
    }
  }

  #choose(day) {
    if (this.disabledDay(day)) return;
    this.#focus = day;
    if (day.slice(0, 7) !== this.month) this.month = day.slice(0, 7);
    if (!this.range) {
      this.value = day;
      this.emit('change', { value: day });
      announce(D.formatDay(day, 'long', this.locale));
    } else if (!this.from || this.to) {
      this.from = day;
      this.to = null;
      this.#hover = day;
      announce(`From ${D.formatDay(day, 'long', this.locale)}. Choose the last day.`);
    } else {
      const [from, to] = day < this.from ? [day, this.from] : [this.from, day];
      this.from = from;
      this.to = to;
      this.#hover = '';
      this.emit('change', { from, to });
      announce(D.formatRange(from, to, 'long', this.locale));
    }
    this.requestUpdate();
  }

  #moveMonth(n, keepFocus = true) {
    const target = D.clamp(D.addMonths(this.#focus || this.month + '-01', n), this.min, this.max);
    this.#focus = target;
    this.month = target.slice(0, 7);
    if (keepFocus) this.updateComplete.then(() => this.#focusCell());
  }

  #key(e) {
    const rtl = getComputedStyle(this).direction === 'rtl';
    const ws = this.#weekStart;
    const f = this.#focus;
    const step = {
      ArrowLeft: () => D.addDays(f, rtl ? 1 : -1),
      ArrowRight: () => D.addDays(f, rtl ? -1 : 1),
      ArrowUp: () => D.addDays(f, -7),
      ArrowDown: () => D.addDays(f, 7),
      Home: () => D.startOfWeek(f, ws),
      End: () => D.endOfWeek(f, ws),
      PageUp: () => (e.shiftKey ? D.addYears(f, -1) : D.addMonths(f, -1)),
      PageDown: () => (e.shiftKey ? D.addYears(f, 1) : D.addMonths(f, 1)),
    }[e.key];
    if (step) {
      e.preventDefault();
      const next = D.clamp(step(), this.min, this.max);
      this.#focus = next;
      if (this.range && this.from && !this.to) this.#hover = next;
      if (next.slice(0, 7) !== this.month) this.month = next.slice(0, 7);
      this.requestUpdate();
      this.updateComplete.then(() => this.#focusCell());
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.#choose(f);
    }
  }

  #focusCell() {
    this.#cells.find((td) => td.dataset.day === this.#focus)?.focus();
  }

  /** Moves focus to the active day (the chosen one, else today). */
  focus(options) {
    this.updateComplete.then(() => this.#cells.find((td) => td.dataset.day === this.#focus)?.focus(options));
  }

  /** Shows a day's month and makes it the active day. */
  goTo(day) {
    if (!D.isDay(day)) return;
    this.#focus = D.clamp(day, this.min, this.max);
    this.month = this.#focus.slice(0, 7);
  }

  formResetCallback() {
    Object.assign(this, this.#initial);
  }
}

KitCalendar.version = '0.1.0';
define('kit-calendar', KitCalendar);
