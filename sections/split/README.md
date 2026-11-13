---
title: Split
group: sections
order: 40
tier: 1
pattern: Website section
uses: [container, text-block, link, accordion]
status: preview
summary: Two halves. A text block beside an image, for an about section, or beside questions and answers, for an FAQ.
---

## Usage

```blade
<x-kit-section-split :content="$about" />
```

```php
echo kit_section(__DIR__ . '/kit/split.php', ['content' => $faq]);
```

The text side has the [text block](/sections/text-block/)'s fields (`eyebrow`, `title`, `heading_level`, `body`, `points` with `excluded`, `link_label`, `link_url`). Then:

| Field | Type | Notes |
|---|---|---|
| `media` | `image`, `questions` or `card` | What sits beside the text. `image` by default. |
| `image` | image | Alt text required. Lazy-loaded: a split is rarely the first section. Empty, it shows a placeholder. |
| `caption` | text | Optional, up to 160 characters. Set, the image goes in a `<figure>` with the caption as its `<figcaption>`, under it. |
| `frame` | `none` or `browser` | With an image: `none` by default. `browser` puts the image in a window, so a screenshot reads as the product: a bar on top (three dots and the address), rounded `--kit-radius-2` corners, a 1px `--kit-line` border and `--kit-shadow-2`. The image keeps its own shape under the bar, not cropped square. Beside a text `panel`, the panel's colour runs under the image half too and the window floats in it, centred. |
| `frame_url` | text | Optional, up to 80 characters. With the browser frame, the address in the bar ("kritano.com"), in the mono face. |
| `card_label` | text | With `card`: a short label at the top of the card, in the mono face ("Time to first byte · cg-cms, live 1GB server"). Optional. |
| `card_title` | rich text | With `card`: the card's main words in the display face; a new line is a line break, `*stars*` for italics ("0.4 ms a page\n6,300 a second"). |
| `card_text` | text | With `card`: optional, a smaller note under it. |
| `questions` | list (up to 12) | `question`, `answer` (paragraphs). The first starts open. |
| `numbered` | boolean | Off by default. Shows "01", "02"… before each question, in the mono face. |
| `panel` | `none`, `accent` or `surface` | None by default. Puts the text on a filled panel: `accent` is `--kit-accent` with `--kit-accent-fg` text (the label, body, ticks and link all take the panel's text colour), `surface` is `--kit-surface`, lifted with `--kit-shadow-3`. Beside an image the panel and the image meet edge to edge, as one rounded block, the image filling the panel's height; beside questions the panel keeps the gap. |
| `swap` | boolean | An image starts on the left, questions and a card on the right; this swaps them. |
| `background` | `plain` or `tinted` | Tinted is `--kit-band`, a step from the page colour. |

## Layout

A size container. Below **48rem of its own width** the halves stack: an image always above the
text, questions and a card always below it. A browser frame's bar scales down with the section, and
its address shortens with an ellipsis and is left out below 20rem.

The card is a sheet of `--kit-surface` with a 1px `--kit-line` border and `--kit-shadow-3`, its
content centred down it: for a figure or a fact the text points to, like a measured number.

## Accessibility

- The questions are kit's [accordion](/navigation/accordion/): native `<details>`, so they open
  with Enter or Space and announce whether they're open. They open independently.
- Answers are hidden only visually while closed, and the browser's find-in-page opens them.
- A question's number is `aria-hidden`: each summary is read as its question alone.
- The card is paragraphs, not a heading: it's read after the text, in order, label first.
- A point marked `excluded` has a cross, and "Not included:" is said first (visually hidden).
- The browser frame's bar is `aria-hidden`: decoration. The image's alt text carries the meaning,
  so the address isn't read twice.

## Design

Base theme → Kit sections, `Layout / split 50/50` (`c_split`): About (surface, image + text
block) and FAQ (top, text block + FAQ items), and the surface-mobile state.
