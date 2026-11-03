---
title: Segmented control
group: actions
order: 30
tier: 2
pattern: APG radio group
status: beta
summary: Choose one option from a small set, like a date range or a view. Arrow keys move between options, and it submits with a form.
---

## Usage

Give `<kit-segmented>` an accessible name and a `<button>` for each option. The server renders it ready to use, and the component adds the behaviour when its script loads.

```html
<kit-segmented aria-label="Date range" name="range" value="7d">
  <button value="24h">24 hours</button>
  <button value="7d">7 days</button>
  <button value="30d">30 days</button>
</kit-segmented>
```

Use it for two to five short, mutually exclusive options that change what's shown. For more options, or ones that need explaining, use radio buttons or a select.

## API

| | |
|---|---|
| `value` (attribute and property) | The chosen option's `value` (or its text, if it has none). Reflected. |
| `name` | Submitted with the form, like an input's name. |
| `disabled` | Turns the whole control off; a disabled `<fieldset>` does the same. |
| `change` event | Fires when the user picks a different option. `event.detail.value` is the new value. |
| `choose(button)` | Picks an option from code, firing `change` as if the user had. |

It resets with its form (`form.reset()`) to the value it started with.

## Accessibility

- `role="radiogroup"` on the element (added for you) needs an `aria-label` or `aria-labelledby`. Without one, the console says so.
- Each option is `role="radio"` with `aria-checked`. Only the chosen option is in the tab order (roving `tabindex`). Arrow keys move and choose, Home and End jump to the ends, and right-to-left pages swap the arrows.
- The chosen option is shown by more than colour: it is raised and bolder, and outlined in forced-colours mode.

## Extension points

- Class: `KitSegmented`, exported from `segmented-control.js`.
- Methods: `choose(button)`, `optionValue(button)` (override it to read values another way).
- Custom properties: `--kit-control`, `--kit-radius-2`, `--kit-focus-ring`.
