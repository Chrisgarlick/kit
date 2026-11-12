---
title: Services
group: sections
order: 50
tier: 1
pattern: Website section
uses: [container, section-head, grid, card, link]
status: preview
summary: A heading and a grid of service cards. An icon, a name, two lines about it, an optional proof point and a link to its page.
---

## Usage

```blade
<x-kit-section-services :content="$services" />
```

```php
echo kit_section(__DIR__ . '/kit/services.php', ['content' => $services]);
```

The heading row has the [section head](/content/section-head/)'s fields: `eyebrow`, `title`, `heading_level`, `lede`, and a `link_label` and `link_url` at the end of the row. Then:

| Field | Type | Notes |
|---|---|---|
| `rule` | boolean | Off by default. A heavy rule (3px, the text colour) under the heading row. |
| `columns` | `1`, `2`, `3` or `4` | The most cards in a row (3 by default). The grid wraps by itself: one card a row on a phone. `1` is a single column at every width. |
| `services` | list (up to 12) | `number` (an optional small label above the name, like "01 — Laravel"), `icon` (from kit's icon set), `title`, `subtitle` (an optional second line of the name, rich text: `*stars*` for italics), `text`, `proof` (a result or guarantee, as a chip), `link_label`, `link_url`. |
| `background` | `plain` or `tinted` | The cards take the other colour. |

## Accessibility

- The cards are a list. Each card's name is an `h3`, under the section's `h2`; a `subtitle` is part of that heading, on a line of its own.
- A card's `number` label is read out (it names the service's area, "01 — Laravel"), before the heading.
- Each card's link says which service it's for to screen readers ("Find out more: Repairs").
- Icons are decorative; the name says what the service is.

## Design

Base theme → Kit sections, `Section / with grid` (`c_section_grid`) with `Card / service` (`c_service_card`): Services, and the one-column mobile state.
