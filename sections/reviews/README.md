---
title: Reviews
group: sections
order: 60
tier: 1
pattern: Website section
uses: [container, section-head, grid, card, link]
status: preview
summary: A heading, the review score and a grid of review cards. Stars, the customer's words, their name and where the review came from.
---

## Usage

```blade
<x-kit-section-reviews :content="$reviews" variant="centred" />
```

The heading row has the [section head](/content/section-head/)'s fields; its `lede` is the score summary
("**4.9** average from 120 reviews on Google"), bound to the site's review summary. Then:

| Field | Type | Notes |
|---|---|---|
| `columns` | `2`, `3` or `4` | |
| `reviews` | list (up to 12) | `rating` (1 to 5, default 5), `quote` (paragraphs), `name`, `detail` ("Leeds · Google review"). |
| `background` | `plain` or `tinted` | |

Use real reviews, with the customer's permission, and say where each came from.

## Accessibility

- Each review is a `figure`: the quote in a `blockquote`, the person in its `figcaption`.
- The stars are decorative; "Rated 4 out of 5" is there in words for screen readers.
- The initials avatar is hidden from screen readers: the name follows it.

## Design

Base theme → Kit sections, `Section / with grid` with `Card / review` (`c_review_card`): Reviews, centred.
