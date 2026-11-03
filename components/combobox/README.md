---
title: Combobox
group: inputs
order: 40
tier: 2
pattern: APG combobox
status: beta
summary: A select you can type into to filter, for long lists of options, that starts life as a plain select and still submits as one.
---

## Usage

```html
<div class="kit-field">
  <label for="country">Country</label>
  <kit-combobox>
    <select class="kit-select" id="country" name="country" required>
      <option value="">Choose a country</option>
      <option value="fr">France</option>
      <option value="de">Germany</option>
    </select>
  </kit-combobox>
</div>
```

Without the script it's the select. With it, a text input takes the select's place, and its id, so the label still names it. Typing filters the options (accents and case ignored, matches starting with the text first, the matched part highlighted). The select stays in the page, hidden, holding the value, so the form submits, validates and resets exactly as before.

An empty-valued first option becomes the input's placeholder. Disabled options show but can't be chosen. Leaving the field with text that matches an option exactly chooses it; anything else goes back to the current choice, so the value is always one of the options.

| Event | Detail |
|---|---|
| `change` | on the select, as a select's own; and on `<kit-combobox>` with `{ value, label }` |

Use a combobox from about fifteen options up. Below that, a select is quicker.

## Accessibility

- The input is `role="combobox"` with `aria-autocomplete="list"`, `aria-expanded` and `aria-controls` pointing at a `listbox`; the highlighted option is `aria-activedescendant`, so focus stays in the input while screen readers follow the list.
- ArrowDown opens the list and moves down, ArrowUp moves up, Enter chooses, Escape closes the list (and, with it closed, clears the field). Tab chooses the highlighted option and moves on.
- After a pause in typing, the number of matches is announced.
- `required`, `aria-describedby` and `aria-invalid` carry over from the select to the input, so hints and errors work as on a text field.
