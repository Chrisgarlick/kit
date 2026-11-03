---
title: Alert
group: feedback
order: 10
tier: 1
pattern: Status message
status: preview
summary: An inline message for information, success, a warning or an error, with an optional title and actions.
---

## Usage

```html
<div class="kit-alert" data-tone="warn">
  <svg aria-hidden="true">…</svg>
  <div>
    <p class="kit-alert-title">Nearly out of storage</p>
    <p>68 of 100 GB used. Old exports are deleted after 30 days.</p>
  </div>
</div>
```

| Attribute | Values | Default |
|---|---|---|
| `data-tone` | `info`, `good`, `warn`, `bad` | `info` |

Put buttons or links that act on the message in `<div class="kit-alert-actions">`.

## Accessibility

- An alert that's on the page when it loads needs no role: people read it like any other text.
- One that **appears** later, after something happens, needs announcing: add `role="status"` (polite), or `role="alert"` only for errors that need attention straight away. Add the role before the text arrives, or use kit's `announce()`.
- The tone is never shown by colour alone: each one has its own icon, and the title says what happened.
- Text and icons meet WCAG AA contrast on every tone's background, in light and dark.
