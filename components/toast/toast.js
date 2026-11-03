// SPDX-License-Identifier: MIT
//
// Toasts: short messages in a corner that go away by themselves.
//
//   import { toast } from 'kit/components/toast/toast.js';   (or kit.toast(), once kit.js has loaded)
//   toast('Changes saved', { tone: 'good' });
//   toast('Item deleted', { action: { label: 'Undo', onClick: restore } });
//
// From markup, for messages the server sends with a page (a flash message):
//
//   <p hidden data-kit-toast data-tone="good">Changes saved</p>
//
// and on a button, which shows one when pressed (handy for demos):
//
//   <button data-toast="Changes saved" data-toast-tone="good">Save</button>
//
// Screen readers hear each toast through a live region (errors
// assertively). A toast waits while the pointer is over it or focus is in
// it, and one with an action stays longer. Up to four show at once.

import { announce } from '../../core/a11y.js';
import { showLayer, hideLayer } from '../../core/layer.js';

const MAX = 4;
const ICONS = {
  good: '<path d="m6.8 10.2 2.2 2.2 4.2-4.6"/><circle cx="10" cy="10" r="7.5"/>',
  warn: '<path d="M10 3.5 2.8 16h14.4L10 3.5Z"/><path d="M10 8.5v3.5M10 14h.01"/>',
  bad: '<circle cx="10" cy="10" r="7.5"/><path d="m7.5 7.5 5 5m0-5-5 5"/>',
  info: '<circle cx="10" cy="10" r="7.5"/><path d="M10 9v4.5M10 6.5h.01"/>',
};
const svg = (paths) => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

// One stack per host: the page, or the open modal dialog (everything outside
// a modal is inert, so its toasts live inside it).
const stacks = new WeakMap();
function stack() {
  const host = [...document.querySelectorAll('dialog[open]')].findLast((d) => d.matches(':modal')) ?? document.body;
  let s = stacks.get(host);
  if (!s || !s.isConnected) {
    s = document.createElement('ol');
    s.className = 'kit-toasts';
    s.setAttribute('aria-label', 'Notifications');
    host.append(s);
    stacks.set(host, s);
  }
  // Re-showing puts it back on top of anything opened since.
  hideLayer(s);
  showLayer(s);
  return s;
}

/**
 * Shows a toast. Returns { dismiss }.
 *   tone: neutral (default), good, warn, bad, info
 *   description: a second, quieter line
 *   action: { label, onClick } — a button; pressing it runs onClick and dismisses
 *   duration: ms before it goes (5000; 10000 with an action; Infinity keeps it)
 */
export function toast(message, { tone = 'neutral', description = '', action = null, duration } = {}) {
  const s = stack();
  const li = document.createElement('li');
  li.className = 'kit-toast';
  li.dataset.tone = tone;
  if (ICONS[tone]) li.insertAdjacentHTML('beforeend', svg(ICONS[tone]));
  const body = document.createElement('div');
  body.className = 'kit-toast-body';
  const title = document.createElement('p');
  title.className = 'kit-toast-title';
  title.textContent = message;
  body.append(title);
  if (description) {
    const d = document.createElement('p');
    d.textContent = description;
    body.append(d);
  }
  li.append(body);
  let dismiss;
  if (action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'kit-button';
    b.dataset.size = 'sm';
    b.textContent = action.label;
    b.addEventListener('click', () => { action.onClick?.(); dismiss(); });
    li.append(b);
  }
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'kit-toast-close';
  close.setAttribute('aria-label', 'Dismiss');
  close.innerHTML = svg('<path d="m6 6 8 8m0-8-8 8"/>');
  close.addEventListener('click', () => dismiss());
  li.append(close);
  s.append(li);
  while (s.children.length > MAX) s.firstElementChild.remove();

  announce([message, description, action && `${action.label} available`].filter(Boolean).join('. '), tone === 'bad' ? 'assertive' : 'polite');

  // The timer pauses while someone is reading or using it.
  const total = duration ?? (action ? 10000 : 5000);
  let left = total;
  let started = 0;
  let timer = 0;
  const run = () => { if (Number.isFinite(left)) { started = performance.now(); timer = setTimeout(() => dismiss(), left); } };
  const pause = () => { clearTimeout(timer); if (started) left -= performance.now() - started; started = 0; };
  const resume = () => { if (!li.matches(':hover, :focus-within')) run(); };
  li.addEventListener('pointerenter', pause);
  li.addEventListener('pointerleave', resume);
  li.addEventListener('focusin', pause);
  li.addEventListener('focusout', (e) => { if (!li.contains(e.relatedTarget)) resume(); });
  run();

  let gone = false;
  dismiss = () => {
    if (gone) return;
    gone = true;
    clearTimeout(timer);
    li.dataset.leaving = '';
    const remove = () => {
      li.remove();
      if (!s.children.length) { hideLayer(s); s.remove(); }
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) remove();
    else setTimeout(remove, 180);
  };
  return { dismiss };
}

const KEY = Symbol.for('kit.toast');
if (!globalThis[KEY]) {
  globalThis[KEY] = true;
  (globalThis.kit ??= {}).toast = toast;
  const flash = () => {
    for (const el of document.querySelectorAll('[data-kit-toast]')) {
      el.removeAttribute('data-kit-toast');
      toast(el.textContent.trim(), { tone: el.dataset.tone, description: el.dataset.description });
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', flash, { once: true });
  else flash();
  document.addEventListener('click', (e) => {
    const b = e.target.closest?.('button[data-toast]');
    if (!b || b.disabled) return;
    const d = b.dataset;
    toast(d.toast, {
      tone: d.toastTone,
      description: d.toastDescription,
      action: d.toastAction ? { label: d.toastAction, onClick: () => b.dispatchEvent(new CustomEvent('toastaction', { bubbles: true })) } : null,
    });
  });
}
