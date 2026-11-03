---
title: Pagination
group: navigation
order: 30
tier: 1
pattern: Navigation landmark
status: preview
summary: Links between pages of results, with previous and next, the current page marked, and gaps for long runs, as plain links that work without a script.
---

## Usage

```html
<nav aria-label="Pagination">
  <ul class="kit-pagination">
    <li><a href="?page=2" rel="prev">Previous</a></li>
    <li><a href="?page=1">1</a></li>
    <li><a href="?page=3" aria-current="page">3</a></li>
    <li><span class="kit-pagination-gap">…</span></li>
    <li><a href="?page=12">12</a></li>
    <li><a href="?page=4" rel="next">Next</a></li>
  </ul>
</nav>
```

Pages are links your server renders, so they can be bookmarked and shared. On the first or last page, show previous or next as `<span aria-disabled="true">`, not a dead link. `data-compact` keeps only previous, the current page of the total, and next, for small spaces.

## Accessibility

- A `nav` landmark named "Pagination". The current page has `aria-current="page"`.
- Number links read as bare numbers; add hidden text when the context isn't clear ("Page 3"), using `<span class="kit-vh">Page </span>3`.
- Targets are at least 36px square.
