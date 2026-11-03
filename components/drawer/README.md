---
title: Drawer
group: overlays
order: 20
tier: 1
pattern: Native dialog
status: preview
summary: A dialog that slides in from the side, for filters, details and settings, with everything the dialog does for focus and Escape.
---

## Usage

```html
<button class="kit-button" commandfor="filters" command="show-modal">Filters</button>
<dialog class="kit-dialog kit-drawer" id="filters" aria-labelledby="filters-title" closedby="any">
  <header class="kit-dialog-header"><h2 id="filters-title">Filters</h2>…</header>
  <div class="kit-dialog-body">…</div>
  <footer class="kit-dialog-footer">…</footer>
</dialog>
```

A drawer is a [dialog](/overlays/dialog/) with `kit-drawer` added, so it opens and closes the same way and needs the dialog's CSS and script. It sits at the end edge, right on left-to-right pages, or at the start with `data-side="start"`. `data-size="lg"` makes it 40rem wide. The body scrolls; the header and footer stay put.

## Accessibility

- Everything from the dialog applies: the page behind is inert, focus is kept inside, Escape closes it and focus returns to the opener.
- It slides in unless the person prefers reduced motion.
- On phones it leaves a strip of the page showing, so it's clear it's on top of something and the backdrop can be tapped to close it (with `closedby="any"`).
