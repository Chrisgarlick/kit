---
title: Product page
group: sections
order: 120
tier: 1
pattern: Website section
uses: [container, breadcrumbs, button, accordion, text-field]
status: preview
summary: One product. A photo gallery beside the name, rating and price, a description, its options as buttons or colour swatches, quantity and add to basket, delivery notes and folded details.
---

## Usage

On WordPress with WooCommerce, the single-product template fills it from the product (planned).

```blade
<x-kit-section-product-page :content="$product" />
```

| Field | Type | Notes |
|---|---|---|
| `crumbs`, `name`, `heading_level` | | The name is the page's `h1`. |
| `rating`, `reviews_label`, `reviews_url` | | "4.9 · 32 reviews", linking to the reviews. |
| `price`, `was_price` | | As they read. |
| `description` | textarea | Paragraphs. |
| `images` | list (up to 8) | The first is the main photo and loads first; the rest lazily. |
| `options` | list (up to 3) | `name`, `kind` (`buttons` or `swatches`), `values` (`label`, `colour` for a swatch, `selected`, `unavailable`). |
| `quantity`, `sold_out`, `add_label` | | |
| `form_action`, `product_id` | | The form posts `product`, `options[<name>]` and `quantity` to `form_action`. |
| `perks` | list (up to 3) | `icon` and `text` under the button. |
| `details` | list (up to 6) | Folded sections, on kit's accordion. |

## Behaviour without script

- The gallery is a scroll-snap strip: swipe it, or the thumbnails (links) jump to each photo.
- Options are real radio buttons and the button a real submit, so the form works with no script.
- A swatch's colour goes through `kit_colour()`, which passes only a hex colour, into an SVG `fill`: no inline style, so a strict `style-src` Content Security Policy is fine.
- The photo strip can be focused and scrolled with the arrow keys.

## Accessibility

- Options are fieldsets with a legend; a swatch's name is there for screen readers, and an out-of-stock choice says so and is disabled.
- Sale prices are read "Now £18.00, was £24.00"; "Sold out" is the button's words, not a colour.
- The rating is read "4.9 out of 5".

## Design

Base theme → Kit sections, `Section / product page` (`c_product_page`) and its mobile state.
