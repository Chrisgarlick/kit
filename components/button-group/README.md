---
title: Button group
group: actions
order: 20
tier: 1
pattern: Group (role="group")
status: preview
summary: Related actions joined into one control, such as text alignment or zoom, with optional toggle buttons.
---

## Usage

Wrap two to five `kit-button`s in `<div class="kit-button-group" role="group" aria-label="…">`. For a group where each button turns something on or off independently, give the buttons `aria-pressed`. If only one can be chosen at a time, use the [segmented control](/actions/segmented-control) instead.

## Accessibility

- `role="group"` with an `aria-label` names the set ("Text alignment").
- Toggle buttons use `aria-pressed="true"` or `"false"`, so screen readers announce "pressed".
- Each button stays in the tab order; the group doesn't change keyboard behaviour.
