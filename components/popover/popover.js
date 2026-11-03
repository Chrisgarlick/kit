// SPDX-License-Identifier: MIT
//
// Popover behaviour for the native popover attribute (no custom element):
//
//   <button popovertarget="p">Details</button>
//   <div popover id="p" class="kit-popover" [data-placement="bottom-start"] [data-anchor="id"]>…</div>
//
// The browser opens and closes it, with Escape and clicks outside; this
// places it next to the button that opened it (or the element named by
// data-anchor) and keeps it there. In browsers without popovers (Safari
// 16.4, Firefox before 125) it opens and closes them too, with the same
// keys and light dismiss. Importing it twice is harmless.

import { follow } from '../../core/position.js';
import { nativePopover } from '../../core/layer.js';

const KEY = Symbol.for('kit.popover');

function install() {
  if (globalThis[KEY]) return;
  globalThis[KEY] = true;
  const invokers = new WeakMap(); // popover -> the button that last opened it
  const stops = new WeakMap(); // popover -> stop following

  const opened = (pop) => {
    pop.setAttribute('data-open', '');
    const invoker = invokers.get(pop);
    const anchor = (pop.dataset.anchor && document.getElementById(pop.dataset.anchor)) || invoker;
    invoker?.setAttribute('aria-expanded', 'true');
    if (anchor) stops.set(pop, follow(pop, anchor, { placement: pop.dataset.placement || 'bottom-start' }));
  };
  const closed = (pop) => {
    pop.removeAttribute('data-open');
    invokers.get(pop)?.setAttribute('aria-expanded', 'false');
    stops.get(pop)?.();
    stops.delete(pop);
  };
  const target = (b) => {
    const pop = document.getElementById(b.getAttribute('popovertarget'));
    return pop?.classList.contains('kit-popover') ? pop : null;
  };

  // Remember who opened each popover, before the browser opens it.
  document.addEventListener('click', (e) => {
    const b = e.target.closest?.('button[popovertarget]');
    const pop = b && !b.disabled && target(b);
    if (!pop) return;
    invokers.set(pop, b);
    if (!nativePopover) {
      const action = b.getAttribute('popovertargetaction') || 'toggle';
      const isOpen = pop.hasAttribute('data-open');
      if (action !== 'hide' && !isOpen) { closeOthers(pop); opened(pop); }
      else if (action !== 'show' && isOpen) closed(pop);
    }
  }, true);

  if (nativePopover) {
    document.addEventListener('toggle', (e) => {
      const pop = e.target;
      if (!(pop instanceof HTMLElement) || !pop.classList.contains('kit-popover')) return;
      if (e.newState === 'open') opened(pop);
      else closed(pop);
    }, true);
    return;
  }

  // Without native popovers: one auto popover open at a time, and Escape or
  // a press outside closes it, putting focus back on its button.
  const auto = (pop) => (pop.getAttribute('popover') || 'auto') === 'auto';
  const openAuto = () => [...document.querySelectorAll('.kit-popover[data-open]')].filter(auto);
  function closeOthers(pop) {
    for (const p of openAuto()) if (p !== pop && !p.contains(invokers.get(pop))) closed(p);
  }
  const dismiss = (pop, refocus) => {
    const had = pop.contains(document.activeElement);
    closed(pop);
    if (refocus || had) invokers.get(pop)?.focus();
  };
  document.addEventListener('pointerdown', (e) => {
    for (const p of openAuto()) {
      const inv = invokers.get(p);
      if (!p.contains(e.target) && !(inv && inv.contains(e.target))) dismiss(p, false);
    }
  }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const top = openAuto().at(-1);
    if (top) { e.preventDefault(); dismiss(top, true); }
  });
}

install();
