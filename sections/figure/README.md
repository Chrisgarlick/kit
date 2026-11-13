---
title: Figure
group: sections
order: 76
tier: 1
pattern: Website section
uses: [container]
status: preview
summary: One wide image, like a screenshot of the work, with a caption row under it (left and right) and an optional proof card (a label, a big number, a note) over its corner.
---

## Usage

```blade
<x-kit-section-figure :content="$figure" />
```

```php
echo kit_section(__DIR__ . '/kit/figure.php', ['content' => $figure]);
```

| Field | Type | Notes |
|---|---|---|
| `image` | image | Alt text required. Shown at its own shape, the container's width, lazy-loaded. Empty, it shows a 16:9 placeholder. |
| `caption_left` | text | Optional. What the image shows, on the left of the caption row. |
| `caption_right` | text | Optional. A short note on the right (a date, a client), in the mono face. |
| `proof_label` | text | Optional. The card's small label, in the mono face. |
| `proof_value` | text | The card's big number ("100", "0.4 s"). Empty, there's no card. |
| `proof_note` | text | Optional. A line under the number. |
| `tone` | `plain`, `tinted` or `dark` | `plain` by default. Dark is the `--kit-inverse-*` band, like the footer; the card stays on `--kit-surface`. |

A section without a heading: it sits under the text it illustrates. For several photos with a
heading, use the [gallery](/sections/gallery/); for an image beside text, the
[split](/sections/split/) (which takes a caption too).

## Layout

A size container. The proof card floats over the image's bottom-right corner, inside it: keep that corner
of the image free of anything that matters. Below **40rem of its own width** the card sits under the
image, full width, and the caption's two halves stack, left over right.

## Accessibility

- One `<figure>`: the image, then the card, then the `<figcaption>` holding both captions, so a
  screen reader hears them in that order and the captions name the figure.
- The card is paragraphs, not a heading; nothing in it is only in colour.
- The image needs alt text that says what the screenshot shows; the caption can add the context.

## Design

chrisgarlick.com redesign: the service pages' full-width screenshot with a caption row and a
proof card; not yet in the Kit sections file.
