---
title: Process
group: sections
order: 38
tier: 1
pattern: Website section
uses: [container, link]
status: preview
summary: How it works. A heading, numbered steps and a link, beside up to two layered example cards that show what's included and what isn't.
---

## Usage

```blade
<x-kit-section-process :content="$process" />
```

| Field | Type | Notes |
|---|---|---|
| `eyebrow`, `title`, `heading_level` | | The heading, `*stars*` for italics. |
| `steps` | list (1 to 6) | `title` and `text`, numbered in order. |
| `step_punctuation` | boolean | On by default: a full stop after each step's `title`. Off, the title is shown as written (for titles that end in a question mark, or are sentences). |
| `link_label`, `link_url` | | One arrow link under the steps. |
| `cards` | list (up to 2) | Example cards: `label`, `title` (rich text: `*stars*` for italics, a new line for a line break), `points` (each `text` and `included`). |
| `background` | `plain` or `tinted` | Tinted by default, so the white cards stand out. |

## Layout

A size container. Below 56rem of its own width the example cards are left out, as in Design: the
steps carry the section on a phone, so nothing a visitor needs should be only in the cards.

## Accessibility

- The steps are an ordered list; the numbers come from it.
- In the cards, a tick or a cross is drawn, and "Included" or "Not included" is said in words to screen readers.

## Design

Base theme → Kit sections, `Section / process` (`c_process`) with `Note card` (`c_note_card`), and its mobile state.
