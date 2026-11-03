---
title: Container
group: layout
order: 50
tier: 1
pattern: Layout
status: preview
summary: A centred column with a maximum width and side gutters that never drop below 16px, for page bodies and readable text.
---

## Usage

```html
<main class="kit-container">…</main>
<article class="kit-container" data-size="prose">…</article>
```

| Attribute | Values | Default |
|---|---|---|
| `data-size` | `prose` about 70 characters, `sm` 40rem, `md` 56rem, `lg` 72rem, `xl` 90rem, `full` | `lg` |
| `data-flush` | present to drop the gutters, inside something that has its own | gutters |

The gutter grows from 16px on a phone to 32px on a wide screen, and the maximum width is for the content, so the gutters never eat into it.

## Accessibility

- Layout only. `prose` keeps lines to a comfortable reading length, which helps everyone and especially people with dyslexia or low vision who zoom in.
