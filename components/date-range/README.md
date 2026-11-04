---
title: Date range picker
group: inputs
order: 87
tier: 2
pattern: Button and popover
status: beta
summary: A button showing a range of days that opens presets (Last 7 days, This month…) beside a range calendar, built on two native date inputs that still work without the script.
---

## Usage

```html
<kit-date-range label="Period" presets="last7 last30 thisMonth lastMonth thisYear">
  <input class="kit-input" type="date" name="from" aria-label="From">
  <input class="kit-input" type="date" name="to" aria-label="To">
</kit-date-range>
```

It enhances two date inputs. Without the script, people type the two dates. With it, the inputs stay in the form, hidden, and carry the values, so a form submits the same `from` and `to` fields either way. Choosing a preset, or the second day in the calendar, closes the popover and fires `change` with `{ from, to, preset }`.

| Attribute | Values | Default |
|---|---|---|
| `label` | what the range is for, the start of the button's name | "Dates" |
| `presets` | any of `today yesterday last7 last30 last90 thisWeek lastWeek thisMonth lastMonth thisYear`, space-separated; empty for none | `last7 last30 thisMonth lastMonth thisYear` |
| `from`, `to` | the chosen range, `YYYY-MM-DD` | the inputs' values |
| `min`, `max`, `week-start`, `locale` | as on the [calendar](/inputs/calendar/) | |
| `placeholder` | the button's text with no range | "Choose dates" |

For other languages, set `presetLabels` to an object of labels by preset name. `show()` and `close()` open and close it from script.

## Accessibility

- The button says what's chosen in full ("Period: 2–8 November 2026") and has `aria-haspopup="dialog"` and `aria-expanded`.
- Opening it moves focus into the calendar, on the chosen range's first day. Escape, or a press outside, closes it, and focus goes back to the button.
- Presets are buttons, and the one matching the range is pressed (`aria-pressed`). The calendar is the APG date grid, with all its keys.
