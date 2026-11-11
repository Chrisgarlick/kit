---
title: Pill row
group: sections
order: 34
tier: 1
pattern: Website section
uses: [container]
status: preview
summary: A label and a row of pills for packages, areas covered or specialisms. Each can link to its page.
---

## Usage

```blade
<x-kit-section-pill-row :content="$areas" />
```

| Field | Type | Notes |
|---|---|---|
| `label` | text | "Areas we cover:" |
| `pills` | list (1 to 10) | `text`, and `url` to make it a link. |
| `background` | `plain` or `tinted` | |

## Accessibility

- The pills are a list. Linked ones are links with a visible focus ring; the rest are text, not buttons.

## Design

Base theme → Kit sections, `Section / pill row` (`c_pills`) and its mobile state.
