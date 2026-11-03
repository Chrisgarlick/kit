---
title: Data table
group: data-display
order: 50
tier: 2
pattern: Native table
status: beta
summary: A native table for rows of records, with right-aligned tabular figures, a scroll area, sticky headers and sortable columns.
---

## Usage

```html
<div class="kit-table-wrap" role="region" aria-label="Items" tabindex="0">
  <table class="kit-table" data-sortable>
    <thead><tr><th scope="col">Name</th><th scope="col" data-numeric data-sort="number">Count</th></tr></thead>
    <tbody><tr><th scope="row">Item one</th><td data-numeric data-value="1024">1,024</td></tr></tbody>
  </table>
</div>
```

| Attribute | On | Does |
|---|---|---|
| `data-numeric` | `th`, `td` | right-aligns in tabular figures |
| `data-sortable` | `table` | header buttons that sort the rows (`table-sort.js`, in `kit.js`) |
| `data-sort` | `th` | `text` (natural: Item 2 before Item 10), `number`, `date`, or `none` |
| `data-value` | `td` | the value to sort by, when the text is formatted ("1,024", "3 Nov") |
| `data-striped`, `data-sticky` | `table` | zebra rows; a header that stays put as the area scrolls (with `data-max-height` on the wrap) |
| `data-wrap` | `th`, `td` | lets long text wrap |
| `aria-selected="true"` | `tr` | highlights a chosen row |

Sorting rearranges the rows already in the page; for thousands of rows, or sorting on the server, use the data grid (coming next) or sort the data yourself on the `sort` event.

## Accessibility

- It's a real `<table>`: screen readers announce rows, columns and headers. Use `<th scope="col">` for column headers and `<th scope="row">` for each row's name.
- The wrap is a focusable, labelled region, so keyboard users can scroll a wide table (WCAG 2.1.1).
- Sort buttons say their column; the header's `aria-sort` says the current order, and each sort is announced ("Sorted by Count, descending").
- Don't put interactive grids of cells in a table; that's the data grid's job.
