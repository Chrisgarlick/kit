---
title: Bullet chart
group: charts
order: 65
tier: 2
pattern: Chart from a table
status: beta
summary: Measures against their targets, one compact row each, from a table, for dashboards where a gauge would take too much room.
---

## Usage

```html
<kit-chart type="bullet">
  <table>
    <caption>Title</caption>
    <thead><tr><th>Measure</th><th>Value</th><th>Target</th><th>Max</th></tr></thead>
    <tbody><tr><th>Revenue</th><td>270</td><td>250</td><td>300</td></tr> …</tbody>
  </table>
</kit-chart>
```

Each row is one measure on its own scale: a track up to the max (the optional fourth column; otherwise a round number just past the larger of value and target), a lighter band to 80% of it, the value as a bar and the target as a tick. The right-hand figure is the value as a share of the target. Each row is 46px tall.

## Accessibility

- The summary reads every measure against its target: "Revenue 270 against 250 (108%)".
- Arrow keys step through the measures; hovering shows the same in a tooltip.
- The target is a tick and the value a bar, told apart by shape, with the legend naming both.
