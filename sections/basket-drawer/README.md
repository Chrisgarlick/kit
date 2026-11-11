---
title: Basket
group: sections
order: 130
tier: 1
pattern: Website section
uses: [dialog, drawer, button, progress-bar, text-field, link]
status: preview
summary: The basket, with what's in it, quantities you can change, the subtotal and checkout, and how far to free delivery. A drawer from the side, or a page of its own.
---

## Usage

Filled by the shop (WooCommerce's cart, planned), not typed in: on WordPress the block is hidden
from the inserter.

```blade
<x-kit-section-basket-drawer :content="$basket" />                 {{-- the drawer and its button --}}
<x-kit-section-basket-drawer :content="$basket" variant="page" />  {{-- the basket page --}}
```

| Field | Type | Notes |
|---|---|---|
| `title` | text | "Your basket", with the count after it. |
| `items` | list | `name`, `url`, `image`, `options` ("Natural · M"), `price`, `quantity`. |
| `delivery_text`, `delivery_progress` | rich text, 0 to 100 | "You're **£11.01** away from free delivery" over a progress bar. |
| `subtotal`, `note` | | |
| `checkout_label`, `checkout_url`, `continue_label`, `continue_url` | | |
| `update_url` | url | Quantities post here as `quantity[<n>]`, with an Update button. |
| `empty_text` | text | Shown with no items. |
| `button_label` | text | The drawer's own button. |

## Behaviour without script

- The drawer is kit's drawer, a `<dialog>` opened by its button with the browser's own `command="show-modal"`; Escape and a click outside close it. Browsers without command buttons need kit's small polyfill.
- Quantities are number boxes in a form with an Update button. Setting one to 0 removes the item.

## Accessibility

- The drawer is a modal dialog named by its heading: focus moves in, Escape closes it, focus goes back to the button.
- Each quantity box is labelled with its product's name; the progress bar says what it's towards.

## Design

Base theme → Kit sections, `Basket drawer` (`c_basket`) and its full-width mobile state.
