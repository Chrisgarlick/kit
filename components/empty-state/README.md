---
title: Empty state
group: feedback
order: 70
tier: 1
pattern: Content
status: preview
summary: What a list or view shows before there's anything in it, saying why it's empty and what to do next.
---

## Usage

Say what would be here and how to get it there, in that order: "No invoices yet" then "Invoices you send appear here", then the action. Keep one primary action; a second, quieter one is fine.

An empty search result is different from an empty list: say what was searched for and offer to clear the filters.

## Accessibility

- The title is plain text, not a heading, so it doesn't disturb the page outline; use a heading of the right level if the empty state is the main content of a section.
- The icon is decorative (`aria-hidden="true"`).
- When a list empties as the result of an action (the last item deleted), announce it.
