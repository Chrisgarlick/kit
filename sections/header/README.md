---
title: Header
group: sections
order: 10
tier: 1
pattern: Website section
uses: [container, button]
status: preview
summary: The top of every page. The brand, up to seven links, a phone number and one action; on a phone the links fold into a menu, with no script.
---

## Usage

In a Laravel or cg-cms project (`kit section export -target blade header`):

```blade
<x-kit-section-header :content="$header" />
```

In plain PHP or WordPress without Blade (`kit section export -target php header`):

```php
require __DIR__ . '/kit/kit.php';
echo kit_section(__DIR__ . '/kit/header.php', ['content' => $header]);
```

`$header` is the section's content, shaped by `header.schema.json`:

| Field | Type | Notes |
|---|---|---|
| `brand_name` | text, required | Shown beside the mark or logo. Bound to the site's name. |
| `logo` | image | Replaces the square mark. Its alt is empty: the name beside it says it. |
| `home_url` | url | Defaults to `/`. |
| `links` | list (up to 7) | `label`, `url`, `current` for the page you're on (`aria-current="page"`, the accent colour and an underline), and `section` (boolean, off by default) for the section the page is in, like Services on `/services/laravel`: `aria-current="true"`, with the same colour and underline. `current` wins when both are set. On cg-cms both are worked out from the request's path (an exact match is the page; a path under the link's, a whole segment at a time, is the section; never the home link). |
| `numbered` | boolean | Shows "01", "02"… before each link, in the mono face. Off by default. The number is `aria-hidden`: the link's name stays its label. |
| `phone` | text | Linked with `tel:`; below 72rem only the icon shows. Bound to the site's phone. |
| `secondary_label`, `secondary_url` | text, url | Optional: a plain text link before the button ("Book a call"), and in the phone menu between the links and the button. Left out when either is empty. |
| `action_label`, `action_url` | text, url | The one primary button. Left out when either is empty. |
| `tone` | `plain` or `dark` | `plain` (the default) uses the page's colours; `dark` sits on the `--kit-inverse-*` band, like the footer, so the logo must read on it. |

## Layout

The header is a size container, so it responds to **its own width**, not the window's, and
behaves the same in a narrow preview. Below 72rem the phone number shows as its icon alone and the
gaps close up; below 54rem the links and the button fold into the menu.

## Accessibility

- The links are a `<nav aria-label="Main">`; the current page has `aria-current="page"`, shown
  with an underline as well as the colour. The section the page is in has `aria-current="true"`
  (read as "current"), shown the same way.
- Numbered links read as their label alone ("Services", not "01 Services"): the number is
  decoration, hidden from screen readers.
- The menu is a native `<details>`: its summary is a real control that says whether it's open
  (`aria-expanded` comes with it) and works without JavaScript. The folded menu repeats the
  links in a second `<nav aria-label="Menu">`; only one of the two is ever displayed.
- The phone link reads its number; the icon is hidden from screen readers.
- Not yet: Escape doesn't close the open menu (that needs the small tier 2 script planned for
  phase 2).

## Design

Base theme → Kit sections, `Section / header` (`c_nav`), with its mobile and menu-open states.
