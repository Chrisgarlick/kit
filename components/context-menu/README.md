---
title: Context menu
group: overlays
order: 35
tier: 2
pattern: APG menu
status: beta
summary: Actions for something, opened with a right-click, Shift+F10 or the Menu key, at the pointer, with the same keyboard support as every kit menu.
---

## Usage

```html
<kit-menu context label="File actions">
  <div class="kit-card" tabindex="0">A file</div>
  <div class="kit-menu-list">
    <button>Open</button>
    <button>Rename</button>
    <hr>
    <button data-tone="bad">Delete</button>
  </div>
</kit-menu>
```

It's a [menu](/overlays/menu/) with `context`: the first child is the region it belongs to, instead of a button. Right-clicking the region opens the menu at the pointer; Shift+F10 or the keyboard's Menu key opens it beside whatever has focus. Everything else, from typeahead to the `select` event, is the menu's. `label` names it ("File actions").

## Accessibility

- A context menu is a shortcut, never the only way to an action: put the same actions in a visible menu or toolbar too, since touch and many keyboard users won't find it.
- The region should be focusable (or contain focusable things), so Shift+F10 can reach it.
- Escape, a click elsewhere or scrolling closes it, and focus goes back to where it was.
