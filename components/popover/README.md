---
title: Popover
group: overlays
order: 25
tier: 2
pattern: Native popover
status: beta
summary: A small panel beside the button that opened it, on the native popover attribute, for details, help and quick settings.
---

## Usage

```html
<button class="kit-button" popovertarget="help">What's this?</button>
<div popover id="help" class="kit-popover">
  <p class="kit-popover-title">Title</p>
  <p>Supporting text.</p>
</div>
```

The browser opens and closes it: the button toggles it, Escape and a click outside close it, and opening one closes any other. `popover.js` (in `kit.js`) places it beside the button, flipping and sliding to stay on screen, and does all of this itself in browsers without popovers (before Safari 17 and Firefox 125).

| Attribute | Values | Default |
|---|---|---|
| `data-placement` | `bottom-start`, `bottom-end`, `top-start`, `right`, … | `bottom-start` |
| `data-anchor` | the id of an element to sit beside instead of the button | the button |
| `data-size` | `sm` 14rem, `md` 20rem, `lg` 28rem | `md` |
| `popover="manual"` | only its button (or script) closes it | `auto`, light dismiss |

Use a popover for something people look at and then leave. For choosing an action, use a menu; for a task with buttons that must be answered, a dialog.

## Accessibility

- The button announces whether the popover is expanded.
- The popover isn't modal: focus stays on the button when it opens, and Tab moves into the popover's content next. Escape closes it and returns focus to the button.
- If the popover is a labelled region worth finding again, give it `role="region"` and an `aria-label`; for one line of help, a tooltip may suit better.
