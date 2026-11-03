---
title: Funnel chart
group: charts
order: 60
tier: 2
pattern: Chart from a table
status: beta
summary: How many make it through each stage of a process, from a two-column table, with the share kept at every step and the biggest drop named in the summary.
---

## Usage

```html
<kit-chart type="funnel">
  <table>
    <caption>Title</caption>
    <thead><tr><th>Stage</th><th>People</th></tr></thead>
    <tbody><tr><th>Visited</th><td>12000</td></tr><tr><th>Signed up</th><td>2400</td></tr> …</tbody>
  </table>
</kit-chart>
```

Stages run top to bottom in table order. Each bar is centred and sized against the largest stage; the percentage on the right is the share of the stage above. The chart is as tall as it needs to be, 52px a stage.

## Accessibility

- The summary gives the start and end, how many make it through, and where the biggest drop is: "The biggest drop is from Visited to Signed up, losing 80%."
- Arrow keys step through the stages, announcing each one's value, its share of the stage before and of the first.
- Values are printed on the bars (or beside them, when a bar is too narrow), so nothing depends on bar length alone.
