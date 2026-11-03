---
title: Card
group: data-display
order: 80
tier: 1
pattern: Article
status: preview
summary: A surface that groups one thing's content, with an optional header and footer, and a whole-card link that stays accessible.
---

## Usage

```html
<article class="kit-card">
  <header class="kit-card-header"><h3><a class="kit-card-link" href="/items/1">Card title</a></h3><span class="kit-badge" data-tone="good">Success</span></header>
  <div class="kit-card-body"><p>Supporting text for the card.</p></div>
  <footer class="kit-card-footer">…</footer>
</article>
```

`data-raised` swaps the border for a shadow. Not every group needs a card: use them for things people scan and pick between, and plain sections for the rest.

## Accessibility

- A clickable card is one real link (`class="kit-card-link"`, usually on the title). Its click area stretches over the card, but screen readers hear a single, well-named link, not the whole card's text.
- Other buttons and links inside a clickable card keep working on top of it.
- Focus on the link outlines the whole card. `:has()` needs Safari 15.4 or later, inside kit's browser floor.
- Use `<article>` for things that stand alone (an invoice, a project) and a `<div>` or `<section>` otherwise, with a heading at the right level for the page.
