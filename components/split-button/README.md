---
title: Split button
group: actions
order: 30
tier: 2
pattern: Button group with a menu button
status: beta
summary: A main action joined to a menu of related ones, such as Save and Save as draft, built from a button and a kit menu.
---

## Usage

```html
<div class="kit-split-button" role="group" aria-label="Save">
  <button class="kit-button" data-variant="primary">Save</button>
  <kit-menu placement="bottom-end">
    <button class="kit-button" data-variant="primary" data-icon aria-label="More save options">…</button>
    <div class="kit-menu-list"><button>Save as draft</button><button>Save and close</button></div>
  </kit-menu>
</div>
```

The main button does the common thing; the arrow opens a [menu](/overlays/menu/) of the alternatives, with all its keyboard support. Variants and sizes from the button apply to both halves.

## Accessibility

- Two real buttons in a named group: the main action, and a menu button whose name says what it opens ("More save options").
- Keep the menu's items as variations on the main action; unrelated actions belong in their own menu.
