---
title: Quote and stats
group: sections
order: 36
tier: 1
pattern: Website section
uses: [container]
status: preview
summary: A quote that sums up working with you, on the accent's soft colour, beside two or three numbers that back it up.
---

## Usage

```blade
<x-kit-section-quote-stats :content="$proof" />
```

| Field | Type | Notes |
|---|---|---|
| `quote` | rich text, required | A customer's words (with permission) or your own promise. `*Stars*` for italics. |
| `attribution` | text | "Name · where it's from". |
| `stats` | list (up to 3) | `value` ("500+", "58 → 13"), `label`. |
| `background` | `plain` or `tinted` | |

## Accessibility

- The quote is a `figure` with its `blockquote` and `figcaption`; the numbers are a description list, read "label: number".
- The quote is large text on the accent's soft colour (3:1 is enough, and `kit brand` checks `accent` on `accent-soft`); the smaller attribution is in the quiet text colour.

## Design

Base theme → Kit sections, `Section / quote + stats` (`c_quote_stats`) and its mobile state.
