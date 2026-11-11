---
title: Product grid
group: sections
order: 110
tier: 1
pattern: Website section
uses: [container, breadcrumbs, select, button, grid]
status: preview
summary: A shop page. Breadcrumbs, a heading and the product count, category filters and sorting, and a grid of product cards with sale, sold-out and new badges and quick add.
---

## Usage

On WordPress with WooCommerce, the shop templates fill this from the catalogue (planned); as a
block it can be filled by hand, for a few featured products that link to another shop.

```blade
<x-kit-section-product-grid :content="$shop" />
```

| Field | Type | Notes |
|---|---|---|
| `crumbs` | list | The trail, current page last. |
| `title`, `heading_level`, `count` | | "Shop all", h1, "24 products". |
| `link_label`, `link_url` | | A link at the end of the heading row: "Shop all" when it's a few featured products on another page. |
| `categories` | list | Filter links: `label`, `url`, `current`. |
| `sort_options`, `sort_url`, `sort_name` | | A GET form: the select's name is `sort_name` (WooCommerce's `orderby`), its options `label` and `value`. Empty, no sort. |
| `columns` | `2`, `3` or `4` | Two a row on a phone. |
| `products` | list (up to 48) | `name`, `url`, `image`, `price`, `was_price`, `badge` (`none`, `sale`, `sold-out`, `new`), `add_label`, `add_url`. |

## Accessibility

- Each card's name is the link, and its click area covers the card; quick add is its own link above it, saying which product it adds ("Add: Product name").
- Sale prices are read "Now £14.99, was £19.99"; "Sale" and "Sold out" are words, not colour alone.
- The current category is marked `aria-current="page"`; sorting is a labelled select and a button, so it works without script.
- Quick add appears on hover or focus where there's a pointer, and is always shown on touch screens.

## Design

Base theme → Kit sections, `Section / product grid` (`c_shop_grid`) with `Card / product` (`c_product_card`): default, sale, sold out and quick add; the two-column mobile state.
