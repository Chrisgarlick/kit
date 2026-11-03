---
title: Spinner
group: feedback
order: 35
tier: 1
pattern: Status (role status)
status: preview
summary: A small loading indicator for waits of a second or two, announced once to screen readers, slowing to a gentle pulse for reduced motion.
---

## Usage

```html
<span class="kit-spinner" role="status"><span class="kit-vh">Loading</span></span>
```

| Attribute | Values | Default |
|---|---|---|
| `data-size` | `sm`, `lg` | 20px |

For waits longer than a couple of seconds, show what's happening with a progress bar or skeleton instead. Buttons have their own loading state (`aria-busy="true"`).

## Accessibility

- `role="status"` with hidden text ("Loading") tells screen readers once, without moving focus. Remove the spinner (or change the text to "Loaded") when it's done.
- It spins in the text colour, so it works on any background and in forced-colours mode; with reduced motion it pulses slowly instead.
