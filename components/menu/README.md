---
title: Menu
group: overlays
order: 30
tier: 2
pattern: APG menu button
status: beta
summary: A button that opens a list of actions, with arrow keys, typeahead and Escape, placed beside its button and kept on screen.
---

## Usage

```html
<kit-menu>
  <button class="kit-button">Actions</button>
  <div class="kit-menu-list">
    <button value="edit">Edit <kbd>E</kbd></button>
    <button value="duplicate">Duplicate</button>
    <hr>
    <button value="delete" data-tone="bad">Delete</button>
  </div>
</kit-menu>
```

| Attribute | Values | Default |
|---|---|---|
| `placement` | `bottom-start`, `bottom-end`, `top-start`, `top-end`, `right-start`, … | `bottom-start` |

| Event | Detail |
|---|---|
| `select` | `{ value, item }`: the item's `value` attribute, else its text |

Items are `<button>`s for actions and `<a href>`s for going somewhere. `<hr>` separates groups, `<p class="kit-menu-label">` heads one, `data-tone="bad"` marks a destructive item, and a trailing `<kbd>` shows its shortcut. Disabled items are skipped by the keyboard.

The menu flips above its button when there isn't room below, slides along to stay on screen, and caps its height to the space it has, scrolling beyond that. Where the browser supports popovers, it opens in the top layer, so `overflow: hidden` on a card can't clip it.

## Accessibility

- The button gets `aria-haspopup="menu"`, `aria-expanded` and `aria-controls`; the list `role="menu"` and its items `role="menuitem"`.
- Enter, Space or ArrowDown on the button open it on the first item; ArrowUp opens it on the last.
- Arrows move (and wrap), Home and End jump, and typing letters jumps to the item starting with them.
- Enter picks, Escape closes, Tab closes and moves on, and focus returns to the button.
- Menus are for actions. For choosing a value that a form submits, use a select or a radio group.
