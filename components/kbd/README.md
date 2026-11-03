---
title: Kbd
group: data-display
order: 90
tier: 1
pattern: Native kbd
status: preview
summary: A key or a keyboard shortcut, for help text, menus and the command palette.
---

## Usage

```html
Press <kbd class="kit-kbd">⌘</kbd><kbd class="kit-kbd">K</kbd> to search.
```

One `<kbd>` per key. Show the platform's own keys where you can (⌘ on a Mac, Ctrl elsewhere).

## Accessibility

- Screen readers read symbols like ⌘ inconsistently. Where the shortcut matters, say it in words nearby or in an `aria-label` on the surrounding element ("Command K").
- A shortcut is never the only way to do something.
