---
title: Ruled list
group: sections
order: 35
tier: 1
pattern: Website section
uses: [container, section-head]
status: preview
summary: Numbered rows between thin rules, each a name, a line of description and a value on the right ("1 to 3 weeks"). An optional heading, and a link per row.
---

## Usage

```blade
<x-kit-section-ruled-list :content="$services" />
```

| Field | Type | Notes |
|---|---|---|
| `eyebrow`, `title`, `heading_level`, `lede` | | An optional section head, `*stars*` for italics. Left out when all three are empty. |
| `rows` | list (1 to 12) | `name` (rich text), `text` (one line), `value` (right-aligned: a duration, a size), `number` and `url`. |
| `rows.number` | text | Empty: numbered from the row's position, `01`, `02`… Or give one ("A", "2.1"). |
| `rows.url` | url | Makes the whole row a link to the name's page. |
| `tone` | `dark`, `tinted` or `plain` | Dark is the `--kit-inverse-*` band, like stats. |

Not for prices: a value is a duration, a size or a cadence. Prices belong in the pricing section.

## Layout

A size container. Each row is a grid: the number, the name in the display face, the value on the
right, and the description under the name, with a 1px rule above every row and below the last.
Below 36rem of the section's own width the value drops under the name (a phone: two lines and the
description).

## Accessibility

- An ordered list (`<ol role="list">`, so Safari keeps the list semantics without bullets): a
  screen reader hears "1 of 5" and the row's text in reading order, name, value, description.
- Automatic numbers are drawn by CSS and `aria-hidden`, since the list gives the position; a
  number you type is read as text.
- A linked row is one link, named by the row's name, stretched over the row so the whole row is
  the target; its focus ring goes round the row.
- The heading level is a field (default `h2`); row names aren't headings.

## Design

Kit · Nightfolio, the Services page's "Ways to work together" (`nf_*`); not yet in the Kit
sections file.
