---
title: Heatmap
group: charts
order: 45
tier: 2
pattern: Chart from a table
status: beta
summary: A grid of values shaded by size, such as activity by day and hour, from a table, with each cell's value on hover and two-dimensional keyboard movement.
---

## Usage

```html
<kit-chart type="heatmap">
  <table>
    <caption>Title</caption>
    <thead><tr><th>Day</th><th>00:00</th><th>03:00</th> …</tr></thead>
    <tbody><tr><th>Mon</th><td>12</td><td>4</td> …</tr> …</tbody>
  </table>
</kit-chart>
```

Rows of the table are rows of the grid, and columns are columns. Each cell's shade runs from a pale tint of the accent (the lowest value) to the full accent (the highest), with a scale beneath. When cells are big enough, their values are printed in them, in a colour that stays readable on the shade. Empty cells are drawn plain.

## Accessibility

- The summary gives the size of the grid, the range, and where the highest and lowest values are.
- Arrow keys move across and up and down the grid, announcing the row, column and value; hovering shows the same.
- Shade is never the only way to read a value: the numbers are in the cells (when they fit), the tooltip and the table.
