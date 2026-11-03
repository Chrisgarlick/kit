---
title: Steps
group: navigation
order: 40
tier: 1
pattern: Ordered list (aria-current step)
status: preview
summary: Where someone is in a multi-step process, done, current and still to come, across or down, as an ordered list that reads correctly without the visuals.
---

## Usage

```html
<ol class="kit-steps">
  <li data-state="done"><span class="kit-steps-title">Account</span><span class="kit-steps-hint">Done</span></li>
  <li data-state="current" aria-current="step"><span class="kit-steps-title">Details</span></li>
  <li><span class="kit-steps-title">Confirm</span></li>
</ol>
```

| Attribute | Values | Default |
|---|---|---|
| `data-state` (on each step) | `done`, `current` | to come |
| `data-orientation` | `vertical` | across, stacking on phones |

Steps can be links when people may go back to an earlier one. Show the current step's form below; steps are a map, not the controls.

## Accessibility

- It's an ordered list, so screen readers say "3 items" and each step's number. The current step has `aria-current="step"`.
- Done steps show a tick and the word in the hint, or hidden text ("completed") if there's no hint; state is never colour alone.
