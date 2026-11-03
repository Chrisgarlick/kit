---
title: Tag input
group: inputs
order: 75
tier: 2
pattern: Text input with a list of chips
status: beta
summary: Several short values in one field, such as labels or email addresses, as removable chips, starting life as a plain comma-separated text field.
---

## Usage

```html
<div class="kit-field">
  <label for="topics">Topics</label>
  <kit-tags>
    <input class="kit-input" id="topics" name="topics" value="Design, Research" aria-describedby="topics-hint">
  </kit-tags>
  <p class="kit-field-hint" id="topics-hint">Press Enter or comma after each one.</p>
</div>
```

Without the script it's a text field of comma-separated values, which your server splits. With it, each value is a chip with a remove button, and a text box after them takes new ones. The original input stays, hidden, holding the joined value, so the form submits the same string.

| Attribute | Values | Default |
|---|---|---|
| `max` | the most tags allowed | no limit |
| `separator` | what joins them in the value | `, ` |
| `list` on the input | a `<datalist>` id, for suggestions | none |

Enter, comma or Tab (with text typed) adds a tag; Backspace in the empty box removes the last; pasting "a, b, c" adds three. Duplicates are ignored. `change` fires on the element with `{ tags }`.

## Accessibility

- The chips are a list, named by the field's label, so screen readers say how many there are. Each remove button says which tag it removes.
- Adding and removing are announced ("Research added", "Design removed").
- The text box takes the field's id, so the label and hint still belong to it.
