---
title: Switch
group: inputs
order: 55
tier: 1
pattern: Native checkbox (role switch)
status: preview
summary: An on and off switch for settings that take effect at once, a native checkbox underneath so it submits and resets like one.
---

## Usage

```html
<label class="kit-choice">
  <input type="checkbox" role="switch" class="kit-switch" checked>
  Email notifications
  <span class="kit-choice-hint">Optional hint text</span>
</label>
```

`data-end` on the label puts the switch at the far end of the row, as in a settings list.

Use a switch when the change happens straight away (turning notifications on). When it only applies after a Save button, use a checkbox.

## Accessibility

- `role="switch"` makes screen readers say "on" and "off" rather than "checked". It's still a real checkbox: Space toggles it and it submits with the form.
- The label names it; the whole label is the click target.
- The state shows in position and colour, not colour alone. In forced-colours mode it uses the system colours.
