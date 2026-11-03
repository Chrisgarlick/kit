---
title: Progress bar
group: feedback
order: 30
tier: 1
pattern: Native progress
status: preview
summary: How far through something is, or that it's under way. A styled native progress element, so the value is real and announced.
---

## Usage

```html
<div class="kit-progress-field">
  <label for="upload">Uploading report.pdf</label><span>42%</span>
  <progress class="kit-progress" id="upload" max="100" value="42">42%</progress>
</div>
```

- Set `value` and `max` as the work goes on. Leave `value` out when you can't tell how long it will take: the bar shows a moving stripe instead (a still tint when people prefer reduced motion).
- `data-tone="good"`, `"warn"` or `"bad"` colour it by meaning, for meters like storage used. Say the meaning in words as well.

## Accessibility

- A native `<progress>` is announced with its value. Label it with a `<label for>` or `aria-label`.
- The visible percentage repeats the value for sighted people; the text inside the element is a fallback for very old browsers.
- For work that ends, tell people when it's done (kit's `announce()`, or move focus to the result).
