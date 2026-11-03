---
title: Sparkline
group: charts
order: 50
tier: 2
pattern: Image (role img)
status: beta
summary: A tiny trend line or set of bars to sit beside a number, in a stat tile or a table cell, described in words for screen readers.
---

## Usage

```html
<kit-sparkline values="12 18 15 22 30 28 34" label="Weekly visits" area></kit-sparkline>
```

| Attribute | Values | Default |
|---|---|---|
| `values` | numbers, separated by spaces or commas | none |
| `label` | what it shows, the start of its accessible name | "Trend" |
| `type` | `line`, `bar` | `line` |
| `area` | present to fill under the line | a plain line |
| `data-tone` | `good`, `bad`, `warn`, `info` | the accent colour |
| `format` | `number`, `compact`, `percent`, `currency:GBP`, for the description | `number` |

Size it with `inline-size` and `block-size` (6rem by 1.75rem by default); it redraws to fit. Sparklines show a shape, not values: put the number that matters beside it.

## Accessibility

- It's `role="img"`, named by `label` plus a description of the data: "Weekly visits: from 12 to 34, low 12, high 34".
- Colour is a tone, never the only signal: say whether a trend is good in the text next to it.
