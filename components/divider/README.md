---
title: Divider
group: layout
order: 60
tier: 1
pattern: Separator
status: preview
summary: A quiet rule between sections, across or upright, with an optional word in the middle such as "or".
---

## Usage

```html
<hr class="kit-divider">
<div class="kit-divider" role="separator" aria-label="or">or</div>
<hr class="kit-divider" aria-orientation="vertical">
```

`data-strong` uses the stronger line colour. Reach for space before a divider: a gap in a stack often separates sections well enough on its own.

## Accessibility

- `<hr>` is a separator to screen readers. A divider that's only decoration (between items already in a list, say) can be a border instead.
- A labelled divider is a `<div role="separator">` with the word as its `aria-label`, because a separator's text isn't read on its own.
- An upright divider inside a toolbar takes `aria-orientation="vertical"`, which also sets its shape.
