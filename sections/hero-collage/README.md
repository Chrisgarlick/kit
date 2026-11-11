---
title: Hero, collage
group: sections
order: 22
tier: 1
pattern: Website section
uses: [container, button]
status: preview
summary: The first thing on a page, centred and big, with up to four floating cards in the corners showing a number, a score, a photo or a note.
---

## Usage

```blade
<x-kit-section-hero-collage :content="$hero" />
```

| Field | Type | Notes |
|---|---|---|
| `eyebrow`, `title`, `heading_level`, `lede` | | As the [hero](/sections/hero/); the heading is an `h1` by default. |
| `actions` | list (up to 2) | `label`, `url`, `style`. |
| `cards` | list (up to 4) | In the corners in order: top left, bottom left, top right, bottom right. `kind` is `stat` (`label`, `value`, `text`), `score` (`score` 0 to 100, `label`, `text`), `photo` (`image`, `label` as its caption) or `note` (`label`, `value` as its title, `text`). |

The cards are a flourish: they're left out below 68rem, so nothing a visitor needs should be only in a card. The "check your site" input card from Design waits for the contact section's forms.

## Accessibility

- The score's ring is drawn; its number is read as "99 out of 100".

## Design

Base theme → Kit sections, `Section / hero, collage` (`c_hero_collage`) with the floating cards, and its mobile state.
