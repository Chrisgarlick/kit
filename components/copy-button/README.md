---
title: Copy button
group: actions
order: 50
tier: 2
pattern: Button
status: beta
summary: A button that copies text to the clipboard, confirming in place and to screen readers, with a fallback that selects the text when copying is blocked.
---

## Usage

```html
<button class="kit-button" data-copy="npm install kit">Copy</button>
<button class="kit-button" data-icon data-copy-target="#api-key" aria-label="Copy API key">…</button>
```

`copy.js` (in `kit.js`) copies the `data-copy` text, or the text (or value, for inputs) of the element `data-copy-target` points at. The button shows "Copied" for two seconds (its `aria-label` too, for icon buttons) and announces it; a `copy` event fires with `{ text }`.

If the browser refuses (some embedded views do), the target's text is selected instead, so Ctrl or ⌘+C finishes the job.

## Accessibility

- It's a real button, with a name that says what it copies when that isn't obvious.
- "Copied" is announced through a live region; the button's own label changes too, so there's a visible and a spoken confirmation.
