// SPDX-License-Identifier: MIT
//
// Toggle buttons: a button with aria-pressed and data-toggle flips on
// click and fires `change` with detail { pressed }. Inside a group with
// data-exclusive, pressing one releases the rest and one stays pressed.
// Importing it twice is harmless.

const KEY = Symbol.for('kit.toggle');

function install() {
  if (globalThis[KEY]) return;
  globalThis[KEY] = true;
  document.addEventListener('click', (e) => {
    const b = e.target.closest?.('button[data-toggle][aria-pressed]');
    if (!b || b.disabled) return;
    const group = b.closest('[data-exclusive]');
    const on = b.getAttribute('aria-pressed') === 'true';
    if (group) {
      if (on) return; // one always stays pressed
      for (const other of group.querySelectorAll('button[data-toggle][aria-pressed="true"]')) {
        other.setAttribute('aria-pressed', 'false');
        other.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { pressed: false } }));
      }
    }
    b.setAttribute('aria-pressed', String(!on));
    b.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { pressed: !on } }));
  });
}

install();
