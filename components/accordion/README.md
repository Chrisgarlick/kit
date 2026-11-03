---
title: Accordion
group: navigation
order: 50
tier: 1
pattern: Native details
status: preview
summary: Sections that open and close in place, built on native details and summary, so they work without a script and in find-in-page.
---

## Usage

```html
<details class="kit-accordion" name="faq">
  <summary>Question one</summary>
  <div class="kit-accordion-body"><p>Answer text.</p></div>
</details>
<details class="kit-accordion" name="faq">…</details>
```

Giving several the same `name` makes them exclusive: opening one closes the others (Chrome 120, Safari 17.2, Firefox 130; older browsers open them independently). Add `open` to start a section open. Where the browser supports it, opening animates its height, unless the person prefers reduced motion.

## Accessibility

- It's the native element: the summary is a button that says expanded or collapsed, and Enter or Space toggles it. No ARIA needed.
- Browsers open a closed section when find-in-page matches text inside it.
- Keep the summary short and put headings inside the summary only if the page outline needs them.
- The chevron is decoration; in forced-colours mode it takes the text colour.
