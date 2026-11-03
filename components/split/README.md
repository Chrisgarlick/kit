---
title: Split
group: layout
order: 40
tier: 1
pattern: Layout
status: preview
summary: A narrow side beside a wide main area, such as filters next to results, that stacks by itself when there isn't room for both.
---

## Usage

```html
<div class="kit-split">
  <aside>Filters</aside>
  <div>Results</div>
</div>
```

The side keeps its width and the main area takes the rest. Once the main area would be narrower than half the row, the two stack, with no breakpoint, so it responds to its container rather than the screen.

| Attribute | Values | Default |
|---|---|---|
| `data-side` | `start` (the first child is the side), `end` (the last is) | `start` |
| `data-width` | `sm` 12rem, `md` 16rem, `lg` 22rem | `md` |
| `data-gap` | `0` to `6`, a step of the spacing scale (0, 4, 8, 12, 16, 24, 32px) | `5` |

## Accessibility

- The side comes first or last in the source as well as on screen, so it's read in the order it's seen. Put filters before results, and a summary after the form it summarises.
- Use landmarks inside when they're page-level (`<aside>`, `<main>`), not for every split.
