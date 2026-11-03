---
title: Checkbox
group: inputs
order: 50
tier: 1
pattern: Native checkbox
status: preview
summary: A native checkbox, restyled, with its label, an optional hint and a mixed state for select-all rows.
---

## Usage

```html
<label class="kit-choice">
  <input type="checkbox" class="kit-checkbox" name="receipts" checked>
  Email me receipts
  <span class="kit-choice-hint">Optional hint text</span>
</label>
```

A checkbox turns one thing on or off, and the change applies when the form is saved. For a setting that applies at once, use a switch (coming later).

For "select all" above a list, set `input.indeterminate = true` from script when only some are checked; it shows a dash.

## Accessibility

- The input sits inside its `<label>`, so the whole label is the click target and the name.
- A hint inside the label becomes part of the name. When it's long, move it outside and point `aria-describedby` at it.
- It's a real checkbox: Space toggles it, it submits with the form, and screen readers announce checked, unchecked and mixed.
- Group related checkboxes in a `<fieldset>` with a `<legend>`.
- In forced-colours mode the browser's own checkbox returns.
