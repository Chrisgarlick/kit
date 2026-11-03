---
title: Data grid
group: data-display
order: 60
tier: 2
pattern: APG data grid
status: beta
summary: A grid for large datasets that only draws the rows in view, so 100,000 rows scroll as smoothly as 100, with sorting, quick search and full keyboard movement between cells.
---

## Usage

```html
<kit-data-grid id="items" label="Items"></kit-data-grid>
<script type="module">
  const grid = document.getElementById('items');
  grid.columns = [
    { key: 'name', label: 'Name', width: 220 },
    { key: 'count', label: 'Count', format: 'number', align: 'end', sort: 'number' },
    { key: 'updated', label: 'Updated', format: 'date', sort: 'date' },
  ];
  grid.rows = await (await fetch('/items.json')).json();
</script>
```

| Column option | Values |
|---|---|
| `key`, `label` | the field to show, and its heading |
| `width` | pixels (`220`) or a CSS track (`'2fr'`); flexible by default |
| `align` | `end` for figures: right-aligned, tabular |
| `format` | `number`, `compact`, `percent`, `currency:GBP`, `date` |
| `sort` | `text` (natural order), `number`, `date`, `none` |
| `cell(value, row)` | returns a Node (a badge, a link) or text; text is never parsed as HTML |

| Property, method, event | Does |
|---|---|
| `query` | keeps the rows containing every word (accents and case ignored) |
| `sortBy(key, direction)` | sorts from script; `null` unsorts |
| `visibleRows` | the rows shown, in order |
| `rowactivate` event | Enter or a double click on a row: `{ row, index }` |
| `sort` event | `{ key, direction }` |

Set the height with `--kit-data-grid-height` (420px by default). Rows are 38px, or 30px when the page's density is compact; the grid keeps every row the same height, which is what lets it skip drawing the ones out of view. For a few dozen rows that should be in the page as HTML, use the data table.

## Accessibility

- It's `role="grid"` with `aria-rowcount` and `aria-colcount` for the whole dataset, and each row and cell carries its `aria-rowindex` and `aria-colindex`, so screen readers say "row 5,203 of 10,001" even though only a few rows exist in the page.
- The grid is one tab stop. Arrows move between cells, Home and End go to the ends of a row (with Ctrl or ⌘, to the first or last row), Page Up and Down move a screen at a time, and the current cell scrolls into view.
- Focus stays on the grid and the current cell is its `aria-activedescendant`, so recycling rows as they scroll never loses focus.
- Enter or Space on a header sorts by it; the header's `aria-sort` says the order and each sort is announced, as is the row count after a search.
