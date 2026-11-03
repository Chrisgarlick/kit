---
title: Avatar
group: data-display
order: 40
tier: 1
pattern: Image
status: preview
summary: A person's photo or initials, in three sizes, and overlapping groups with a count for the rest.
---

## Usage

```html
<span class="kit-avatar" data-tone="2">AB</span>
<span class="kit-avatar"><img src="/avatars/person-a.jpg" alt=""></span>
<span class="kit-avatar-group" role="img" aria-label="Person A, Person B, Person C and 2 others">
  <span class="kit-avatar" data-tone="1">AB</span> … <span class="kit-avatar" data-more>+2</span>
</span>
```

| Attribute | Values | Default |
|---|---|---|
| `data-tone` | `1` to `6`, a colour from the data series | `1` |
| `data-size` | `sm`, `md`, `lg` | `md` |

Pick the tone from the person (say, a hash of their id), so each person keeps their colour everywhere.

## Accessibility

- An avatar next to the person's name is decoration: `alt=""` on a photo; initials are read as letters, so put `aria-hidden="true"` on them when the name is already beside them.
- An avatar on its own needs the name: `role="img"` and `aria-label="Person A"`.
- A group says who's in it, in one label, rather than reading out each set of initials.
- Initials are white on darkened colours that pass WCAG AA in light and dark.
