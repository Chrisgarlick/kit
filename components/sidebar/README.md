---
title: Sidebar
group: navigation
order: 60
tier: 1
pattern: Navigation landmark
status: preview
summary: A vertical list of links for moving around an app, with icons, counts, section labels and nested pages. This site's own navigation is one.
---

## Usage

A `<nav class="kit-sidebar">` holding plain lists of links. Mark the page you're on with `aria-current="page"`.

| Part | Markup |
|---|---|
| Link | `<a href="…">` inside an `<li>` |
| Icon | an `<svg>` as the link's first child (decorative: `aria-hidden="true"`) |
| Count or badge | `<span class="kit-sidebar-meta">` at the end of the link; `data-tone="new"` for a highlighted badge |
| Section label | `<p class="kit-sidebar-label">` before a list, or a heading if your page outline needs one |
| Nested pages | a `<ul>` inside the `<li>`, after the link |

Where the sidebar sits is up to the page: sticky beside the content on wide screens, in a drawer or a wrapping row on phones. This site keeps it sticky on desktop and wraps it into a row below 960px.

## Accessibility

- `<nav>` is a navigation landmark, so screen-reader users can jump to it. Give it an `aria-label` ("Main", "Site") when the page has more than one `<nav>`.
- `aria-current="page"` tells screen readers which link is the current page; it's also shown by more than colour (bold, and outlined in forced-colours mode).
- Counts are part of the link's name ("Projects 4"). Keep them short, and put any longer explanation in the page itself.
- Icons are decorative; the text is always visible, so the sidebar never relies on icons alone.

## Extension points

- Custom properties: `--kit-control` (row height), `--kit-accent` and `--kit-accent-soft` (the current page), `--kit-radius-1`.
