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

The text side has the [text block](/sections/text-block/)'s fields (`eyebrow`, `title`, `heading_level`, `body`, `points`, `link_label`, `link_url`). Then:

| Field | Type | Notes |
|---|---|---|
| `media` | `image` or `questions` | What sits beside the text. |
| `image` | image | Alt text required. Lazy-loaded: a split is rarely the first section. Empty, it shows a placeholder. |
| `questions` | list (up to 12) | `question`, `answer` (paragraphs). The first starts open. |
| `numbered` | boolean | Off by default. Shows "01", "02"… before each question, in the mono face. |
| `swap` | boolean | An image starts on the left and questions on the right; this swaps them. |
| `background` | `plain` or `tinted` | Tinted is `--kit-band`, a step from the page colour. |

## Layout

A size container. Below **48rem of its own width** the halves stack: an image always above the
text, questions always below it.

## Accessibility

- The questions are kit's [accordion](/navigation/accordion/): native `<details>`, so they open
  with Enter or Space and announce whether they're open. They open independently.
- Answers are hidden only visually while closed, and the browser's find-in-page opens them.
- A question's number is `aria-hidden`: each summary is read as its question alone.

## Design

Base theme → Kit sections, `Layout / split 50/50` (`c_split`): About (surface, image + text
block) and FAQ (top, text block + FAQ items), and the surface-mobile state.
