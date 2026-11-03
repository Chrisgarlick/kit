---
title: Cluster
group: layout
order: 20
tier: 1
pattern: Layout
status: preview
summary: Children in a row that wraps when it runs out of room, for tags, button rows, toolbars and headers with an action on the far side.
---

## Usage

```html
<div class="kit-cluster" data-justify="between">
  <h2>Title</h2>
  <button class="kit-button">Action</button>
</div>
```

| Attribute | Values | Default |
|---|---|---|
| `data-gap` | `0` to `6`, a step of the spacing scale (0, 4, 8, 12, 16, 24, 32px) | `2` |
| `data-justify` | `start`, `center`, `end`, `between` | `start` |
| `data-align` | `start`, `center`, `end`, `baseline`, `stretch` | `center` |
| `data-nowrap` | present to keep one line | wraps |

A child with `data-push` moves itself and everything after it to the far end, so a toolbar can have a group on each side.

## Accessibility

- Layout only. Keep the source order the reading order: don't reverse rows with CSS to put an action first.
- A row of related buttons that acts as one control wants `role="group"` and a label, like the button group.
