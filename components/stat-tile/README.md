---
title: Stat tile
group: data-display
order: 10
tier: 1
pattern: Text
status: preview
summary: One headline number with its label and how it changed, coloured by whether the change is good, with the direction shown by shape too.
---

## Usage

```html
<div class="kit-grid" data-min="sm">
  <div class="kit-stat">
    <p class="kit-stat-label">Label</p>
    <p class="kit-stat-value">12,480</p>
    <p class="kit-stat-delta" data-trend="up">+8.2% <span>vs last week</span></p>
  </div>
</div>
```

| Attribute | Values | Default |
|---|---|---|
| `data-trend` | `up`, `down`, `flat`, on the delta | none |
| `data-good` | `down` when falling is good (costs, errors, load time) | `up` |
| `data-flush` | present for no border or padding, inside a card | a bordered tile |

A `<p class="kit-stat-note">` in place of the delta gives a quiet line of context instead ("Served from disk by nginx"). A `<small>` inside the value holds its unit (`ms`, `GB`). Lay tiles out with the grid. Figures use tabular numbers, so tiles line up when they change.

## Accessibility

- The direction is in the words (+8.2%, −3%) and the arrow's shape, not only the colour.
- Write the delta so it reads well aloud: "+8.2% vs last week". The arrow is decoration and isn't read.
- When tiles update live, announce what changed with `announce()` rather than making the tiles a live region.
