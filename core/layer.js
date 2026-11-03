// SPDX-License-Identifier: MIT
//
// Layers: showing a menu, popover or tooltip above everything else. Where
// the browser has the popover API (Chrome 114, Safari 17, Firefox 125) the
// element goes into the top layer, above dialogs and outside any
// overflow: hidden. Before that it's position: fixed with a high z-index.
// Either way the element gets data-open while it's shown, which kit's CSS
// uses to display it.

export const nativePopover = typeof HTMLElement.prototype.showPopover === 'function';

export function showLayer(el) {
  el.setAttribute('data-open', '');
  if (nativePopover) {
    if (!el.hasAttribute('popover')) el.setAttribute('popover', 'manual');
    if (!el.matches(':popover-open')) el.showPopover();
  }
}

export function hideLayer(el) {
  el.removeAttribute('data-open');
  if (nativePopover && el.hasAttribute('popover') && el.matches(':popover-open')) el.hidePopover();
}

/**
 * Calls `onDismiss` when a press starts outside every one of `els` (the
 * floating element and whatever opened it), until `signal` aborts.
 */
export function onOutside(els, onDismiss, signal) {
  document.addEventListener('pointerdown', (e) => {
    const path = e.composedPath();
    if (!els.some((el) => path.includes(el))) onDismiss(e);
  }, { capture: true, signal });
}
