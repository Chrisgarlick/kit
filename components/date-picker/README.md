---
title: Date picker
group: inputs
order: 85
tier: 1
pattern: Native date input
status: preview
summary: A date field on the native date input, styled to match, so every platform shows its own accessible calendar, with a pattern for date ranges.
---

## Usage

```html
<div class="kit-field">
  <label for="due">Due date</label>
  <input class="kit-input" id="due" type="date" name="due" min="2026-01-01">
</div>
```

It's the browser's own date input: the value is always `YYYY-MM-DD`, `min`, `max` and `required` validate as usual, and phones show their native wheels or calendars. Styles cover `date`, `time`, `datetime-local` and `month` inputs, with the calendar icon following the theme. For a range, put two in a `.kit-date-range`, and set the end's `min` from the start when it changes.

kit doesn't draw its own calendar: native pickers are already accessible on every platform, and a custom one would add weight without helping. A fully custom calendar may come later for cases the native one can't do, like showing availability.

## Accessibility

- Each segment (day, month, year) is reachable and editable by keyboard, and screen readers announce them in the visitor's locale.
- Always give the format in a hint when people might type dates elsewhere too, and use `<time>` when showing dates back.
