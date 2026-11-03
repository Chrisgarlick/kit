---
title: Status dot
group: data-display
order: 35
tier: 1
pattern: Text label
status: preview
summary: A coloured dot beside the word for a state, like Online, Degraded or Paused, with an optional pulse for things happening now.
---

## Usage

```html
<span class="kit-status" data-tone="good">Operational</span>
<span class="kit-status" data-tone="info" data-live>Syncing</span>
```

Use it in tables and lists where a full badge would be too heavy. `data-live` pulses the dot for something in progress; it stops for people who prefer reduced motion.

## Accessibility

- The word is the status; the dot only repeats it in colour, so the status never depends on seeing the colour.
- In forced-colours mode the dot takes the text colour.
