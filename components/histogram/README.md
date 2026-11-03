---
title: Histogram
group: charts
order: 40
tier: 2
pattern: Chart from a table
status: beta
summary: How a set of values is spread, from a one-column table, binned on round numbers, with each bin's count and share on hover or from the keyboard.
---

## Usage

```html
<kit-chart type="histogram">
  <table>
    <caption>Title</caption>
    <thead><tr><th>Request</th><th>Response time (ms)</th></tr></thead>
    <tbody><tr><th>1</th><td>182</td></tr> …</tbody>
  </table>
</kit-chart>
```

Each row is one value, in the second column. The values are grouped into bins with round edges (100, 150, 200…), about as many as Sturges' rule suggests for the number of values; `bins="12"` asks for roughly twelve. Bars touch, because the bins are continuous.

## Accessibility

- The summary says how many values there are, the bin width and range, and the most common bin.
- Arrow keys step through the bins, announcing each range and its count; hovering shows the count and the share of all values.
- The table keeps every raw value for screen readers and behind "Show table".
