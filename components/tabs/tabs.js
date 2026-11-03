// SPDX-License-Identifier: MIT
//
// <kit-tabs>: one panel at a time, chosen from a row of tabs (APG tabs).
//
//   <kit-tabs>
//     <div class="kit-tablist" aria-label="Sections">
//       <button>Overview</button> <button>Activity</button>
//     </div>
//     <div>Overview panel</div> <div>Activity panel</div>
//   </kit-tabs>
//
// It enhances the markup it's given (light DOM): the nth button shows the
// nth panel. Roles, aria-selected, aria-controls and a roving tabindex are
// wired up; arrows move (and choose, unless activation="manual"), Home and End
// jump. Before the script loads, every panel is shown and the tabs are not.
// `value` is the chosen tab's value attribute, else its text; `change` fires
// with detail.value.

import { KitElement } from '../../core/element.js';
import { define } from '../../core/define.js';
import { roving, uid } from '../../core/a11y.js';

export class KitTabs extends KitElement {
  static shadow = false;
  static props = {
    value: { type: String, reflect: true },
    activation: { type: String }, // "auto" (default) or "manual"
  };

  /** The tab list: the first child with class kit-tablist or role tablist. */
  get list() {
    return this.querySelector(':scope > .kit-tablist, :scope > [role="tablist"]');
  }

  /** The tab buttons, in order. */
  get tabs() {
    return this.list ? [...this.list.querySelectorAll(':scope > button')] : [];
  }

  /** The panels, in order: every other child. */
  get panels() {
    const list = this.list;
    return [...this.children].filter((el) => el !== list);
  }

  tabValue(tab) {
    return tab.value || tab.textContent.trim();
  }

  connected() {
    const list = this.list;
    if (!list) {
      console.error('[kit] <kit-tabs> needs a child with class="kit-tablist" holding the tab buttons');
      return;
    }
    list.setAttribute('role', 'tablist');
    if (!list.getAttribute('aria-label') && !list.getAttribute('aria-labelledby')) {
      console.error('[kit] <kit-tabs>: the tab list needs an aria-label or aria-labelledby');
    }
    const vertical = this.dataset.orientation === 'vertical';
    if (vertical) list.setAttribute('aria-orientation', 'vertical');
    const panels = this.panels;
    this.tabs.forEach((tab, i) => {
      const panel = panels[i];
      tab.type = 'button';
      tab.setAttribute('role', 'tab');
      tab.id ||= uid('kit-tab');
      if (!panel) return;
      panel.id ||= uid('kit-tabpanel');
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      tab.setAttribute('aria-controls', panel.id);
      // APG: the panel is a tab stop, so keyboard users reach its content
      // even when it has nothing focusable.
      if (!panel.hasAttribute('tabindex')) panel.tabIndex = 0;
    });
    if (this.value == null) {
      const pre = this.tabs.find((t) => t.getAttribute('aria-selected') === 'true') ?? this.tabs[0];
      if (pre) this.value = this.tabValue(pre);
    }
    roving(list, {
      items: () => this.tabs,
      orientation: vertical ? 'vertical' : 'horizontal',
      signal: this.signal,
      onMove: (t) => { if (this.activation !== 'manual') this.choose(t); },
    });
    list.addEventListener('click', (e) => {
      const t = e.target.closest('button');
      if (t && t.parentElement === list && !t.disabled) this.choose(t);
    }, { signal: this.signal });
  }

  /** Shows a tab's panel, as if the user had chosen it; fires change when it differs. */
  choose(tab) {
    const v = this.tabValue(tab);
    if (v === this.value) return;
    this.value = v;
    this.emit('change', { value: v });
  }

  firstUpdated() {
    this.#sync();
  }

  updated(changed) {
    if (changed.has('value')) this.#sync();
  }

  #sync() {
    const panels = this.panels;
    let any = false;
    this.tabs.forEach((tab, i) => {
      const on = this.tabValue(tab) === this.value;
      any ||= on;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (panels[i]) panels[i].hidden = !on;
    });
    if (!any && this.tabs[0]) this.choose(this.tabs[0]);
  }
}

KitTabs.version = '0.1.0';
define('kit-tabs', KitTabs);
