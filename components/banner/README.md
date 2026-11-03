---
title: Banner
group: feedback
order: 80
tier: 2
pattern: Region
status: beta
summary: A full-width message across the top of a page or section, for notices everyone should see, with an optional action and a dismiss button that remembers.
---

## Usage

```html
<div class="kit-banner" data-tone="info" role="region" aria-label="Notice" data-banner-id="maintenance-nov">
  <p>Scheduled maintenance on Sunday from 06:00 to 07:00.</p>
  <a class="kit-banner-action" href="/status">Details</a>
  <button class="kit-banner-close" type="button" aria-label="Dismiss notice">×</button>
</div>
```

| Attribute | Values | Default |
|---|---|---|
| `data-tone` | `info`, `good`, `warn`, `bad`, `accent` | neutral |
| `data-banner-id` | a name; once dismissed, it stays dismissed in this browser | dismissing lasts for the page view |

`banner.js` (in `kit.js`) handles the close button. Use banners sparingly: one at a time, for things that apply to the whole page. For messages about one section, use an alert; for confirmations, a toast.

## Accessibility

- It's a labelled region, so screen-reader users can find it and skip it. It isn't announced on load: if it appears because of something the person did, also `announce()` it.
- The close button is named, and focus moves to the main content after dismissing, so it isn't lost.
- Tone comes with words; colour alone never carries the meaning.
