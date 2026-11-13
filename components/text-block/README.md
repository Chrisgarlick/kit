---
title: Text block
group: content
order: 10
tier: 1
pattern: Prose
status: preview
summary: A label, a heading, a few paragraphs, ticked points and one link. The text side of a page section, left-aligned or centred.
---

## Usage

```html
<div class="kit-text-block">
  <p class="kit-text-block-eyebrow">About us</p>
  <h2 class="kit-text-block-title">The people behind the business</h2>
  <div class="kit-text-block-body"><p>…</p></div>
  <ul class="kit-text-block-points" role="list"><li>A credential</li></ul>
  <p class="kit-text-block-actions"><a class="kit-link" data-variant="arrow" href="/about">Our story</a></p>
</div>
```

| Attribute | Values | Default |
|---|---|---|
| `data-align` | `centre` | left |

Every part is optional except the heading. The `text-block` and `split` sections are built on it.

## Accessibility

- The heading's level suits where the block sits (usually `h2`); the label above it is a paragraph, not a heading.
- The points are a list; their ticks are drawn by CSS and aren't read out. `role="list"` keeps the list announced in Safari, which drops it when the bullets are removed.
- A point marked `data-excluded` is drawn with a cross instead of the tick, and starts with visually hidden text (`<span class="kit-vh">Not included: </span>`), so it's said as well as drawn.
- The link at the end must make sense on its own.
