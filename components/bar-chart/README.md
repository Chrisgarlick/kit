---
title: Bar chart
group: charts
order: 20
tier: 2
pattern: Chart from a table
status: beta
summary: Bars side by side or stacked, from a plain table, always from zero, with negative values below the line and the same keyboard and table support as every chart.
---

## Usage

```html
<kit-chart type="bar">
  <table>
    <caption>Title</caption>
    <thead><tr><th>Quarter</th><th>Series A</th><th>Series B</th></tr></thead>
    <tbody><tr><th>Q1</th><td>42</td><td>30</td></tr> …</tbody>
  </table>
</kit-chart>
```

It's the same element as the [line chart](/charts/line-chart/), with `type="bar"`: the table works the same way and so do `format`, `--kit-chart-height` and `data`. Add `stacked` to pile each row's series on top of each other, for parts of a total.

Bars always start at zero, so their lengths compare honestly. Negative values hang below the zero line.

## Accessibility

- As for every chart: a focusable group with a generated summary, arrow keys that move between bars and announce their values, and the table for screen readers and behind "Show table".
- Hovering or arrowing to a bar dims the others, so the highlighted one stands out without relying on colour.
