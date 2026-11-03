---
title: Dialog
group: overlays
order: 10
tier: 2
pattern: Native dialog
status: beta
summary: A modal on the native dialog element, opened and closed from markup, with Escape, focus return and an inert page behind it for free.
---

## Usage

```html
<button class="kit-button" commandfor="confirm" command="show-modal">Delete item</button>

<dialog class="kit-dialog" id="confirm" aria-labelledby="confirm-title" closedby="any">
  <header class="kit-dialog-header">
    <h2 id="confirm-title">Delete this item?</h2>
    <button class="kit-button" data-variant="ghost" data-icon commandfor="confirm" command="close" aria-label="Close">…</button>
  </header>
  <div class="kit-dialog-body"><p>Supporting text.</p></div>
  <footer class="kit-dialog-footer">
    <button class="kit-button" commandfor="confirm" command="close">Cancel</button>
    <button class="kit-button" data-variant="danger" commandfor="confirm" command="close" value="delete">Delete</button>
  </footer>
</dialog>
```

`commandfor` and `command` are the platform's own invoker commands; `dialog.js` (in `kit.js`) fills them in for browsers that don't have them yet, so no script of yours is needed to open or close a dialog.

| Markup | Does |
|---|---|
| `command="show-modal"` | opens the dialog as a modal |
| `command="close"` | closes it; the button's `value` becomes `dialog.returnValue` |
| `command="request-close"` | closes it unless a `cancel` listener says no |
| `closedby="any"` | a click on the backdrop closes it too |
| `data-size` | `sm` 24rem, `md` 32rem (default), `lg` 48rem |

Listen for `close` on the dialog and read `returnValue` to learn which button closed it. A form inside with `method="dialog"` closes it on submit, after the browser's own validation.

## Accessibility

- `showModal()` makes everything behind the dialog inert and traps focus inside; Escape closes it. Focus goes to the first focusable element, or to one with `autofocus`: put `autofocus` on the safe choice (Cancel) for destructive dialogs.
- When it closes, focus returns to the button that opened it.
- Name it with `aria-labelledby` pointing at its heading; add `aria-describedby` for a short message the screen reader should read straight away.
- Leave `closedby="any"` off dialogs holding unsaved input, so a stray click doesn't throw work away.
- The page behind stops scrolling while a modal is open. Opening animates unless the person prefers reduced motion.
