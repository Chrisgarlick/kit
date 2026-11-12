---
title: Marquee
group: sections
order: 33
tier: 1
pattern: Website section
uses: []
status: preview
summary: One line of large type scrolling slowly between sections, a few short phrases with a separator. CSS only; still for visitors who ask for less motion.
---

## Usage

```blade
<x-kit-section-marquee :content="$marquee" />
```

| Field | Type | Notes |
|---|---|---|
| `phrases` | list (1 to 8) | `text`: a few words, `*stars*` for italics. |
| `separator` | text (up to 3 characters) | Between phrases, in the accent colour: `·` by default. |
| `speed` | `slow` or `normal` | One loop takes 60s or 32s. |
| `tone` | `dark`, `tinted` or `plain` | Dark is the `--kit-inverse-*` band, like stats and the footer. |

Use it once a page at most, between two sections, for words that set a mood rather than words a
visitor needs: nothing in it should be the only place a fact appears.

## Layout

A size container. The phrases are set in the display face (`--kit-font-display`, in
`--kit-display-case`), sized by the section's own width, on one line that never wraps while it
moves. The phrases are drawn twice and the line moves left by one copy's width, so the loop is
seamless; each copy is at least the section's width, so three short words don't leave a gap. No
JavaScript.

## Accessibility

- **Reduced motion:** with `prefers-reduced-motion: reduce` nothing moves. The copy is removed and
  the phrases wrap as a still, centred block.
- **Pausing:** the line stops while the pointer is over it or anything in it has focus. A pause box
  ("Pause the moving text") is the first thing in the section for the keyboard: it's out of sight
  until it has focus, and ticking it keeps the line still (WCAG 2.2.2, Pause, Stop, Hide).
- **Read once:** the phrases are a list; the second copy that makes the loop is `aria-hidden`, and
  so are the separators, so a screen reader hears each phrase once.

## Design

Kit · Nightfolio, the Home page's marquee band (`nf_*`); it's not yet in the Kit sections file.
