---
title: Small multiples
group: charts
order: 55
tier: 2
pattern: Charts from a table
status: beta
summary: One small chart per series on one shared scale, from a single table, for comparing many series without a tangle of overlapping lines.
---

## Usage

```html
<kit-multiples type="line" format="compact">
  <table>
    <caption>Title</caption>
    <thead><tr><th>Month</th><th>Series A</th><th>Series B</th><th>Series C</th></tr></thead>
    <tbody>…</tbody>
  </table>
</kit-multiples>
```

The table is the same shape as a [line chart](/charts/line-chart/)'s. Each series becomes its own small chart (`type` is `line`, `area` or `bar`), named after it, in a grid that fills the row. They share one value axis, so a taller line really is a bigger number; that's the point of small multiples, and why kit sets it for you.

Reach for these past four or five series, or when series cross so often that one chart becomes a tangle.

## Accessibility

- Each small chart is a full kit chart: focusable, named after its series, summarised, with values on hover and from the arrow keys.
- The original table stays in the page for screen readers and behind "Show table".
