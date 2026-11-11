---
title: Hero
group: sections
order: 20
tier: 1
pattern: Website section
status: preview
summary: The first thing on a page. A label, a heading with emphasis, a supporting line, up to two buttons, a line of proof and an image, split or centred.
---

## Usage

```blade
<x-kit-section-hero :content="$hero" variant="centred" />
```

```php
echo kit_section(__DIR__ . '/kit/hero.php', ['content' => $hero, 'variant' => 'centred']);
```

| Variant | Layout |
|---|---|
| `default` | Split: the text beside the image. |
| `centred` | The text centred, the image below it, wider. |

| Field | Type | Notes |
|---|---|---|
| `eyebrow` | text | A short label above the heading. |
| `title` | rich text, required | `*words in stars*` are set in italics. |
| `lede` | textarea | One or two sentences. |
| `actions` | list (up to 2) | `label`, `url`, `style` (`primary` or `secondary`). |
| `proof` | rich text | A review score or a fact; `**stars**` make it bold. Bound to the site's review summary. |
| `image` | image | Alt text is required. Loaded with `fetchpriority="high"`: it's above the fold. |
| `heading_level` | heading level | 1 by default: the hero carries the page's `<h1>`. |

Without an image the hero shows a placeholder box, as in Design, so the layout holds while the
owner picks one.

## Layout

A size container: below **48rem of its own width** it stacks, the buttons go full width and the
image becomes 4:3.

## Accessibility

- One `<h1>` per page: set `heading_level` to 2 when the hero isn't the page's first section.
- The proof line's star is decorative; the words carry the meaning.
- Rich text is escaped before its marks become `<em>` and `<strong>`, so content can't carry
  markup.

## Design

Base theme → Kit sections, `Section / hero` (`c_hero`): default, centred and mobile.
