// SPDX-License-Identifier: MIT
//
// <kit-menu>: a button that opens a list of actions (APG menu button).
//
//   <kit-menu>
//     <button class="kit-button">Actions</button>
//     <div class="kit-menu-list">
//       <button value="edit">Edit</button>
//       <hr>
//       <button value="delete" data-tone="bad">Delete</button>
//     </div>
//   </kit-menu>
//
// The first <button> child opens it; the .kit-menu-list holds the items
// (buttons, or links to go somewhere). Opening moves focus to the first item
// (ArrowUp on the button: the last). Arrows, Home and End move, typing jumps
// to an item by its first letters, Enter or a click picks one, Escape and
// clicks outside close it, and focus returns to the button. `select` fires
// with detail { value, item }.

import { KitElement } from '../../core/element.js';
import { define } from '../../core/define.js';
import { uid } from '../../core/a11y.js';
import { follow } from '../../core/position.js';
import { showLayer, hideLayer, onOutside } from '../../core/layer.js';

export class KitMenu extends KitElement {
  static shadow = false;
  static props = {
    placement: { type: String }, // bottom-start (default), bottom-end, top-start, …
  };

  #close = null;
  #opener = null; // context menus: what had focus before opening
  #ghost = null; // context menus: a point to open beside
  #typed = '';
  #typedAt = 0;

  /** True for a context menu: opened by right-click, Shift+F10 or the Menu key on its region. */
  get isContext() { return this.hasAttribute('context'); }

  /** The button that opens it; for a context menu, the region it belongs to. */
  get trigger() {
    return this.isContext ? this.querySelector(':scope > :not(.kit-menu-list)') : this.querySelector(':scope > button');
  }
  get list() { return this.querySelector(':scope > .kit-menu-list'); }

  /** The items that can be chosen now. */
  get items() {
    return [...(this.list?.querySelectorAll(':scope > :is(button, a)') ?? [])]
      .filter((i) => !i.disabled && i.getAttribute('aria-disabled') !== 'true');
  }

  get open() { return this.#close !== null; }

  connected() {
    const { trigger, list } = this;
    if (!trigger || !list) {
      console.error('[kit] <kit-menu> needs a <button> (or, with context, a region) and a .kit-menu-list as children');
      return;
    }
    list.id ||= uid('kit-menu');
    list.setAttribute('role', 'menu');
    if (this.isContext) {
      if (!list.hasAttribute('aria-label')) list.setAttribute('aria-label', this.getAttribute('label') || 'Actions');
    } else {
      trigger.type = 'button';
      trigger.id ||= uid('kit-menubutton');
      trigger.setAttribute('aria-haspopup', 'menu');
      trigger.setAttribute('aria-controls', list.id);
      trigger.setAttribute('aria-expanded', 'false');
      list.setAttribute('aria-labelledby', trigger.id);
    }
    for (const i of list.querySelectorAll(':scope > :is(button, a)')) {
      i.setAttribute('role', 'menuitem');
      i.tabIndex = -1;
      if (i.localName === 'button') i.type = 'button';
    }
    for (const hr of list.querySelectorAll(':scope > hr')) hr.setAttribute('role', 'separator');

    const on = { signal: this.signal };
    if (this.isContext) {
      trigger.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.hide(false);
        this.#opener = document.activeElement;
        this.show('first', { x: e.clientX, y: e.clientY });
      }, on);
      trigger.addEventListener('keydown', (e) => {
        if (e.key !== 'ContextMenu' && !(e.shiftKey && e.key === 'F10')) return;
        e.preventDefault();
        this.#opener = document.activeElement;
        const r = (trigger.contains(document.activeElement) ? document.activeElement : trigger).getBoundingClientRect();
        this.show('first', { x: r.left + 8, y: r.top + Math.min(r.height, 32) });
      }, on);
    }
    if (!this.isContext) trigger.addEventListener('click', () => (this.open ? this.hide() : this.show()), on);
    if (!this.isContext) trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.show(e.key === 'ArrowUp' ? 'last' : 'first');
      }
    }, on);
    list.addEventListener('keydown', (e) => this.#key(e), on);
    list.addEventListener('click', (e) => {
      const i = e.target.closest('[role="menuitem"]');
      if (i && i.parentElement === list && this.items.includes(i)) this.#pick(i);
    }, on);
    // Pointing at an item focuses it, so the keyboard carries on from there.
    list.addEventListener('pointermove', (e) => {
      const i = e.target.closest('[role="menuitem"]');
      if (i && this.items.includes(i) && document.activeElement !== i) i.focus({ preventScroll: true });
    }, on);
  }

  disconnected() {
    this.hide(false);
  }

  /** Opens the menu and focuses its first item, or 'last'; `at` ({ x, y }) opens it beside a point. */
  show(focus = 'first', at = null) {
    if (this.open || !this.list) return;
    const { list, trigger } = this;
    showLayer(list);
    if (!this.isContext) trigger.setAttribute('aria-expanded', 'true');
    let anchor = trigger;
    if (at) {
      // A one-pixel element at the point, for the positioning helper to follow.
      const g = document.createElement('span');
      g.setAttribute('aria-hidden', 'true');
      for (const [k, v] of [['position', 'fixed'], ['left', `${at.x}px`], ['top', `${at.y}px`], ['width', '1px'], ['height', '1px'], ['pointer-events', 'none']]) g.style.setProperty(k, v);
      this.append(g);
      this.#ghost = g;
      anchor = g;
    }
    const ctl = new AbortController();
    const stop = follow(list, anchor, { placement: at ? 'bottom-start' : this.placement || 'bottom-start', offset: at ? 2 : 6 });
    onOutside(this.isContext ? [list] : [list, trigger], () => this.hide(false), ctl.signal);
    if (this.isContext) addEventListener('scroll', () => this.hide(false), { capture: true, passive: true, once: true, signal: ctl.signal });
    this.#close = () => { ctl.abort(); stop(); this.#ghost?.remove(); this.#ghost = null; };
    const items = this.items;
    (focus === 'last' ? items.at(-1) : items[0])?.focus({ preventScroll: true });
  }

  /** Closes the menu, returning focus to its button unless told not to. */
  hide(returnFocus = true) {
    if (!this.open) return;
    this.#close();
    this.#close = null;
    hideLayer(this.list);
    if (!this.isContext) this.trigger.setAttribute('aria-expanded', 'false');
    if (returnFocus) (this.isContext && this.#opener?.isConnected ? this.#opener : this.trigger).focus();
  }

  #pick(item) {
    if (!this.open) return; // Enter picks on keydown; don't pick again on the click that follows
    const value = item.getAttribute('value') ?? item.textContent.trim();
    this.hide();
    this.emit('select', { value, item });
  }

  #key(e) {
    const items = this.items;
    const i = items.indexOf(document.activeElement);
    const go = (j) => items[(j + items.length) % items.length]?.focus();
    switch (e.key) {
      case 'ArrowDown': go(i + 1); break;
      case 'ArrowUp': go(i < 0 ? -1 : i - 1); break;
      case 'Home': go(0); break;
      case 'End': go(-1); break;
      case 'Escape': this.hide(); break;
      case 'Tab': this.hide(); return; // focus is back on the button; Tab carries on from there
      case 'Enter': case ' ':
        if (i >= 0 && items[i].localName === 'button') this.#pick(items[i]);
        else if (i >= 0) { this.hide(false); items[i].click(); }
        break;
      default: {
        if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
        // Typeahead: letters typed close together build up a prefix.
        const now = e.timeStamp;
        this.#typed = now - this.#typedAt < 600 ? this.#typed + e.key.toLowerCase() : e.key.toLowerCase();
        this.#typedAt = now;
        const order = [...items.slice(i + 1), ...items.slice(0, i + 1)];
        const prefix = this.#typed.length > 1 && items[i]?.textContent.trim().toLowerCase().startsWith(this.#typed);
        const hit = prefix ? items[i] : order.find((it) => it.textContent.trim().toLowerCase().startsWith(this.#typed));
        hit?.focus();
      }
    }
    e.preventDefault();
  }
}

KitMenu.version = '0.1.0';
define('kit-menu', KitMenu);
