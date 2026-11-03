---
title: Colour picker
group: inputs
order: 90
tier: 2
pattern: Native colour input with a hex field
status: beta
summary: A colour field that pairs the native colour input with a hex text box and a row of preset swatches, all kept in step, submitting one value.
---

## Usage

```html
<div class="kit-field">
  <label for="brand">Brand colour</label>
  <div class="kit-colour">
    <input type="color" id="brand" name="brand" value="#4F46E5">
    <input class="kit-input" type="text" aria-label="Brand colour, hex" value="#4F46E5">
    <div class="kit-colour-swatches" role="group" aria-label="Presets">
      <button type="button" data-colour="#4F46E5" aria-label="Indigo"></button>
      <button type="button" data-colour="#0F766E" aria-label="Teal"></button>
    </div>
  </div>
</div>
```

`colour.js` (in `kit.js`) keeps the colour input, the hex box and the swatches in step: typing a valid hex (with or without #, three or six digits) updates the colour, picking updates the hex, and the swatch for the current colour is pressed. Swatches are painted from their `data-colour`. The colour input carries the `name`, so the form submits `#rrggbb`.

## Accessibility

- The native colour input opens each platform's own picker. The hex box is for exact values and for people who can't use the picker.
- Swatches are toggle buttons with names ("Indigo"), so they're not identified by colour alone, and the current one is `aria-pressed`.
- An invalid hex marks the box `aria-invalid` until it's fixed; the colour isn't changed.
