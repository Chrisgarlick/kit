---
title: Donut chart
group: charts
order: 30
tier: 2
pattern: Chart from a table
status: beta
summary: Parts of a whole from a two-column table, with the total in the middle, a legend, and each part's value and share on hover or from the keyboard.
---

## Usage

```html
<kit-chart type="donut">
  <table>
    <caption>Title</caption>
    <thead><tr><th>Part</th><th>Count</th></tr></thead>
    <tbody><tr><th>Part one</th><td>420</td></tr> …</tbody>
  </table>
</kit-chart>
```

The first column names the parts and the second holds their values; the middle shows the total, labelled with the value column's heading. Parts are drawn in table order, clockwise from the top.

Donuts are for a handful of parts of one whole, up to about six. To compare sizes closely, or across groups, a bar chart is easier to read.

## Accessibility

- The summary gives the total and the largest parts with their shares ("Largest: Part one 42%…").
- Arrow keys step through the parts and announce each one's value and share; so does hovering.
- The legend names every part in the same order and colours, and the table holds the exact figures.
