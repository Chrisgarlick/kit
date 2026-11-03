---
title: Skeleton
group: feedback
order: 50
tier: 1
pattern: Decorative placeholder
status: preview
summary: Placeholders shaped like the content that's on its way, so the page doesn't jump when it arrives.
---

## Usage

Draw the outline of what's coming (an avatar and two lines, a chart block) and swap it for the real content when it loads. Size skeletons like the real thing; that's what keeps layout shift at zero.

| Attribute | Values | Default |
|---|---|---|
| `data-shape` | `text`, `circle`, `block` | `text` |
| `data-width` | `25`, `40`, `60`, `80`, `100` (per cent) | `100` |

## Accessibility

- Skeletons are decoration: put `aria-hidden="true"` on the group.
- Tell people something is loading another way: `aria-busy="true"` on the region being filled, and a visually hidden "Loading…" if it takes a while.
- The shimmer stops for people who prefer reduced motion.
