---
title: Line chart
group: charts
order: 10
tier: 2
pattern: Chart from a table
status: beta
summary: Lines or areas over time from a plain table, with a value axis on round numbers, values on hover and from the keyboard, and the table one click away.
---

## Usage

```html
<kit-chart type="line" format="compact">
  <table>
    <caption>Title</caption>
    <thead><tr><th>Month</th><th>Series A</th><th>Series B</th></tr></thead>
    <tbody>
      <tr><th>Jan</th><td>1200</td><td>800</td></tr>
      <tr><th>Feb</th><td>1350</td><td>940</td></tr>
    </tbody>
  </table>
</kit-chart>
```

The table is the data: the first column labels the points and every other column is a series. A cell's `data-value` wins over its text, so cells can show "£1.2k" and still chart 1200; an empty cell is a gap in the line. Without the script, people see the table.

| Attribute | Values | Default |
|---|---|---|
| `type` | `line`, `area` (also `bar` and `donut`, on their own pages) | `line` |
| `format` | `number`, `compact`, `percent`, `currency:GBP` | `number` |
| `zero` | present to start the value axis at zero | fits the data (areas always start at zero) |
| `points` | present to mark each value with a dot | lines only |

Set the height with `--kit-chart-height` (240px by default); the width follows the container and the chart redraws to fit. To draw from script, set `chart.data = { labels, series: [{ name, values }] }`. Changing the table redraws the chart.

Series take colours from `--kit-series-1` to `--kit-series-6`, which every theme can set. Keep to a few series; past four or five, small multiples read better.

## Accessibility

- The plot is a focusable group, named by the caption, and described by a generated summary: "Line chart, 12 points from Jan to Dec. Series A rose from 1,200 to 2,900, highest 2,900 (Dec), lowest 1,200 (Jan)…".
- Arrow keys move along the points and announce each one's values; Home and End jump to the ends. Hovering shows the same values.
- The data table stays in the page for screen readers, and "Show table" reveals it for everyone.
- Lines are told apart by the legend and the tooltip's names, not colour alone.
