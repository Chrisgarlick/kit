---
title: Tooltip
group: overlays
order: 40
tier: 2
pattern: APG tooltip
status: beta
summary: A short label beside an element on hover and keyboard focus, from one data-tooltip attribute, that can be hovered and dismissed with Escape.
---

## Usage

```html
<button class="kit-button" data-icon aria-label="Copy link" data-tooltip="Copy link">…</button>
<button class="kit-button" data-tooltip="Sends to everyone in the workspace">Share</button>
```

`tooltip.js` (in `kit.js`) watches the whole page, so tooltips work on elements added later too. `data-tooltip-placement` picks the side: `top` (default), `bottom`, `left` or `right`, flipping when there's no room.

Tooltips are for names and short hints, a few words. Never put anything people need, or anything they can click, in one: touch screens don't show them.

## Accessibility

- It shows on keyboard focus straight away, and on hover after a short pause.
- Escape hides it without closing a dialog underneath; moving the pointer onto it keeps it open (WCAG 1.4.13).
- When the tooltip repeats the element's name (an icon button's `aria-label`), it isn't read twice. When it adds something, it becomes the element's description, read after its name.
- Icon-only buttons still need their own `aria-label`: the tooltip is the visible version of it, not a replacement.
