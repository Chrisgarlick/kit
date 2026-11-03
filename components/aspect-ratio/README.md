---
title: Aspect ratio
group: layout
order: 80
tier: 1
pattern: Layout
status: preview
summary: A box that keeps its shape as it resizes, for images, video and embeds, so the page never jumps when they load.
---

## Usage

```html
<div class="kit-ratio" data-ratio="16/9"><img src="…" alt="…"></div>
```

| Attribute | Values | Default |
|---|---|---|
| `data-ratio` | `1/1`, `4/3`, `3/2`, `16/9`, `21/9`, `3/4` | `16/9` |
| `data-fit` | `contain`, to show the whole image | `cover`, filling the box |

The image, video or iframe inside fills the box. Set `width` and `height` attributes on images as well, so browsers reserve the space before the CSS arrives.

## Accessibility

- Layout only. Images inside still need their `alt` text, and videos captions.
- `cover` crops the edges: keep anything important in the middle, or use `contain`.
