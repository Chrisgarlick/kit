---
title: Description list
group: data-display
order: 20
tier: 1
pattern: Native dl
status: preview
summary: Labelled values, such as an item's details or settings at a glance, as rows that stack on narrow screens or as a grid of columns.
---

## Usage

```html
<dl class="kit-dl">
  <div><dt>Label</dt><dd>Value</dd></div>
  <div><dt>Created</dt><dd><time datetime="2026-11-03">3 Nov 2026</time></dd></div>
</dl>
```

| Attribute | Values | Default |
|---|---|---|
| `data-layout` | `stacked` (label over value), `columns` (a grid of label-over-value cells) | label beside value |

Wrapping each pair in a `<div>` is valid HTML and lets the rows draw their dividers. The default layout stacks by itself when its container is narrower than 26rem. `data-numeric` on a `<dd>` lines up figures.

## Accessibility

- `<dl>`, `<dt>` and `<dd>` tell screen readers which label goes with which value, and many announce the list's size.
- Use `<time datetime>` for dates and real text for statuses, so values read well out of context.
