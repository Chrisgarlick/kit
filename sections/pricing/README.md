---
title: Pricing
group: sections
order: 70
tier: 1
pattern: Website section
uses: [container, section-head, grid, card, button, link]
status: preview
summary: A heading and up to four price cards side by side. A name, the price, who it's for, what's included and a button, with one highlighted.
---

## Usage

```blade
<x-kit-section-pricing :content="$pricing" variant="centred" />
```

The heading row has the [section head](/content/section-head/)'s fields. Then:

| Field | Type | Notes |
|---|---|---|
| `plans` | list (up to 4) | `name`, `price` (as it reads: "£79", "From £49"), `per`, `description`, `features` (a list), `featured`, `badge`, `action_label`, `action_url`. |
| `background` | `plain` or `tinted` | |

The row has as many columns as there are prices, and wraps on narrow screens.

## Accessibility

- Each price is a card in a list, its name an `h3`.
- Highlighting is a border, a badge in words and the primary button, not colour alone.
- Each button says which price it chooses to screen readers ("Choose this: Standard").

## Design

Base theme → Kit sections, `Section / with grid` with `Card / price` (`c_price_card`): Pricing, centred, the middle card featured.
