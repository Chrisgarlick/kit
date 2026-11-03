---
title: Breadcrumbs
group: navigation
order: 20
tier: 1
pattern: APG breadcrumb
status: preview
summary: The trail from the top of the site to the current page, as links, with the current page marked for screen readers.
---

## Usage

```html
<nav aria-label="Breadcrumb">
  <ol class="kit-breadcrumbs">
    <li><a href="/">Home</a></li>
    <li><a href="/projects">Projects</a></li>
    <li><a href="/projects/one" aria-current="page">Project one</a></li>
  </ol>
</nav>
```

Separators are drawn by CSS, so they aren't read out. On narrow screens the middle crumbs wrap rather than truncate.

## Accessibility

- A `nav` landmark named "Breadcrumb", around an ordered list, is the APG pattern: screen readers say how many levels there are.
- The last crumb is the current page, with `aria-current="page"`; it can stay a link or be plain text.
