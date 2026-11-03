---
title: Number stepper
group: inputs
order: 65
tier: 2
pattern: Native number input (spinbutton)
status: beta
summary: A number field with minus and plus buttons for small, exact adjustments, such as a quantity, on the native input so typing, arrows and validation still work.
---

## Usage

```html
<div class="kit-field">
  <label for="qty">Quantity</label>
  <div class="kit-stepper">
    <button type="button" data-step="down" aria-label="Decrease quantity">−</button>
    <input class="kit-input" id="qty" type="number" name="qty" min="1" max="10" step="1" value="2">
    <button type="button" data-step="up" aria-label="Increase quantity">+</button>
  </div>
</div>
```

`stepper.js` (in `kit.js`) makes the buttons call the input's own `stepUp()` and `stepDown()`, so `min`, `max` and `step` are respected, fires `input` and `change`, and disables a button at its limit. Holding a button repeats.

## Accessibility

- The input is a native spinbutton: screen readers announce its value and range, and Up and Down arrows change it.
- The buttons are for pointers and touch, so they're out of the tab order (keyboard users have the arrows); they still have names.
- Each button is 38px high and wide, the size of the control.
