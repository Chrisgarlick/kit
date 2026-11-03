---
title: Slider
group: inputs
order: 70
tier: 2
pattern: Native range
status: beta
summary: A native range input with a filled track and a live value readout, for picking a number where the rough position matters more than the exact figure.
---

## Usage

```html
<div class="kit-slider-field">
  <label for="volume">Volume</label>
  <output for="volume" data-format="percent"></output>
  <input type="range" class="kit-slider" id="volume" min="0" max="100" value="40">
</div>
```

`slider.js` (in `kit.js`) keeps the filled part of the track and any `<output for>` in step with the value. On the output, `data-format="percent"` shows a percentage and `data-unit="GB"` adds a unit. `min`, `max` and `step` work as they do on any range input, and it submits with its form.

When the exact number matters, pair it with a number field, or use one instead.

## Accessibility

- It's the native control: arrow keys step, Page Up and Page Down jump, Home and End go to the ends, and screen readers read its value.
- Label it with a `<label>`. The `<output>` repeats the value for sighted people; screen readers already hear it from the slider.
- If the value means something other than a plain number, add `aria-valuetext` ("40 percent", "Medium") and keep it up to date.
- The thumb is 18px, with the full height of the control as its target.
