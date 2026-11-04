---
title: Command palette
group: overlays
order: 50
tier: 2
pattern: APG combobox in a dialog
status: beta
summary: Search everything and jump anywhere from ⌘K, with grouped results, keyboard-first, and server results merged in as they arrive.
---

## Usage

```html
<kit-command id="palette" label="Search commands">
  <a href="/settings" data-group="Pages" data-keywords="preferences account">Settings</a>
  <button value="new" data-group="Actions" data-hint="N">New project</button>
</kit-command>
<button class="kit-button" commandfor="palette" command="--open">Search <kbd class="kit-kbd">⌘K</kbd></button>
```

The links and buttons inside are its items; they stay hidden until the palette lists them. Choosing a link follows it, and choosing a button clicks it, so handlers already on the button run. A cancelable `select` event fires first, with `{ value, item }`.

| Attribute | Values | Default |
|---|---|---|
| `shortcut` | a letter pressed with ⌘ (Mac) or Ctrl (elsewhere); empty for none | `k` |
| `label` | the palette's accessible name | "Command palette" |
| `placeholder` | the search box's placeholder | "Search…" |
| `data-group`, `data-keywords`, `data-hint` | on each item: its heading, extra words that find it, a shortcut shown beside it | none |

For results from a server, set `source` to an async function. It's called with the query and an `AbortSignal` that aborts when the person types again, so only the latest results show:

```js
palette.source = async (q, signal) => {
  const r = await fetch(`/search?q=${encodeURIComponent(q)}`, { signal });
  return (await r.json()).map((x) => ({ label: x.title, group: 'Sites', href: x.url }));
};
```

Every word typed must appear in a markup item's label, keywords or group; items whose label starts with the words rank first, and groups are ordered by their best match. The source's items are taken as its own matches (a server may match on words it doesn't send), so they are ranked but never dropped. An item's `description` shows as a second, quieter line.

## Accessibility

- It's a modal dialog: the page behind is inert, Escape closes it and focus returns to where it was.
- The search box is a `combobox` controlling a `listbox` of grouped options; arrows move the highlighted option (`aria-activedescendant`) while focus stays in the box, and Enter chooses.
- After a pause in typing, the number of results is announced.
- The shortcut is a convenience: always offer a visible button that opens the palette too.
