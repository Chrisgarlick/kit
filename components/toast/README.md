---
title: Toast
group: feedback
order: 20
tier: 2
pattern: Status message
status: beta
summary: Short messages in a corner that go away by themselves, from one function or from markup, announced to screen readers without moving focus.
---

## Usage

```js
import { toast } from './components/toast/toast.js'; // or kit.toast(…) once kit.js has loaded
toast('Changes saved', { tone: 'good' });
toast('Item deleted', { action: { label: 'Undo', onClick: restore } });
```

A message the server sends with the page (a flash message) needs no script of yours:

```html
<p hidden data-kit-toast data-tone="good">Changes saved</p>
```

| Option | Values | Default |
|---|---|---|
| `tone` | `neutral`, `good`, `warn`, `bad`, `info` | `neutral` |
| `description` | a second, quieter line | none |
| `action` | `{ label, onClick }`, a button that runs `onClick` and dismisses | none |
| `duration` | milliseconds, or `Infinity` to stay | 5s, 10s with an action |

`toast()` returns `{ dismiss }`. Up to four show at once, newest last; on phones they sit at the top. A button with `data-toast="…"` (and `data-toast-tone`, `data-toast-description`, `data-toast-action`) shows one when pressed; its action fires a `toastaction` event on the button.

Toasts confirm what just happened. Anything people must act on, or must not miss, belongs on the page (an alert) or in a dialog.

## Accessibility

- Each toast is announced through a live region (WCAG 4.1.3), politely, or assertively for `bad`, so focus never moves.
- The timer pauses while the pointer is over a toast or focus is inside it, and a toast with an action lasts twice as long (WCAG 2.2.1). Don't put the only way to do something in a toast's action.
- Every toast can be dismissed with its close button.
- While a modal dialog is open, toasts appear inside it, so they're readable and their buttons work.
