// SPDX-License-Identifier: MIT
//
// Copy buttons: a button with data-copy="text" or data-copy-target="#id"
// copies to the clipboard, says "Copied" for a moment (and announces it),
// and fires `copy` with detail { text }. When the clipboard is refused, the
// target's text is selected instead. Importing it twice is harmless.

import { announce } from '../../core/a11y.js';

const KEY = Symbol.for('kit.copy');

function selectText(el) {
  if (!el) return;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) { el.focus(); el.select(); return; }
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function confirm(button, ok) {
  const label = button.getAttribute('aria-label');
  const text = ok ? 'Copied' : 'Press Ctrl or ⌘ and C to copy';
  clearTimeout(button._kitCopyTimer);
  if (!button.dataset.copyLabel) button.dataset.copyLabel = label ?? '';
  // Swap the last text node (the label), keeping icons.
  const node = [...button.childNodes].reverse().find((n) => n.nodeType === 3 && n.textContent.trim());
  if (node && !button.dataset.copyText) button.dataset.copyText = node.textContent;
  if (node) node.textContent = ok ? 'Copied' : node.textContent;
  if (label != null) button.setAttribute('aria-label', ok ? 'Copied' : label);
  button.dataset.copied = ok ? 'true' : 'false';
  announce(text);
  button._kitCopyTimer = setTimeout(() => {
    if (node && button.dataset.copyText) node.textContent = button.dataset.copyText;
    if (button.dataset.copyLabel) button.setAttribute('aria-label', button.dataset.copyLabel);
    delete button.dataset.copied;
  }, 2000);
}

function install() {
  if (globalThis[KEY]) return;
  globalThis[KEY] = true;
  document.addEventListener('click', async (e) => {
    const button = e.target.closest?.('button[data-copy], button[data-copy-target]');
    if (!button || button.disabled) return;
    const target = button.dataset.copyTarget ? document.querySelector(button.dataset.copyTarget) : null;
    const text = button.dataset.copy ?? (target && ('value' in target ? target.value : target.textContent)) ?? '';
    try {
      await navigator.clipboard.writeText(text);
      confirm(button, true);
      button.dispatchEvent(new CustomEvent('copy', { bubbles: true, detail: { text } }));
    } catch {
      selectText(target);
      confirm(button, false);
    }
  });
}

install();
