---
title: Announcement bar
group: sections
order: 5
tier: 1
pattern: Website section
uses: [container]
status: preview
summary: A thin band across the top of every page with one offer or notice, and a link. Dark or in the accent colour.
---

## Usage

```blade
<x-kit-section-announcement-bar :content="$notice" />
```

| Field | Type | Notes |
|---|---|---|
| `icon` | icon | A truck by default. |
| `text` | text, required | One line: "Free UK delivery on orders over £40". |
| `link_label`, `link_url` | | |
| `tone` | `dark` or `accent` | |

It goes above the header, in the header template part on WordPress.

## Accessibility

- An `aside` named "Notice", so it's a landmark screen-reader users can skip.
- Not dismissible and never moving: a notice that scrolls or flashes is easier to miss and harder to read.

## Design

Base theme → Kit sections, `Section / announcement bar` (`c_announce`).
