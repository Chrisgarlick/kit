---
title: Text block
group: sections
order: 30
tier: 1
pattern: Website section
uses: [container, text-block, link]
status: preview
summary: A section of words. A label, a heading, a few paragraphs, ticked points and a link, left-aligned or centred, plain or tinted.
---

## Usage

```blade
<x-kit-section-text-block :content="$intro" variant="centred" />
```

```php
echo kit_section(__DIR__ . '/kit/text-block.php', ['content' => $intro, 'variant' => 'centred']);
```

| Field | Type | Notes |
|---|---|---|
| `eyebrow` | text | A short label above the heading. |
| `title` | rich text, required | `*Stars*` for italics. |
| `title_size` | `normal` or `large` | `normal` by default; `large` is display size (up to 5rem), and the block widens to 52rem to carry it. |
| `heading_level` | heading level | 2 by default. |
| `body` | textarea | A blank line starts a new paragraph; `*italics*` and `**bold**`. |
| `points` | list (any length) | Ticked points: `text`, and `excluded` (boolean, off by default): a cross instead of the tick, the point in the quieter text colour, and "Not included:" said first to screen readers (visually hidden). For what a price or a package leaves out. |
| `link_label`, `link_url` | text, url | One arrow link at the end. |
| `background` | `plain` or `tinted` | Tinted is `--kit-band`, a step from the page colour. |

Built on kit's [text block](/content/text-block/) component, which the `split` section shares.

## Accessibility

- The ticks and crosses are drawn by CSS and not read out; a point that's excluded starts with "Not included:" in visually hidden text, so the difference is said as well as drawn.

## Design

Base theme → Kit sections, `Text block` (`c_text_block`).
