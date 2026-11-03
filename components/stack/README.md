---
title: Stack
group: layout
order: 10
tier: 1
pattern: Layout
status: preview
summary: Children in a column with even space between them, the most common layout there is, with the gap taken from the spacing scale.
---

## Usage

```html
<div class="kit-stack" data-gap="3">
  <h2>Title</h2>
  <p>Supporting text.</p>
  <div class="kit-cluster">…</div>
</div>
```

| Attribute | Values | Default |
|---|---|---|
| `data-gap` | `0` to `6`, a step of the spacing scale (0, 4, 8, 12, 16, 24, 32px) | `4` |
| `data-align` | `start`, `center`, `end` | stretch |

A child with `data-push` takes up the spare space, so whatever comes after it sits at the bottom: handy for a card's footer.

The stack owns the space between its children and zeroes their own block margins, so spacing is decided in one place.

## Accessibility

- Layout only: it changes no roles and no reading order. The visual order is the source order, so keyboard and screen-reader order match what people see.
