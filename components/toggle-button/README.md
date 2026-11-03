---
title: Toggle button
group: actions
order: 40
tier: 2
pattern: Button (aria-pressed)
status: beta
summary: A button that stays on or off, such as bold or a favourite, alone or in a group where only one can be on, using aria-pressed.
---

## Usage

```html
<button class="kit-button" aria-pressed="false" data-toggle>Bold</button>

<div class="kit-button-group" role="group" aria-label="View" data-exclusive>
  <button class="kit-button" aria-pressed="true" data-toggle>List</button>
  <button class="kit-button" aria-pressed="false" data-toggle>Board</button>
</div>
```

`toggle.js` (in `kit.js`) flips `aria-pressed` on click and fires `change` with `{ pressed }`. In a group with `data-exclusive`, pressing one releases the others, and one always stays pressed.

A toggle button's label stays the same when it changes ("Bold", pressed or not). If the label would change ("Show" to "Hide"), use a plain button instead.

## Accessibility

- `aria-pressed` makes screen readers say "toggle button, pressed" or "not pressed".
- Pressed shows as a filled, inset button, not by colour alone.
- For one choice from a set that a form submits, a segmented control or radio group is a better fit.
