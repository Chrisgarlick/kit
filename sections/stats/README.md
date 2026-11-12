---
title: Stats
group: sections
order: 32
tier: 1
pattern: Website section
uses: [container, link]
status: preview
summary: A band of two to four numbers that prove the point, each with a line saying what it counts. Dark, tinted or plain.
---

## Usage

```blade
<x-kit-section-stats :content="$stats" />
```

| Field | Type | Notes |
|---|---|---|
| `stats` | list (1 to 4) | `value` as it reads ("15 yrs", "2,400+"), `label` (what it counts), and optionally `link_label` and `link_url`: an arrow link under the label ("How I measured"), shown only when both are set. |
| `tone` | `dark`, `tinted` or `plain` | Dark is the `--kit-inverse-*` band, like the footer. |

Only numbers that are true and checkable: "4.9 average review" should match the reviews section.

## Layout

A size container: the numbers share the row (three get three equal columns), and below 40rem of its own width they go two a row, or, with three, one under another so none is left alone.

## Accessibility

- A description list: each number is the `dd` of its label, so it's read "jobs completed: 2,400+". They're shown number first.
- A stat's link is a second `dd` of the same label, after the number, in the band's text colour with a focus ring to match.

## Design

Base theme → Kit sections, `Section / stats` (`c_stats`) and its two-column mobile state.
