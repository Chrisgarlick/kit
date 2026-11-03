---
title: Code block
group: data-display
order: 85
tier: 2
pattern: Figure with pre
status: beta
summary: Code with a filename, line wrapping off, a copy button and a scroll area that works from the keyboard, light and fast with no highlighter to load.
---

## Usage

```html
<figure class="kit-code">
  <figcaption><span>install.sh</span><button class="kit-button" data-size="sm" data-variant="ghost" data-copy-target="#code-1">Copy</button></figcaption>
  <pre tabindex="0" id="code-1"><code>npm install kit</code></pre>
</figure>
```

The copy button is a [copy button](/actions/copy-button/) pointing at the `<pre>`. `data-wrap` on the figure wraps long lines instead of scrolling. There's no syntax highlighting, which keeps it to a few lines of CSS; colour the code on the server if you need it.

## Accessibility

- The `<pre>` scrolls sideways, so it's focusable (`tabindex="0"`) for keyboard users (WCAG 2.1.1).
- The caption names the code; the copy button says what it copies when there are several on a page ("Copy install.sh").
