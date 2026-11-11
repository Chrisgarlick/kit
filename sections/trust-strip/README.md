---
title: Trust strip
group: sections
order: 25
tier: 1
pattern: Website section
uses: [container]
status: preview
summary: A quiet row of logos, such as accreditations, memberships or where you've been featured, greyed until hovered. A logo not chosen yet shows its name.
---

## Usage

```blade
<x-kit-section-trust-strip :content="$trust" />
```

| Field | Type | Notes |
|---|---|---|
| `label` | text | "Trusted and accredited" by default. |
| `logos` | list (up to 8) | `name` (required: the logo's alt text, and shown until there's a logo), `image`, `url` (their page about you, like a register entry). |
| `background` | `plain` or `tinted` | |

Only show accreditations the business really holds. Where a body has a public register, link to the entry: it's the proof.

## Accessibility

- Each logo's alt text is the organisation's name, so the logos can't be uploaded without one.
- Greyed logos still meet 3:1 against the page; hovering or focusing a linked one shows its colours.

## Design

Base theme → Kit sections, `Section / trust strip` (`c_trust`) and its mobile state.
