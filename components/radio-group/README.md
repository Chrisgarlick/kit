---
title: Radio group
group: inputs
order: 60
tier: 1
pattern: Native radio
status: preview
summary: Native radios in a fieldset for one choice from a few, as a list, a row or a set of tiles.
---

## Usage

```html
<fieldset class="kit-fieldset">
  <legend>Billing period</legend>
  <label class="kit-choice"><input type="radio" class="kit-radio" name="period" value="monthly" checked> Monthly</label>
  <label class="kit-choice"><input type="radio" class="kit-radio" name="period" value="yearly"> Yearly<span class="kit-choice-hint">Two months free</span></label>
</fieldset>
```

| Attribute | Values | Default |
|---|---|---|
| `data-layout` | `row` (stacks again on phones) | a list |
| `data-variant` | `cards`, a bordered tile per option | plain |

Use radios when the options need room to explain themselves; for two to five short options in a toolbar, the segmented control is tighter.

## Accessibility

- The `<fieldset>` and `<legend>` name the group, so each option is read as "Yearly, radio button, 2 of 2, Billing period".
- Arrow keys move and choose within the group and Tab leaves it: the browser does this for radios sharing a `name`.
- Check one option by default unless choosing nothing is meaningful.
- Tiles show focus on the whole tile; their selected state is a border and ring, not colour alone.
