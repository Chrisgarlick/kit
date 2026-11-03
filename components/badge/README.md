---
title: Badge
group: data-display
order: 30
tier: 1
pattern: Text label
status: preview
summary: A short label for a state, a category or a count, coloured by meaning and always readable without the colour.
---

## Usage

```html
<span class="kit-badge" data-tone="good"><span class="kit-dot"></span>Paid</span>
```

| Attribute | Values | Default |
|---|---|---|
| `data-tone` | `neutral`, `accent`, `good`, `warn`, `bad`, `info` | `neutral` |
| `data-variant` | `outline` | filled |
| `data-numeric` | present for counts, so digits line up | absent |

Keep badges to a word or two. Reserve `good`, `warn` and `bad` for meaning, and use `accent` for "new" or a category.

## Accessibility

- The words carry the meaning: "Overdue", not a red dot on its own. The dot is decoration.
- A badge beside something else ("Invoices 3") is read as part of it. If the number needs explaining, add hidden text: visually hidden text.
- Text meets WCAG AA contrast on every tone's background, in light and dark.
