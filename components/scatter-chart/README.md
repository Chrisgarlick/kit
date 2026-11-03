---
title: Scatter chart
group: charts
order: 35
tier: 2
pattern: Chart from a table
status: beta
summary: Two measures plotted against each other, from a table, with optional groups, the nearest point on hover, and the relationship described in words.
---

## Usage

```html
<kit-chart type="scatter">
  <table>
    <caption>Title</caption>
    <thead><tr><th>Item</th><th>Size</th><th>Score</th><th>Group</th></tr></thead>
    <tbody><tr><th>Item 1</th><td>42</td><td>61</td><td>Group A</td></tr> …</tbody>
  </table>
</kit-chart>
```

The first column names each point, the second is across (x) and the third up (y); both axes take round numbers that cover the data. An optional fourth column of text puts the points in groups, each with its own colour and a legend.

Hovering finds the nearest point within a short distance and draws guides to both axes. Arrow keys step through the points from left to right.

## Accessibility

- The summary gives both ranges and how the two measures relate, from the correlation: "showing a strong positive relationship (r = 0.86)".
- Each point announces its name, both values and its group; the table holds every figure.
- Groups are named in the legend and the tooltip, not told apart by colour alone.
