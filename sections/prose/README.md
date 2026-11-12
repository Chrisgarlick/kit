---
title: Prose
group: sections
order: 85
tier: 1
pattern: Website section
uses: [container]
status: preview
summary: The body of an article or a legal page. A readable column of typed blocks (paragraphs, numbered headings, lists, a quote, a pair of numbers, code, a table, figures), so no HTML is ever stored.
---

## Usage

```blade
<x-kit-section-prose :content="$article" />
<x-kit-section-prose :content="$privacy" variant="left" />
```

```php
echo kit_section(__DIR__ . '/kit/prose.php', ['content' => $article]);
```

The section has no heading of its own: the page's hero carries the `h1`, and the body's headings are blocks.

| Field | Type | Notes |
|---|---|---|
| `blocks` | list (1 to 120), required | The body, in order. Each block has a `kind` and fills only the fields that kind uses (below); the rest stay empty. |
| `width` | `normal` or `narrow` | About 45rem (about 75 characters a line), or 38rem for a legal page or a short note. |
| `background` | `plain` or `tinted` | Tinted is `--kit-band`. |

The variant places the column: `default` centres it in the container, `left` puts it on the left.

### Blocks

| `kind` | Fields it uses | Renders |
|---|---|---|
| `paragraph` (the default) | `text` (rich text) | One `<p>`, or several: a blank line starts a new one. |
| `heading` | `text` (rich text), `number` ("01", optional), `heading_level` (2 by default) | `h2` (or `h3`, `h4`), the number in a `span` above the words. |
| `list` | `items` (list of `text`, rich text, up to 30), `ordered` | `ul`, or `ol` when `ordered`. |
| `quote` | `text` (rich text), `attribution` | `figure` with `blockquote` and `figcaption`. |
| `stats` | `stats` (list of `value` and `label`, up to 3) | A description list, number first to the eye. |
| `code` | `code` (textarea), `caption` ("PHP · the check at the front") | `figure` with `figcaption` and `pre`/`code`, kept exactly as typed. |
| `table` | `caption`, `columns` (list of `text`, up to 6), `rows` (list of `cells`, each a list of `text`, rich text), `row_headers` | `table` with `caption`, `th scope="col"`, and `th scope="row"` for the first cell when `row_headers`. |
| `figure` | `image` (alt text, or empty for decorative), `caption`, `size` (`column` or `wide`) | `figure` with `img` and `figcaption`; wide spans the container. A figure with no image yet shows a placeholder. |

Rich text is plain text with marks (`*italics*`, `**bold**`, line breaks), escaped before the marks become tags, like every kit field. A list's points and a table's rows and cells are nested lists in the schema (a table is blocks → rows → cells), so nothing is split out of a string and nothing needs a separator. The code field is a plain textarea: it's escaped and printed as it is, so `*` and `<` in code stay as typed.

## Layout

- The column sits on a three-track grid inside the container; every block takes the middle track and a wide figure spans all three, so it breaks out of the column to the container's width (72rem).
- Body text is `--kit-text-xl` at 1.7 leading on a wide screen and `--kit-text-lg` at 1.65 below 36rem of the section's own width (a container query), so the measure stays about 60 to 75 characters.
- Headings use the display face, weight, tracking and case tokens; a heading's number is in the mono face, in the accent.
- The numbers sit side by side while there's room (11rem each) and stack on a phone.
- Code and tables scroll sideways inside themselves; nothing widens the page.

## Accessibility

- Real elements throughout: `h2`–`h4`, `ul`/`ol`, `blockquote` in a `figure` with `figcaption`, `dl` for the numbers (read "label: number"), `figure`/`figcaption` for code and images, and a `table` with a `caption`, column headers (`scope="col"`) and optional row headers (`scope="row"`).
- Keep heading levels in order: `h2` for the article's main headings, `h3` under them. The page's `h1` is the hero's.
- A heading's number is part of its text ("01 How it was measured"), so the outline reads in order.
- A code block or table that is wider than the column scrolls inside itself and is focusable (`tabindex="0"`) with a visible focus ring, so it can be scrolled from the keyboard (WCAG 2.1.1).
- An image needs alt text that says what it shows; an empty alt marks it decorative (the schema asks for the alt key either way). The caption is visible text, not a replacement for the alt.
- Body text is at least 1rem with 1.65+ leading and a column of about 45rem.

## Design

Kit · Nightfolio, the article and privacy pages (`nf_*`). Not yet in the Kit sections Design file.
