---
title: Event calendar
group: data-display
order: 90
tier: 2
pattern: Month table from a list
status: beta
summary: Dated items (posts, bookings, audits) on a month, as a table of days where there's room and an agenda where there isn't, built from a plain list that works without the script.
---

## Usage

```html
<kit-event-calendar month="2026-11">
  <ul>
    <li><time datetime="2026-11-05">5 Nov</time> <a href="/posts/1">Launch post</a></li>
    <li data-tone="good"><time datetime="2026-11-12T09:30">12 Nov, 09:30</time> Weekly audit</li>
  </ul>
</kit-event-calendar>
```

The list is the data. Each item's `<time datetime>` gives its day, and its time when there is one; the rest of the item, links included, is what shows on the calendar. Without the script, the list is what people see. With it, the month is a table of days with the items in them. A day with more than `max-items` shows "+N more", which opens the day in full.

Where the calendar has less than 40rem of its own width, it shows a compact month: small days with a dot for each kind (tone) of item on them, one dot per tone however many items share it, and today marked. It uses a container query, so it adapts to its column, not just the window. `layout` chooses otherwise: `agenda` shows the days with items as a list when narrow, `grid` always shows the full month, and `compact` always shows the small one.

`day-href="/d/{day}"` makes each day a real link (in the compact month, the whole day), for an app whose day view lives at its own URL; its name says what's on the day ("Thursday 12 November 2026: Reminder 1, Job 20"). `month-href="/calendar/{month}"` makes Today, previous and next real links too; without it they're buttons and `navigate` fires. `data-tone-labels="accent:Reminder,good:Workout,info:Job"` names the tones, in each day's summary and in a key below the month listing the tones it uses.

| Attribute | Values | Default |
|---|---|---|
| `month` | the month shown, `YYYY-MM` | this month if it has items, else the first item's |
| `max-items` | items shown per day before "+N more" | `3` |
| `layout` | `auto`, `agenda`, `grid`, `compact` | `auto` |
| `day-href` | a URL pattern with `{day}` (`YYYY-MM-DD`) | none: days aren't links |
| `month-href` | a URL pattern with `{month}` (`YYYY-MM`) | none: buttons and `navigate` |
| `data-tone-labels` | `tone:Label` pairs, comma-separated | none: no key |
| `week-start`, `locale` | as on the [calendar](/inputs/calendar/) | the page's language |
| `data-tone` (on an item) | `accent`, `good`, `warn`, `bad`, `info`, `neutral` | `accent` |

To fill it from script, set `events` to `[{ day, time, title, href, tone }]`. `navigate` fires with `{ month }` when someone moves to another month, so you can fetch that month's items.

## Accessibility

- The month is a table named by its title, with weekday headers (full names in `abbr`), and each day says its full date to screen readers. Today has `aria-current="date"`.
- Items are links or text in a list inside their day, so they're read in order and reached with Tab. The month title is a live region, so a change of month is announced.
- "+N more" is a button with `aria-expanded`, controlling the day's list.
- Colour is never the only signal: write what an item is, and use tones as a second cue.
