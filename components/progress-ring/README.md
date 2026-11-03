---
title: Progress ring
group: feedback
order: 32
tier: 2
pattern: Progress bar (role progressbar)
status: beta
summary: A circular progress indicator with the value in the middle, for compact spaces and dashboards, driven by its aria-valuenow.
---

## Usage

```html
<div class="kit-ring" role="progressbar" aria-label="Upload" aria-valuenow="72" aria-valuemin="0" aria-valuemax="100"><span>72%</span></div>
```

`ring.js` (in `kit.js`) draws the ring from `aria-valuenow`, `aria-valuemin` and `aria-valuemax`, and follows them as they change: update `aria-valuenow` and the text inside. Leave `aria-valuenow` off for an indeterminate ring that spins.

| Attribute | Values | Default |
|---|---|---|
| `data-size` | `sm` 40px, `lg` 96px | 64px |
| `data-tone` | `good`, `warn`, `bad` | the accent |

## Accessibility

- It's a `progressbar` with a name and its value, so screen readers read "Upload, 72 percent". Keep the visible text in step.
- For a long task, also announce when it's done; screen readers don't speak every change.
