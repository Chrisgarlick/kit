// SPDX-License-Identifier: MIT
//
// <kit-segmented>: one choice from a small set (APG radio group).
//
//   <kit-segmented aria-label="Date range" name="range" value="7d">
//     <button value="24h">24 hours</button>
//     <button value="7d">7 days</button>
//   </kit-segmented>
//
// It enhances the buttons it's given (light DOM): roles, aria-checked, a
// roving tabindex, arrow keys, Home and End. It submits `value` under `name`
// with its form, and fires `change` (detail.value) when the choice changes.

import { KitElement } from '../../core/element.js';
import { define } from '../../core/define.js';
import { roving } from '../../core/a11y.js';

export class KitSegmented extends KitElement {
  static shadow = false;
  static formAssociated = true;
  static props = {
    value: { type: String, reflect: true },
    name: { type: String },
    disabled: { type: Boolean, reflect: true },
  };

  #initial = null;
  #formDisabled = false; // from a disabled <fieldset> or form, kept apart from our own disabled

  /** The option buttons (direct children). */
  get options() {
    return [...this.querySelectorAll(':scope > button')];
  }

  /** The value an option stands for: its value attribute, else its text. */
  optionValue(button) {
    return button.value || button.textContent.trim();
  }

  connected() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'radiogroup');
    if (!this.getAttribute('aria-label') && !this.getAttribute('aria-labelledby')) {
      console.error('[kit] <kit-segmented> needs an aria-label or aria-labelledby naming the choice');
    }
    for (const b of this.options) {
      b.type = 'button';
      b.setAttribute('role', 'radio');
    }
    if (this.value == null) {
      const pre = this.options.find((b) => b.getAttribute('aria-checked') === 'true') ?? this.options[0];
      if (pre) this.value = this.optionValue(pre);
    }
    this.#initial ??= this.value;
    roving(this, {
      items: () => this.options,
      signal: this.signal,
      onMove: (b) => this.choose(b), // APG: arrows move and choose together
    });
    this.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b && b.parentElement === this && !b.disabled) this.choose(b);
    }, { signal: this.signal });
  }

  /** Chooses an option, as if the user had, and fires change when it differs. */
  choose(button) {
    if (this.disabled || this.#formDisabled) return;
    const v = this.optionValue(button);
    if (v === this.value) return;
    this.value = v;
    this.emit('change', { value: v });
  }

  firstUpdated() {
    this.#sync();
  }

  updated(changed) {
    if (changed.has('value') || changed.has('disabled')) this.#sync();
  }

  // Puts the options' checked state, tab stop and the form value in line
  // with `value`.
  #sync() {
    let current = null;
    for (const b of this.options) {
      const on = this.optionValue(b) === this.value;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
      b.disabled = Boolean(this.disabled) || this.#formDisabled;
      if (on) current = b;
    }
    // With nothing chosen, the first option is the way in.
    if (!current && this.options[0]) this.options[0].tabIndex = 0;
    this.internals.setFormValue(this.value ?? null);
  }

  formResetCallback() {
    this.value = this.#initial;
  }

  // Called when an ancestor <fieldset> (or our own disabled attribute)
  // changes whether we're disabled. Kept separate from `disabled`, so
  // re-enabling the fieldset re-enables us.
  formDisabledCallback(disabled) {
    this.#formDisabled = disabled;
    this.#sync();
  }
}

KitSegmented.version = '0.1.0';
define('kit-segmented', KitSegmented);
