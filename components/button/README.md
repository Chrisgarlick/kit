---
title: Button
group: actions
order: 10
tier: 1
pattern: Button (native)
status: preview
summary: The thing people press. Four variants and three sizes, an icon-only form, and a loading state that keeps focus.
---

## Usage

Use a native `<button>` (or an `<a>` for navigation) with `class="kit-button"`. Keep **one primary button per view**; everything else steps down to secondary or ghost.

| Attribute | Values | Default |
|---|---|---|
| `data-variant` | `primary`, `secondary`, `ghost`, `danger` | `secondary` |
| `data-size` | `sm`, `md`, `lg` | `md` |
| `data-icon` | present for a square, icon-only button | absent |
| `aria-busy` | `true` while work is in progress | absent |

## Accessibility

- Native `<button>`: Enter and Space activate it, and it is focusable without `tabindex`.
- An icon-only button needs an `aria-label` that says what it does ("Copy link"), not what it shows.
- While loading, `aria-busy="true"` shows a spinner and the button stays focusable, so keyboard focus is never lost. Announce the result when the work finishes.
- Disabled buttons drop out of the tab order. Where people need to discover *why* they can't press it, use `aria-disabled="true"` and explain nearby instead.
- Focus shows a 2px ring in the accent colour, offset from the edge. Targets are at least 30px tall (26px in compact density), above WCAG 2.2's 24px minimum.

## Extension points

- Custom properties: `--kit-control`, `--kit-radius-2`, `--kit-accent`, `--kit-focus-ring`.
- Internal properties (`--_bg`, `--_fg`, `--_border`, `--_hover`) can be set on a class of your own to make a new variant without editing this file.
