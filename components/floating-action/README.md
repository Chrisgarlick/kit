---
title: Floating action
group: actions
order: 60
tier: 1
pattern: Button
status: preview
summary: A round button that floats over the corner of the screen for the one action people take most, such as New, with an optional label that shows on wider screens.
---

## Usage

```html
<button class="kit-fab" type="button" aria-label="New item">
  <svg …/><span class="kit-fab-label">New item</span>
</button>
```

| Attribute | Values | Default |
|---|---|---|
| `data-extended` | shows the label beside the icon | the label shows from 48rem wide |
| `data-position` | `start` (bottom-left in left-to-right pages) | bottom end |
| `data-contained` | positioned within its nearest positioned parent, not the screen | the screen |

Use at most one, for the main action of a screen, mostly on phones; on desktop a normal primary button usually reads better.

## Accessibility

- A real button, named by its label or `aria-label`; the icon is hidden from screen readers.
- It sits clear of the bottom safe area on phones, and is at least 56px for easy tapping.
- Make sure it doesn't cover content people need, such as the last row of a list: leave room at the bottom.
