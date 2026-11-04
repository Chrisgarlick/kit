---
title: Tabs
group: navigation
order: 10
tier: 2
pattern: APG tabs
status: beta
summary: One panel at a time, chosen from a row of tabs, with arrow-key movement and every panel readable before the script loads.
---

## Usage

```html
<kit-tabs>
  <div class="kit-tablist" aria-label="Sections">
    <button>Overview</button>
    <button>Activity</button>
  </div>
  <div>Overview panel</div>
  <div>Activity panel</div>
</kit-tabs>
```

The nth button shows the nth panel. The first tab is chosen unless `value` names another (a tab's `value` attribute, else its text).

| Attribute | Values | Default |
|---|---|---|
| `value` | the chosen tab | the first |
| `activation` | `auto` (arrows choose), `manual` (arrows move, Enter or Space chooses) | `auto` |
| `data-orientation` | `vertical`, tabs down the side | across |

| Event | Detail |
|---|---|
| `change` | `{ value }`, when the person picks another tab |

Use `activation="manual"` when a panel is slow to show, say it loads data, so arrowing past it doesn't load it. Tabs switch views of the same thing; for moving between pages, use links. For links between pages that look like tabs (a server-rendered `?tab=`), use the same row with no script: mark the current one with `aria-current="page"`.

```html
<nav class="kit-tablist" aria-label="Site">
  <a href="?tab=overview" aria-current="page">Overview</a>
  <a href="?tab=audits">Audits <span class="kit-badge">2</span></a>
</nav>
```

## Accessibility

- Roles `tablist`, `tab` and `tabpanel`, `aria-selected` and `aria-controls` are set for you; give the tab list an `aria-label`.
- One tab is in the tab order. Arrow keys move between tabs (swapped on right-to-left pages), Home and End jump, and Tab moves into the panel.
- Each panel is focusable, so its content is reachable even when it has no links or buttons.
- Before the script loads (or if it fails), every panel is shown in order, so nothing is hidden from anyone.
