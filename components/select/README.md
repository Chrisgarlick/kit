---
title: Select
group: inputs
order: 30
tier: 1
pattern: Native select
status: preview
summary: A native select, styled to sit beside text fields, that opens the platform's own picker so it works everywhere.
---

## Usage

```html
<div class="kit-field">
  <label for="region">Data region</label>
  <select class="kit-select" id="region">
    <option>Europe (London)</option>
    <option>US East (Virginia)</option>
  </select>
</div>
```

Use a select for a single choice from about five to fifteen options. Fewer: a radio group or a segmented control, so every option is visible. Many more, or options worth searching: the combobox (coming later).

Group long lists with `<optgroup>`. `aria-invalid`, `disabled` and `multiple` work as they do on a text field.

## Accessibility

- It's the native element: keyboard, screen reader and touch behaviour are the platform's own, and phones show their native picker.
- A placeholder option ("Choose a region") is a real, disabled, selected option with an empty value, so a required select still validates.
- The chevron is a background image; in forced-colours mode the browser's own arrow returns.
