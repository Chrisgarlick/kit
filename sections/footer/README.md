---
title: Footer
group: sections
order: 90
tier: 1
pattern: Website section
status: preview
summary: The bottom of every page, on a dark band. The brand and a line about it, up to three columns of links, contact details, social links and the small print.
---

## Usage

```blade
<x-kit-section-footer :content="$footer" />
```

```php
echo kit_section(__DIR__ . '/kit/footer.php', ['content' => $footer]);
```

| Field | Type | Notes |
|---|---|---|
| `brand_name` | text, required | Bound to the site's name. |
| `logo` | image | One that reads on the dark band. |
| `blurb` | textarea | One line on what you do and where. |
| `columns` | list (up to 3) | `heading`, and `links` (`label`, `url`). |
| `contact_heading` | text | "Get in touch" by default. |
| `phone`, `email` | text | Linked with `tel:` and `mailto:`. Bound to the site's details. |
| `social` | list (up to 5) | `network` (Instagram, Facebook, LinkedIn, TikTok, YouTube) and `url`. |
| `small_print` | text | The legal name, company number and registered office. UK companies must show these. |
| `legal` | list (up to 4) | Privacy, terms, cookies. |

The band's colours are the `--kit-inverse-*` tokens: dark in light mode, the surface colour in dark mode.

## Layout

The columns wrap by the section's own width; below 40rem they sit two by two under the brand.

## Accessibility

- Each link column is a `<nav>` named by its heading.
- Social links are icons with an `aria-label` naming the network.
- Text on the band meets 4.5:1 in both modes.

## Design

Base theme → Kit sections, `Section / footer` (`c_footer`) and its mobile state.
