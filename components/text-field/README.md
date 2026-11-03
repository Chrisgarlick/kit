---
title: Text field
group: inputs
order: 10
tier: 1
pattern: Native input
status: preview
summary: A labelled native input or textarea with a hint, an error, and prefix and suffix groups, built on the browser's own validation and autofill.
---

## Usage

```html
<div class="kit-field">
  <label for="email">Work email</label>
  <input class="kit-input" id="email" type="email" autocomplete="email" aria-describedby="email-hint">
  <p class="kit-field-hint" id="email-hint">We'll send the invoice here.</p>
</div>
```

Show an error by adding `aria-invalid="true"` to the input and a `.kit-field-error` paragraph, and point `aria-describedby` at both the hint and the error.

| Class | What it is |
|---|---|
| `.kit-field` | the label, control, hint and error, stacked |
| `.kit-input` | an `<input>` or `<textarea>` |
| `.kit-input-group` | an input with `.kit-input-affix` text or a `.kit-button` on either side |
| `.kit-field-optional` | "(optional)" inside the label |

Mark the optional fields, not the required ones, when most are required.

## Accessibility

- Every input has a visible `<label>`. A placeholder is an example, never the label.
- Hints and errors are tied to the input with `aria-describedby`, so they're read when it's focused.
- Errors say what to do ("Enter an amount over £0"), are marked with a symbol as well as colour, and appear after the person leaves the field or submits, not while they type.
- Prefix and suffix text inside a group is decoration; repeat it in the label or hint if it matters ("Amount in pounds").
- Use the right `type`, `inputmode` and `autocomplete`, so phones show the right keyboard and browsers can fill the field.
