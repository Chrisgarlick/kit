---
title: Section head
group: content
order: 20
tier: 1
pattern: Heading group
status: preview
summary: What sits above a grid of cards. A label, a heading, a line, and a "see all" link at the end of the row, or everything centred.
---

## Usage

```html
<div class="kit-section-head">
  <div class="kit-section-head-text">
    <p class="kit-section-head-eyebrow">What we do</p>
    <h2 class="kit-section-head-title">Services, in a sentence</h2>
    <p class="kit-section-head-lede">One line of introduction.</p>
  </div>
  <a class="kit-link" data-variant="arrow" href="/services">All services</a>
</div>
```

| Attribute | Values | Default |
|---|---|---|
| `data-align` | `centre`: text centred, the link below it | text left, the link at the end of the row |

The services, reviews, pricing and gallery sections open with it.

## Accessibility

- The heading's level suits the page (usually `h2`); the label is a paragraph, not a heading.
- The link's words must make sense on their own ("All services", not "See all").
