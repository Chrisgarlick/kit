// SPDX-License-Identifier: MIT
//
// Positioning for things that float next to something else: menus,
// popovers, tooltips. One code path in every browser (CSS anchor
// positioning isn't in Firefox or Safari 16.4 yet).
//
//   const stop = follow(menu, button, { placement: 'bottom-start' });
//   …
//   stop();
//
// The floating element is position: fixed and sits on `placement`'s side of
// the anchor, flipping to the other side when there's more room there and
// sliding along to stay inside the viewport. It gets data-side (the side it
// ended up on) and --kit-available-height / --kit-available-width (the room
// on that side), for max sizes and arrows.

const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));

/**
 * Where a box of `size` goes next to the `anchor` rect inside `viewport`.
 * placement is side[-align]: top|bottom|left|right, and start|center|end.
 * Pure, for testing; place() is the one that touches the DOM.
 */
export function computePosition(anchor, size, viewport, { placement = 'bottom-start', offset = 6, padding = 8, rtl = false } = {}) {
  let [side, align = 'center'] = placement.split('-');
  const room = {
    top: anchor.top - padding,
    bottom: viewport.height - anchor.bottom - padding,
    left: anchor.left - padding,
    right: viewport.width - anchor.right - padding,
  };
  const vertical = side === 'top' || side === 'bottom';
  const need = (vertical ? size.height : size.width) + offset;
  if (room[side] < need && room[opposite[side]] > room[side]) side = opposite[side];
  if (rtl && vertical && align !== 'center') align = align === 'start' ? 'end' : 'start';
  let x, y;
  if (vertical) {
    y = side === 'bottom' ? anchor.bottom + offset : anchor.top - offset - size.height;
    x = align === 'start' ? anchor.left : align === 'end' ? anchor.right - size.width : anchor.left + (anchor.width - size.width) / 2;
    x = clamp(x, padding, viewport.width - padding - size.width);
  } else {
    x = side === 'right' ? anchor.right + offset : anchor.left - offset - size.width;
    y = align === 'start' ? anchor.top : align === 'end' ? anchor.bottom - size.height : anchor.top + (anchor.height - size.height) / 2;
    y = clamp(y, padding, viewport.height - padding - size.height);
  }
  // A box bigger than the viewport keeps its start edge on screen.
  return {
    x: Math.max(padding, x),
    y: Math.max(padding, y),
    side,
    availableHeight: vertical ? room[side] - offset : viewport.height - 2 * padding,
    availableWidth: vertical ? viewport.width - 2 * padding : room[side] - offset,
  };
}

/** Places `floating` next to `anchor` once. The floating element must be displayed. */
export function place(floating, anchor, options = {}) {
  const s = floating.style;
  s.setProperty('position', 'fixed');
  s.setProperty('inset', 'auto');
  s.setProperty('margin', '0');
  const a = anchor.getBoundingClientRect();
  const f = floating.getBoundingClientRect();
  const rtl = getComputedStyle(anchor).direction === 'rtl';
  const viewport = { width: document.documentElement.clientWidth, height: window.innerHeight };
  const r = computePosition(a, { width: f.width, height: f.height }, viewport, { ...options, rtl });
  s.setProperty('left', `${Math.round(r.x)}px`);
  s.setProperty('top', `${Math.round(r.y)}px`);
  s.setProperty('--kit-available-height', `${Math.max(0, Math.floor(r.availableHeight))}px`);
  s.setProperty('--kit-available-width', `${Math.max(0, Math.floor(r.availableWidth))}px`);
  floating.dataset.side = r.side;
  return r;
}

/**
 * Places `floating` now and again whenever the page scrolls or resizes or
 * either element changes size, until the returned function is called.
 */
export function follow(floating, anchor, options = {}) {
  const ctl = new AbortController();
  let frame = 0;
  const update = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => { if (anchor.isConnected && floating.isConnected) place(floating, anchor, options); });
  };
  place(floating, anchor, options);
  addEventListener('scroll', update, { capture: true, passive: true, signal: ctl.signal });
  addEventListener('resize', update, { passive: true, signal: ctl.signal });
  const ro = new ResizeObserver(update);
  ro.observe(anchor);
  ro.observe(floating);
  return () => {
    ctl.abort();
    ro.disconnect();
    cancelAnimationFrame(frame);
    delete floating.dataset.side;
  };
}
