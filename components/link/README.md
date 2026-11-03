---
title: Link
group: navigation
order: 80
tier: 1
pattern: Native link
status: preview
summary: Text links in the accent colour with a calm underline, a quiet variant for dense lists, an arrow for links that leave the site, and the visually hidden helper.
---

## Usage

```html
<a class="kit-link" href="/pricing">See pricing</a>
<a class="kit-link" data-variant="quiet" href="/team">Team</a>
<a class="kit-link" href="https://example.com" data-external>Example<span class="kit-vh"> (another site)</span></a>
```

| Attribute | Values | Default |
|---|---|---|
| `data-variant` | `quiet`: text colour, underlined on hover | accent, always underlined |
| `data-external` | adds an arrow for a link to another site | none |

`kit-vh` hides text visually but keeps it for screen readers; use it wherever words help out of context ("Edit<span class="kit-vh"> project one</span>").

## Accessibility

- Links in running text are underlined, not told apart by colour alone (WCAG 1.4.1); the quiet variant is for navigation lists where the context says "link".
- The external arrow is decoration: say "another site" in hidden text if it matters. Only open new tabs when there's a strong reason, and say so.
