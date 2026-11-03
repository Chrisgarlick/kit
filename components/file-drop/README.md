---
title: File drop
group: inputs
order: 80
tier: 2
pattern: Native file input
status: beta
summary: A drop zone for files on the native file input, so clicking, the keyboard and the phone picker all still work, with a list of what was chosen and a way to remove each one.
---

## Usage

```html
<label class="kit-drop">
  <input type="file" name="files" multiple accept=".pdf,image/*" aria-describedby="drop-hint">
  <span class="kit-drop-title">Drop files here, or <u>choose them</u></span>
  <span class="kit-drop-hint" id="drop-hint">PDF or images, up to 10MB each</span>
</label>
```

It's a real file input, made invisible and stretched over a styled label, so it works without a script and with every picker. `drop.js` (in `kit.js`) adds dragging files onto it, a list of the chosen files with their sizes and a remove button each, and filters dropped files by `accept`. The input's `files` is updated, so the form submits exactly what's listed, and `change` fires as usual.

## Accessibility

- The input keeps focus and its native keyboard behaviour (Enter or Space opens the picker); the zone shows the focus ring.
- The label is the instruction; the hint says which files and sizes are allowed.
- The chosen files are a list with sizes, and each remove button names its file; additions and removals are announced.
