---
title: Call to action
group: sections
order: 80
tier: 1
pattern: Website section
uses: [container, button, link]
status: preview
summary: A band in the accent colour. One line that asks, one that reassures, a button, an optional text link and a phone number.
---

## Usage

```blade
<x-kit-section-cta :content="$cta" />
```

```php
echo kit_section(__DIR__ . '/kit/cta.php', ['content' => $cta]);
```

| Field | Type | Notes |
|---|---|---|
| `eyebrow` | text | Optional. A short kicker above the heading, in the band's text colour. |
| `title` | rich text, required | |
| `heading_level` | heading level | 2 by default. |
| `lede` | text | One reassuring line. |
| `action_label`, `action_url` | text, url | The button, in the band's colours swapped. |
| `secondary_label`, `secondary_url` | text, url | Optional, empty by default. A second action as a text link with an arrow (kit's arrow link), beside the button; on a phone it stacks under it. In the band's text colour. |
| `phone` | text | Linked with `tel:`. Bound to the site's phone. |

## Layout

A size container: below 48rem of its own width the text and actions stack and the button goes full width.

## Accessibility

- Text on the band uses `--kit-accent-fg`, which a brand must keep at 4.5:1 against its accent (`kit brand` checks it).
- The button, the text link and the phone link have visible focus rings in the band's text colour.

## Design

Base theme → Kit sections, `Section / call to action` (`c_cta`) and its mobile state.
