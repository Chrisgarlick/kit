---
title: Top bar
group: navigation
order: 70
tier: 1
pattern: Banner landmark
status: preview
summary: The bar across the top of an app or site, with the name, the main links and actions, staying put as the page scrolls and collapsing its links on phones.
---

## Usage

```html
<header class="kit-topbar">
  <a class="kit-topbar-brand" href="/">Name</a>
  <nav class="kit-topbar-nav" aria-label="Main">
    <a href="/" aria-current="page">Dashboard</a>
    <a href="/projects">Projects</a>
  </nav>
  <div class="kit-topbar-actions">…buttons…</div>
</header>
```

`data-sticky` keeps it at the top as the page scrolls, with a frosted background. On narrow screens the links scroll sideways in their own strip under the name; for many links, put them in a drawer behind a menu button instead.

## Accessibility

- As the page's `<header>`, it's the banner landmark; the links are a `nav` named "Main". Put a "Skip to content" link first.
- The current page's link has `aria-current="page"`, shown with an underline as well as colour.
