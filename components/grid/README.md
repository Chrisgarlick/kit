---
title: Grid
group: layout
order: 30
tier: 1
pattern: Layout
status: preview
summary: Equal columns that fill the row and wrap on their own, with no breakpoints, for groups of cards, tiles and form fields.
---

## Usage

```html
<div class="kit-grid" data-min="sm" data-cols="3">
  <article class="kit-card">…</article>
  <article class="kit-card">…</article>
  <article class="kit-card">…</article>
</div>
```

The grid fits as many columns as it can, each at least `data-min` wide, up to `data-cols` per row. As the container narrows, columns drop off one at a time until there's one, so it works the same in a page, a sidebar or a dialog.

| Attribute | Values | Default |
|---|---|---|
| `data-min` | `xs` 8rem, `sm` 12rem, `md` 16rem, `lg` 20rem, `xl` 26rem | `md` |
| `data-cols` | `2`, `3`, `4`, `6`: the most columns per row | as many as fit |
| `data-fit` | present to stretch a short last row to fill the width | keeps columns even |
| `data-gap` | `0` to `6`, a step of the spacing scale (0, 4, 8, 12, 16, 24, 32px) | `4` |

A child with `data-span="full"` takes a whole row, for a heading inside the grid.

## Accessibility

- Layout only, in source order: people read and tab through items left to right, row by row, just as they're drawn.
- When the items are a list of things (cards for each result, say), use `<ul class="kit-grid">` with `<li>`s, so screen readers say how many there are.
