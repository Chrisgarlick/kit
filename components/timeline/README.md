---
title: Timeline
group: data-display
order: 70
tier: 1
pattern: Ordered list
status: preview
summary: Events in order with a marker, a time and a description, for activity feeds, history and changelogs, toned by what happened.
---

## Usage

```html
<ol class="kit-timeline">
  <li data-tone="good">
    <p class="kit-timeline-title">Deployed</p>
    <time class="kit-timeline-time" datetime="2026-11-03T10:00">10:00</time>
    <p>Supporting text.</p>
  </li>
</ol>
```

| Attribute | Values | Default |
|---|---|---|
| `data-tone` (on each event) | `good`, `warn`, `bad`, `info`, `accent` | neutral |

Newest first for feeds, oldest first for histories; say which in a heading. A `kit-avatar` as the first child replaces the dot, for who did it.

## Accessibility

- An ordered list, so screen readers count the events. Use `<time datetime>` for each time.
- The marker's colour is decoration; what happened is in the title.
