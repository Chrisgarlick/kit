---
title: Gallery
group: sections
order: 75
tier: 1
pattern: Website section
uses: [container, section-head, grid, link]
status: preview
summary: A heading and a grid of photos of the work, each cropped to 4:3, with an optional caption.
---

## Usage

```blade
<x-kit-section-gallery :content="$gallery" />
```

The heading row has the [section head](/content/section-head/)'s fields. Then:

| Field | Type | Notes |
|---|---|---|
| `columns` | `2`, `3` or `4` | |
| `images` | list (up to 24) | `image` (alt text required), `caption`. A photo not chosen yet shows a placeholder. |
| `background` | `plain` or `tinted` | |

Photos are lazy-loaded and cropped to 4:3 so the grid stays even.

## Accessibility

- Every photo needs alt text that says what the job was; the caption can add where and when.
- A lightbox (opening a photo larger) is planned as a small tier 2 piece.

## Design

Base theme → Kit sections, `Section / with grid` with image placeholders: Gallery.
