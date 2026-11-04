---
title: Calendar
group: inputs
order: 86
tier: 2
pattern: Date grid (APG)
status: beta
summary: A month grid for choosing a day or a range of days, from the keyboard as well as the pointer, in the page's language and week, with limits and days ruled out.
---

## Usage

```html
<kit-calendar name="due" value="2026-11-04" min="2026-11-01"></kit-calendar>

<kit-calendar name="period" range from="2026-11-02" to="2026-11-08"></kit-calendar>
```

Days are `YYYY-MM-DD` strings. In a form, a calendar submits its `value`; a range submits one ISO 8601 interval, `2026-11-02/2026-11-08`. Listen for `change`, whose detail is `{ value }` or `{ from, to }`.

| Attribute | Values | Default |
|---|---|---|
| `value` | the chosen day | none |
| `range` | present to choose from one day to another | one day |
| `from`, `to` | the chosen range | none |
| `min`, `max` | the first and last days that can be chosen | none |
| `month` | the month shown, `YYYY-MM` | the chosen day's, else this month |
| `week-start` | `0` Sunday, `1` Monday, `6` Saturday | the language's |
| `locale` | a language tag for names and week start | the page's `lang` |
| `name` | the form field's name | none |
| `data-bare` | no border or padding, for use inside a popover or card | |

To rule out more days than `min` and `max` allow, such as weekends or booked days, set `calendar.isDateDisabled = (day) => boolean`. `goTo(day)` shows a day's month and makes it the active day.

When people may know the date already, a [date picker](/inputs/date-picker/) (the native input) is quicker to type into. Use the calendar when seeing the month matters: availability, a range, or a week in context. For a range picker with presets in a popover, see the [date range picker](/inputs/date-range/).

## Accessibility

- It's a grid (the APG date picker pattern) named by the month, with one day in the tab order. Arrows move a day or a week, Home and End go to the start and end of the week, Page Up and Down move a month, and with Shift a year. Enter or Space chooses.
- Each day's name is the full date ("Wednesday 4 November 2026"), today is marked with `aria-current="date"`, and days that can't be chosen are `aria-disabled`.
- Choices are announced: the day, or the start of a range and then the whole range.
- The month shown is a live region, so moving to another month is announced.
- Weekday headers carry their full names (`abbr`) for screen readers.
