// SPDX-License-Identifier: MIT
//
// <kit-event-calendar>: dated items (posts, audits, bookings) laid out on a
// month, or as an agenda where the calendar is narrow.
//
//   <kit-event-calendar month="2026-11" aria-label="Publishing schedule">
//     <ul>
//       <li><time datetime="2026-11-05">5 Nov</time> <a href="/posts/1">Launch post</a></li>
//       <li data-tone="good"><time datetime="2026-11-12T09:30">12 Nov, 09:30</time> Weekly audit</li>
//     </ul>
//   </kit-event-calendar>
//
// The list is the data: each item's <time datetime> is its day (and time),
// the rest is its content, links included. Without the script the list is
// shown as it is. With it, the month is a table of days with the items in
// them; past max-items a day shows "+N more", which opens it in full. Set
// `events` to [{ day, time, title, href, tone }] to fill it from script.
//
// layout: auto (the grid; under 40rem of its own width, a compact grid of
// days with a dot per tone), agenda (the grid; the agenda when narrow),
// grid or compact (always). day-href="/d/{day}" makes each day a link;
// month-href="/calendar/{month}" makes Today, previous and next links too,
// otherwise they're buttons and `navigate` fires with { month }.
// data-tone-labels="accent:Reminder,info:Job" names the tones, in each
// day's summary and in a key of the tones the month uses.

import { KitElement } from '../../core/element.js';
import { define } from '../../core/define.js';
import { uid } from '../../core/a11y.js';
import * as D from '../../core/dates.js';

const ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 3.5-4.5 4.5 4.5 4.5"/></svg>';
// Tones in the order their dots and key entries appear.
const TONE_ORDER = ['accent', 'info', 'good', 'warn', 'bad', 'neutral'];
const TONES = new Set(TONE_ORDER);
const fill = (pattern, key, value) => pattern.replaceAll(`{${key}}`, encodeURIComponent(value));

export class KitEventCalendar extends KitElement {
  static shadow = false;
  static props = {
    month: { type: String, reflect: true },
    weekStart: { type: Number, attribute: 'week-start' },
    locale: { type: String },
    maxItems: { type: Number, attribute: 'max-items' },
    layout: { type: String }, // auto (default), agenda, grid, compact
    dayHref: { type: String, attribute: 'day-href' }, // "/d/{day}"
    monthHref: { type: String, attribute: 'month-href' }, // "/calendar/{month}"
  };
  static state = { events: null, expanded: '' };

  #view = null;
  #title = null;
  #nav = null;
  #key = null;

  connected() {
    if (!this.events) this.events = this.#fromList();
    this.month ||= (this.events.find((e) => e.day.slice(0, 7) === D.today().slice(0, 7)) ? D.today() : this.events[0]?.day || D.today()).slice(0, 7);
    if (!this.#view) this.#build();
  }

  /** Events from the markup list: [{ day, time, node, tone }]. */
  #fromList() {
    const items = [...this.querySelectorAll(':scope > ul > li, :scope > ol > li')];
    return items.flatMap((li) => {
      const t = li.querySelector('time[datetime]');
      const dt = t?.getAttribute('datetime') ?? '';
      const day = dt.slice(0, 10);
      if (!D.isDay(day)) return [];
      const node = li.cloneNode(true);
      node.querySelector('time[datetime]')?.remove();
      return [{ day, time: /T(\d{2}:\d{2})/.exec(dt)?.[1] ?? '', node, tone: li.dataset.tone }];
    }).sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time));
  }

  #build() {
    const list = this.querySelector(':scope > ul, :scope > ol');
    if (list) list.hidden = true; // the data, kept for no-script and for reading back
    const head = document.createElement('div');
    head.className = 'kit-evcal-head';
    const title = document.createElement('h2');
    title.className = 'kit-evcal-title';
    title.id = uid('kit-evcal');
    title.setAttribute('aria-live', 'polite');
    const nav = document.createElement('nav');
    nav.className = 'kit-evcal-nav';
    nav.setAttribute('aria-label', 'Months');
    head.append(title, nav);
    this.#nav = nav;
    const view = document.createElement('div');
    view.className = 'kit-evcal-view';
    const key = document.createElement('ul');
    key.className = 'kit-evcal-key';
    key.setAttribute('aria-label', 'Key');
    this.append(head, view, key);
    this.#key = key;
    this.#title = title;
    this.#view = view;
    const on = { signal: this.signal };
    nav.addEventListener('click', (e) => {
      const b = e.target.closest('[data-step]');
      if (!b) return;
      const step = Number(b.dataset.step);
      this.month = step ? D.addMonths(this.month + '-01', step).slice(0, 7) : D.today().slice(0, 7);
      this.expanded = '';
      this.emit('navigate', { month: this.month });
    }, on);
    view.addEventListener('click', (e) => {
      const b = e.target.closest('[data-more]');
      if (b) this.expanded = this.expanded === b.dataset.more ? '' : b.dataset.more;
    }, on);
  }

  #item(e) {
    const li = document.createElement('li');
    li.className = 'kit-evcal-item';
    if (e.tone && TONES.has(e.tone)) li.dataset.tone = e.tone;
    if (e.time) {
      const t = document.createElement('time');
      t.dateTime = `${e.day}T${e.time}`;
      t.textContent = e.time;
      li.append(t, ' ');
    }
    if (e.node) li.append(...[...e.node.cloneNode(true).childNodes]);
    else if (e.href) {
      const a = document.createElement('a');
      a.href = e.href;
      a.textContent = e.title ?? '';
      li.append(a);
    } else li.append(e.title ?? '');
    return li;
  }

  /** Tone labels from data-tone-labels="accent:Reminder,info:Job". */
  get #toneLabels() {
    const out = {};
    for (const pair of (this.dataset.toneLabels ?? '').split(',')) {
      const [k, ...v] = pair.split(':');
      if (TONES.has(k.trim()) && v.length) out[k.trim()] = v.join(':').trim();
    }
    return out;
  }

  /** Today, previous and next: links when month-href is set, else buttons. */
  #renderNav() {
    const prev = D.addMonths(this.month + '-01', -1).slice(0, 7);
    const next = D.addMonths(this.month + '-01', 1).slice(0, 7);
    const make = (label, step, month, icon) => {
      const el = document.createElement(this.monthHref ? 'a' : 'button');
      if (this.monthHref) el.href = fill(this.monthHref, 'month', month);
      else { el.type = 'button'; el.dataset.step = step; }
      el.className = 'kit-button';
      el.dataset.size = 'sm';
      el.dataset.variant = 'ghost';
      if (icon) { el.dataset.icon = ''; el.dataset.dir = step; el.innerHTML = ARROW; el.setAttribute('aria-label', label); } else el.textContent = label;
      return el;
    };
    this.#nav.replaceChildren(make('Today', '0', D.today().slice(0, 7)), make('Previous month', '-1', prev, true), make('Next month', '1', next, true));
  }

  updated() {
    if (!this.#view || !this.month) return;
    const label = D.formatDay(this.month + '-01', 'month', this.locale);
    this.#title.textContent = label;
    this.dataset.layout = ['agenda', 'grid', 'compact'].includes(this.layout) ? this.layout : 'auto';
    this.#renderNav();
    const byDay = new Map();
    for (const e of this.events ?? []) {
      if (!byDay.has(e.day)) byDay.set(e.day, []);
      byDay.get(e.day).push(e);
    }
    const ws = this.weekStart ?? D.weekStartFor(this.locale);
    const now = D.today();
    const max = this.maxItems ?? 3;
    const names = this.#toneLabels;
    const toneOf = (e) => (TONES.has(e.tone) ? e.tone : 'accent');

    // The month as a table of weeks.
    const table = document.createElement('table');
    table.className = 'kit-evcal-grid';
    table.setAttribute('aria-labelledby', this.#title.id);
    const long = D.weekdayNames(ws, 'long', this.locale);
    const short = D.weekdayNames(ws, 'short', this.locale);
    const narrow = D.weekdayNames(ws, 'narrow', this.locale);
    const thead = table.createTHead().insertRow();
    long.forEach((n, i) => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.abbr = n;
      th.innerHTML = '<span class="kit-evcal-wd"></span><span class="kit-evcal-wd-narrow" aria-hidden="true"></span>';
      th.firstElementChild.textContent = short[i];
      th.lastElementChild.textContent = narrow[i];
      thead.append(th);
    });
    const tbody = table.createTBody();
    const weeks = D.monthGrid(this.month, ws);
    // Drop a last week that's all next month.
    if (weeks[5][0].slice(0, 7) !== this.month) weeks.pop();
    const used = new Set();
    for (const week of weeks) {
      const tr = tbody.insertRow();
      for (const day of week) {
        const td = tr.insertCell();
        td.dataset.day = day;
        const outside = day.slice(0, 7) !== this.month;
        if (outside) td.dataset.outside = '';
        if (day === now) td.setAttribute('aria-current', 'date');
        const items = byDay.get(day) ?? [];
        // One dot per tone, in a fixed order; the day's name says what's in it.
        const counts = new Map();
        for (const e of items) counts.set(toneOf(e), (counts.get(toneOf(e)) ?? 0) + 1);
        const tones = TONE_ORDER.filter((t) => counts.has(t));
        if (!outside) for (const t of tones) used.add(t);
        const full = D.formatDay(day, 'long', this.locale);
        const summary = !items.length ? '' : Object.keys(names).length
          ? tones.map((t) => `${names[t] ?? t} ${counts.get(t)}`).join(', ')
          : `${items.length} ${items.length === 1 ? 'item' : 'items'}`;
        const num = document.createElement(this.dayHref ? 'a' : 'span');
        num.className = 'kit-evcal-date';
        if (this.dayHref) num.href = fill(this.dayHref, 'day', day);
        num.innerHTML = '<span class="kit-evcal-num" aria-hidden="true"></span><span class="kit-evcal-dots" aria-hidden="true"></span><span class="kit-vh"></span>';
        num.children[0].textContent = String(+day.slice(8));
        for (const t of tones) {
          const dot = document.createElement('i');
          dot.dataset.tone = t;
          num.children[1].append(dot);
        }
        num.children[2].textContent = summary ? `${full}: ${summary}` : full;
        td.append(num);
        if (!items.length) continue;
        const open = this.expanded === day;
        const ul = document.createElement('ul');
        ul.className = 'kit-evcal-items';
        ul.id = `${this.#title.id}-${day}`;
        for (const e of open ? items : items.slice(0, max)) ul.append(this.#item(e));
        td.append(ul);
        if (items.length > max) {
          const more = document.createElement('button');
          more.type = 'button';
          more.className = 'kit-evcal-more';
          more.dataset.more = day;
          more.setAttribute('aria-expanded', String(open));
          more.setAttribute('aria-controls', ul.id);
          more.textContent = open ? 'Show fewer' : `+${items.length - max} more`;
          td.append(more);
        }
      }
    }
    const parts = [table];

    // The month as an agenda, for layout="agenda" where it's narrow.
    if (this.dataset.layout === 'agenda') {
      const agenda = document.createElement('ol');
      agenda.className = 'kit-evcal-agenda';
      agenda.setAttribute('aria-label', label);
      const days = [...byDay.keys()].filter((d) => d.slice(0, 7) === this.month).sort();
      for (const day of days) {
        const li = document.createElement('li');
        if (day === now) li.setAttribute('aria-current', 'date');
        const h = document.createElement(this.dayHref ? 'a' : 'p');
        h.className = 'kit-evcal-day';
        if (this.dayHref) h.href = fill(this.dayHref, 'day', day);
        h.textContent = D.formatDay(day, { weekday: 'short', day: 'numeric', month: 'short' }, this.locale);
        const ul = document.createElement('ul');
        ul.className = 'kit-evcal-items';
        for (const e of byDay.get(day)) ul.append(this.#item(e));
        li.append(h, ul);
        agenda.append(li);
      }
      if (!days.length) {
        const li = document.createElement('li');
        li.className = 'kit-evcal-none';
        li.textContent = 'Nothing this month.';
        agenda.append(li);
      }
      parts.push(agenda);
    }
    const focusMore = this.#view.contains(document.activeElement) && document.activeElement.dataset.more;
    this.#view.replaceChildren(...parts);
    if (focusMore) this.#view.querySelector(`[data-more="${focusMore}"]`)?.focus();

    // The key: the tones this month uses, when they have names.
    const keyTones = TONE_ORDER.filter((t) => used.has(t) && names[t]);
    this.#key.hidden = !keyTones.length;
    this.#key.replaceChildren(...keyTones.map((t) => {
      const li = document.createElement('li');
      const dot = document.createElement('i');
      dot.dataset.tone = t;
      dot.setAttribute('aria-hidden', 'true');
      li.append(dot, names[t]);
      return li;
    }));
  }
}

KitEventCalendar.version = '0.1.0';
define('kit-event-calendar', KitEventCalendar);
