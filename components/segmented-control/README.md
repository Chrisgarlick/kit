---
title: Segmented control
group: actions
order: 30
tier: 2
pattern: APG radio group
status: preview
summary: Choose one option from a small set, like a date range or a view. Arrow keys move between options.
---

## Usage

Use it for two to five short, mutually exclusive options that change what's shown. For more options, or ones that need explaining, use radio buttons or a select.

## Accessibility

- `role="radiogroup"` with an `aria-label`; each option is `role="radio"` with `aria-checked`.
- Only the chosen option is in the tab order (roving `tabindex`). Arrow keys move and choose; Home and End jump to the ends.
- The chosen option is shown by more than colour: it is raised, bolder and outlined in forced-colours mode.

## Status

The styling is tier 1 and ready. The keyboard behaviour becomes `<kit-segmented>` once the core runtime lands; until then this site wires it up itself.
