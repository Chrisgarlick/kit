// SPDX-License-Identifier: MIT
//
// Tooltips from one attribute (no custom element):
//
//   <button data-tooltip="Copy link" aria-label="Copy link">…</button>
//
// A short label appears beside the element on hover (after a moment) and on
// keyboard focus, and goes on Escape, on leaving, or on blur. Pointer users
// can move onto it without it vanishing (WCAG 1.4.13). When the text says
// more than the element's own name, it's added as its description. Touch
// presses don't show it: put anything people need into the element itself.
// Importing it twice is harmless.

import { place } from '../../core/position.js';
import { showLayer, hideLayer } from '../../core/layer.js';

const KEY = Symbol.for('kit.tooltip');
const SHOW_DELAY = 450;
const HIDE_GRACE = 120;

function install() {
  if (globalThis[KEY]) return;
  globalThis[KEY] = true;
  const tip = document.createElement('div');
  tip.className = 'kit-tooltip';
  tip.id = 'kit-tooltip';
  tip.setAttribute('role', 'tooltip');
  let current = null;
  let showTimer = 0;
  let hideTimer = 0;

  const describe = (el, on) => {
    const ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter((x) => x && x !== tip.id);
    if (on) ids.push(tip.id);
    if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
    else el.removeAttribute('aria-describedby');
  };
  const nameOf = (el) => (el.getAttribute('aria-label') || el.textContent || '').trim();

  const show = (el) => {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    if (current && current !== el) hide();
    const text = el.dataset.tooltip?.trim();
    if (!text) return;
    current = el;
    tip.textContent = text;
    // Inside an open modal dialog, everything outside is inert: live there.
    const host = el.closest('dialog[open]') ?? document.body;
    if (tip.parentNode !== host) host.append(tip);
    showLayer(tip);
    place(tip, el, { placement: el.dataset.tooltipPlacement || 'top', offset: 8 });
    if (text !== nameOf(el)) describe(el, true);
  };
  const hide = () => {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    if (!current) return;
    describe(current, false);
    current = null;
    hideLayer(tip);
  };
  const hideSoon = () => {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, HIDE_GRACE);
  };
  const owner = (t) => t?.closest?.('[data-tooltip]');

  document.addEventListener('pointerover', (e) => {
    if (e.pointerType === 'touch') return;
    if (tip.contains(e.target)) { clearTimeout(hideTimer); return; }
    const el = owner(e.target);
    if (!el) return;
    clearTimeout(hideTimer);
    if (el === current) return;
    clearTimeout(showTimer);
    if (current) show(el); // moving between tooltipped things: no second wait
    else showTimer = setTimeout(() => show(el), SHOW_DELAY);
  }, true);
  document.addEventListener('pointerout', (e) => {
    const from = tip.contains(e.target) ? current : owner(e.target);
    if (!from) return;
    const to = e.relatedTarget;
    if (to && (tip.contains(to) || from.contains(to))) return;
    clearTimeout(showTimer);
    if (from === current) hideSoon();
  }, true);
  document.addEventListener('focusin', (e) => {
    const el = owner(e.target);
    if (el && el.matches(':focus-visible')) show(el);
  }, true);
  document.addEventListener('focusout', (e) => {
    if (owner(e.target) === current) hide();
  }, true);
  document.addEventListener('pointerdown', () => hide(), true);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && current) {
      e.preventDefault(); // the first Escape dismisses the tooltip, not the dialog under it
      e.stopPropagation();
      hide();
    }
  }, true);
}

install();
