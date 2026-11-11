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
| `heading_level` | heading level | 2 by default. |
| `body` | textarea | A blank line starts a new paragraph; `*italics*` and `**bold**`. |
| `points` | list (up to 6) | Ticked points: `text`. |
| `link_label`, `link_url` | text, url | One arrow link at the end. |
| `background` | `plain` or `tinted` | Tinted is `--kit-band`, a step from the page colour. |

Built on kit's [text block](/content/text-block/) component, which the `split` section shares.

## Design

Base theme → Kit sections, `Text block` (`c_text_block`).
