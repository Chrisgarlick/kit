---
title: Scroll area
group: layout
order: 70
tier: 1
pattern: Region
status: preview
summary: A box that scrolls its own content, with slim scrollbars and soft shadows that show there is more, keyboard-reachable as a labelled region.
---

## Usage

```html
<div class="kit-scroll" data-height="md" role="region" aria-label="Activity" tabindex="0">…</div>
```

| Attribute | Values | Default |
|---|---|---|
| `data-height` | `sm` 10rem, `md` 16rem, `lg` 24rem | none (set your own `max-block-size`) |
| `data-axis` | `x`, `y`, `both` | `y` |

Shadows appear at an edge only while there is more content past it, drawn with backgrounds that move with the scroll, so no script is needed.

## Accessibility

- Anything that scrolls must be reachable by keyboard (WCAG 2.1.1): give it `tabindex="0"`, `role="region"` and an `aria-label`, so arrow keys scroll it and screen readers announce what it is.
- Don't nest scroll areas, and avoid them for a page's main content; a page that scrolls is easier for everyone.
