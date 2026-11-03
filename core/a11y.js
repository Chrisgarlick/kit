// SPDX-License-Identifier: MIT
//
// Accessibility helpers shared by kit's components.

let counter = 0;
/** A unique id for aria-labelledby / aria-describedby wiring within one root. */
export const uid = (prefix = 'kit') => `${prefix}-${++counter}`;

const regions = new WeakMap(); // container -> { polite, assertive }

function liveRegion(container, politeness) {
  let r = regions.get(container);
  if (!r) {
    r = {};
    for (const p of ['polite', 'assertive']) {
      const el = document.createElement('div');
      el.setAttribute('aria-live', p);
      el.setAttribute('aria-atomic', 'true');
      el.dataset.kitLive = p;
      el.style.cssText = 'position:absolute;inline-size:1px;block-size:1px;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0;padding:0';
      container.append(el);
      r[p] = el;
    }
    regions.set(container, r);
  }
  return r[politeness];
}

/**
 * Tells screen-reader users something without moving their focus (WCAG
 * 4.1.3): "Saved", "3 results". Polite waits for a pause; assertive
 * interrupts, for errors. While a modal dialog is open everything outside it
 * is inert, so the message goes to a region inside the dialog.
 */
export function announce(message, politeness = 'polite') {
  const modal = [...document.querySelectorAll('dialog[open]')].findLast((d) => d.matches(':modal'));
  const region = liveRegion(modal ?? document.body, politeness === 'assertive' ? 'assertive' : 'polite');
  region.textContent = '';
  // A short gap lets screen readers notice the change, even for the same words twice.
  setTimeout(() => { region.textContent = message; }, 100);
}

/**
 * Roving tabindex (APG): one item in the tab order, arrow keys move between
 * items, Home and End jump to the ends. Used by tabs, toolbars, radio groups
 * and menus. Returns a function that focuses an item and makes it current.
 */
export function roving(container, { items, orientation = 'both', wrap = true, onMove, signal } = {}) {
  const list = () => items().filter((el) => !el.disabled && !el.hidden && el.getAttribute('aria-disabled') !== 'true');
  const move = (el, focus = true) => {
    for (const i of items()) i.tabIndex = i === el ? 0 : -1;
    if (focus) el.focus();
    onMove?.(el);
  };
  container.addEventListener('keydown', (e) => {
    const all = list();
    const i = all.indexOf(document.activeElement) >= 0 ? all.indexOf(document.activeElement) : all.findIndex((el) => el.contains(e.target));
    if (i < 0) return;
    const rtl = getComputedStyle(container).direction === 'rtl';
    const keys = {
      ArrowDown: orientation !== 'horizontal' ? 1 : 0,
      ArrowUp: orientation !== 'horizontal' ? -1 : 0,
      ArrowRight: orientation !== 'vertical' ? (rtl ? -1 : 1) : 0,
      ArrowLeft: orientation !== 'vertical' ? (rtl ? 1 : -1) : 0,
    };
    let j = null;
    if (keys[e.key]) j = i + keys[e.key];
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = all.length - 1;
    if (j === null) return;
    e.preventDefault();
    j = wrap ? (j + all.length) % all.length : Math.max(0, Math.min(all.length - 1, j));
    move(all[j]);
  }, { signal });
  return move;
}
