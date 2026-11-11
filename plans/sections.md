# kit sections: website sections for client sites

**Status (11 November 2026): phase 1 under way.** Built: the template compiler, the schema
format, the PHP runtime, `kit section check|compile|export`, the section tokens, and **header,
hero and footer** with demos on the docs site (the Sections group). Still to do in phase 1: the
cg-cms block type and the WordPress `block.json` generators, and the screenshot comparison with
Design. Designed in Design, in Base theme → Kit sections (file `aaca632a61d340b1a735f13a5c1abce7`): 22
sections and about 35 components, each with a desktop layout and a mobile state, plus
Steep-styled versions in chrisgarlick.com redesign: win clients
(`38bc0169c69841d6a7a0ab1e4bef2e5b`, the "Kit · Steep / …" components). Owner: kit,
with starter themes in cg-cms and a WordPress base theme. Background and the wider plan:
`~/dev/board/site-infrastructure.md`.

## Why

Client sites are PHP: cg-cms (Laravel) or WordPress, with Shopify only when a client needs it.
Every one of them is assembled from the same handful of sections (a header, a hero, a split, a
grid of cards, a call to action, a footer, and for shops a product grid, product page and
basket). Building those once, in kit, means:

- a new client site is mostly choosing sections and writing content, not writing CSS;
- every site gets the same accessibility, performance and security floor kit already enforces;
- a client's brand restyles everything through `kit brand` (Clients `brand.yaml` → `--kit-*`
  tokens), and a style guide (Steep, Brutalist) is a preset on top, not a fork;
- the owner can edit their content in the CMS (WordPress blocks, cg-cms blocks), which is what
  they get from Wix and Squarespace today and must keep getting.

## What gets built

The Design file is the visual source of truth. Each Design component becomes one kit section
(or a part used by sections). Names here are kit's; Design's ids are in brackets.

### Content sections

| kit section | From Design | Variants / states | Reuses from kit | Tier |
|---|---|---|---|---|
| `header` | Section / header (`c_nav`) | mobile, menu-open | `button`, `link` | 1 + small tier 2 for the menu toggle |
| `hero` | Section / hero (`c_hero`) | default (split), centred, mobile | `button` | 1 |
| `hero-collage` | Section / hero, collage (`c_hero_collage`) | mobile (floating cards hidden) | `progress-ring` for the score card, `stat-tile` | 1 |
| `trust-strip` | Section / trust strip (`c_trust`) | mobile | | 1 |
| `section-grid` | Section / with grid (`c_section_grid`) | default, centred, 2/3/4 columns, mobile | `grid`, `link` | 1 |
| `split` | Layout / split 50/50 (`c_split`) | surface, top, mobile, surface-mobile | the existing `split` layout primitive | 1 |
| `text-block` | Text block (`c_text_block`) | centred, checklist on/off, mobile | `link`, `button` | 1 |
| `stats` | Section / stats (`c_stats`) | mobile (two columns) | `stat-tile` | 1 |
| `quote-stats` | Section / quote + stats (`c_quote_stats`) | mobile | `stat-tile` | 1 |
| `process` | Section / process (`c_process`) | mobile (example cards hidden) | `steps` | 1 |
| `pill-row` | Section / pill row (`c_pills`) | mobile | `badge` | 1 |
| `faq` | FAQ item (`c_faq_item`) inside a split | open, closed | `accordion` | 1 (native `<details>`) |
| `cta` | Section / call to action (`c_cta`) | mobile | `button` | 1 |
| `contact` | Contact form + Contact details (`c_contact_form`, `c_contact_details`) | mobile | `text-field`, `button` | 1 |
| `footer` | Section / footer (`c_footer`) | mobile | `link` | 1 |

### Cards and parts (used inside sections)

`service-card` (optional proof chip), `review-card`, `price-card` (featured), `post-card` (media
badge), `note-card`, `floating-card` (stat, score, photo, input), `score-ring` (kit's
`progress-ring`), `image-placeholder` (demos only). Each is a kit card variant where it can be:
the existing `card` component already has the whole-card link pattern.

### Shop sections

| kit section | From Design | States | Reuses | Tier |
|---|---|---|---|---|
| `announcement-bar` | `c_announce` | mobile | `banner` | 1 |
| `product-card` | `c_product_card` | sale, sold-out, hover (quick add), focus | `card`, `badge` | 1 |
| `product-grid` | `c_shop_grid` | mobile (two columns) | `breadcrumbs`, `select`, `pagination` | 1 |
| `product-page` | `c_product_page` | mobile | `breadcrumbs`, `radio-group` (options), `number-stepper`, `accordion` | 1 + tier 2 for the gallery |
| `basket-drawer` | `c_basket` | mobile (full width) | `drawer`, `number-stepper`, `progress-bar` | 2 (it is a drawer) |

The shop sections are markup and styling. The commerce behind them comes from WooCommerce
(template overrides that output kit's markup) or, later, cg-cms commerce (Stripe Checkout, see
the infrastructure plan). kit never handles payments.

## How a section is made

### Files

A new top-level `sections/` folder beside `components/`, one folder per section, following the
component folder format so the site, the registry and the tests pick them up the same way:

```
sections/
  hero/
    README.md        # front matter: title, group: sections, order, tier, status, summary
    hero.css         # the section's styles, on --kit-* tokens only
    hero.blade.php   # the one template, in kit's Blade subset (see below)
    hero.php         # compiled from it by kit: plain PHP, never edited by hand
    hero.schema.json # the content fields: what the CMS edits
    demo.json        # example content, each at full or phone width: the docs site renders it
```

What phase 1 settled while building it:

- **Three renderers, one output.** kit renders a template in Go (the docs site, the checks),
  compiles it to PHP, and the Blade source runs in Blade. `go test ./internal/sections` renders
  every demo and a corpus of edge cases (whitespace around every directive, XSS payloads, invalid
  UTF-8, PHP truthiness) all three ways and fails on a byte of difference. The Blade leg uses
  illuminate/view on its own (`tests/blade`, `composer install` there).
- **Rich text is plain text with marks**, not HTML: `*em*`, `**strong**` and line breaks. It's
  escaped first and the marks become tags after, so content can never carry markup. Links inside
  rich text wait until a section needs them.
- **Helpers:** `kit_e`, `kit_url`, `kit_tel`, `kit_mailto`, `kit_rich`, `kit_classes`, and
  `kit_section($file, $props)` to render a compiled section. Templates can call only these,
  `count`, `empty` and `isset`; `==`, raw output, `@php`, `@include` and `<?php` are compile errors.
- **Content is filled before rendering:** every field is present (at its default if left out),
  so templates read fields directly and a missing key is a bug, not a silent blank. The CMS side
  fills from the schema the same way.
- **Responsive by container queries:** each section is a size container, so it lays out by its
  own width, the same in a page, a CMS preview or a 390px demo frame.
- **Section tokens:** `--kit-section-pad-y`, `--kit-display-case`, `--kit-card-radius` and the
  `--kit-inverse-*` band colours (the footer). Section CSS stays out of `kit dist` unless listed.

### One template, Blade or PHP (decided 11 November 2026)

Each section is written **once, in a small subset of Blade** (`hero.blade.php`): `{{ }}`,
`@if`/`@elseif`/`@else`, `@foreach`, `@isset`, `@props`, `@class`, and nested `<x-kit-…>`
sections and parts. No `{!! !!}`, no `@php`, no `@include` outside kit. `kit` compiles that
subset to **plain PHP** (`hero.php`) that needs only kit's escaping helpers, and a project takes
whichever it needs:

```
kit add section hero --target blade   # Laravel, cg-cms, WordPress with Blade (Acorn)
kit add section hero --target php     # WordPress or any PHP without Blade
```

- **cg-cms (Laravel):** the Blade file is a normal anonymous component
  (`<x-kit-section-hero :content="$block" />`), and the section is a block type in cg-cms's
  block canvas, its fields from `hero.schema.json`.
- **WordPress:** a block generated from the same schema (see `plans/wordpress.md`), rendered by
  the compiled PHP template, or the Blade one in a theme that has Blade. The owner edits sections
  as blocks in the editor; whole pages are block patterns.

A test renders every section in Go, as the compiled PHP and with real Blade, and fails if the
HTML differs, so the compiled PHP can never drift from the Blade source. The compiled
`<name>.php` is committed; `kit section compile` rewrites it and a test fails when it's stale.

The schema is the single description of a section's content (eyebrow, title, lede, items,
images, actions), so the two CMSs can't drift apart, and a future importer (Scout's Wix and
Squarespace migration) has one target format. The schema format itself is specified in
`plans/wordpress.md`, since the WordPress plugin is its first full consumer.

### Security

kit's rules apply to templates as they do to components: every value is escaped for its context
(`kit_e()` for text and attributes alike, `kit_url()` which allows only http, https, mailto, tel
and on-site addresses); rich text (a heading with emphasis, a review) is plain text with marks,
escaped before the marks become `em`, `strong` and `br`. No section prints raw HTML from content:
the template language has no way to. The XSS corpus runs through all three renderers.

### Responsive

The Design file's mobile state is the spec for each section's narrow layout. Sections use
container queries where the section can sit in different widths (cards, split, grid), and the
breakpoints Design uses (390 phone, 834 tablet, 1440 desktop) for page-level changes (the
header). Tablet isn't designed yet; at 834 a section uses its desktop layout unless that breaks,
and the breaks get a tablet state in Design first.

### Theming: brand, then style guide

1. **Brand:** `kit brand` turns a client's Clients brand into `--kit-*` tokens, as it does for
   kit's own site themes. Sections use only tokens, never colours or fonts of their own.
2. **Style guide:** Steep and Brutalist (Hub library styles) become **presets**: a small set of
   section-level custom properties on top of the brand (`--kit-display-case: uppercase`,
   `--kit-display-weight`, `--kit-button-radius`, `--kit-card-radius`, `--kit-section-pad`,
   shadows on or off). A client site picks a preset in `kit.yaml`, the way site themes record
   their deliberate choices today.

New section tokens (phase 1): `--kit-container` (1200px content width), `--kit-section-pad-y`
and `-x` (desktop and mobile), `--kit-display-case`, `--kit-card-radius`, `--kit-button-radius`.

### Accessibility

Each section's README carries its contract, as components' do. The ones that matter most:

- one `<h1>` per page, in the hero; every section's heading level is a field (default `h2`);
- the header's menu is a real button with `aria-expanded` and `aria-controls`; the open menu
  traps nothing and closes on Escape;
- every image needs alt text or an explicit "decorative" choice; the schema enforces it;
- the FAQ is `<details>`/`<summary>`; the basket is kit's `drawer` (focus moves in, Escape
  closes, focus returns);
- product options are radio groups with visible labels; colour swatches have text names;
  "sale" and "sold out" are text, not colour alone;
- forms use kit's `text-field` (labels, errors linked with `aria-describedby`).

### Performance

- each section's CSS loads only on pages that use it (kit's per-page loading, spec section 17.3);
- images: `srcset` and `sizes`, `width`/`height` or `aspect-ratio` so nothing shifts, the hero
  image `fetchpriority="high"`, everything below the fold lazy;
- no JavaScript in tier 1 sections; the menu toggle, gallery and basket are small tier 2 pieces.

## Phases

| Phase | Scope | Done when |
|---|---|---|
| 1. Foundation | `sections/` folder in the registry and the docs site; the section tokens; `kit_e`/`kit_attr`/`kit_url` and the rich-text allowlist; schema → WordPress `block.json` and → cg-cms block type generators; the demo harness at 390 and 1440; **header, hero and footer** end to end | The same three sections render from one template in a cg-cms page and as WordPress blocks, match the Design renders at both widths, pass axe and the XSS corpus |
| 2. Content sections | `split`, `text-block`, `section-grid` and the cards, `trust-strip`, `stats`, `cta`, `faq`, `contact`, `pill-row`, `quote-stats`, `process`, `hero-collage` | A full brochure homepage (the Kit sections showcase) builds from blocks in both CMSs |
| 3. Shop | `announcement-bar`, `product-card`, `product-grid`, `product-page`, `basket-drawer`; WooCommerce template overrides that output them | A WooCommerce test shop uses kit sections for its shop, product and basket pages |
| 4. Presets and brands | Steep and Brutalist presets; a client's Clients brand → `kit brand` → theme in a site | The chrisgarlick.com homepage renders in both presets from the same content, matching the Design comparison artboard |
| 5. Starters | The WordPress base theme (wp-vite-plugin, the blocks, patterns for home, services, about, contact and shop pages) and the cg-cms starter theme with the same pages | A new client site starts from either starter with no code written, only content and a brand |

Visual parity with Design is checked by screenshot: the docs site's demo of each section,
captured at 390 and 1440 in the base theme, beside Design's render of the same component.

## Open decisions

Decided 11 November 2026:

- **Class names:** `kit-` like everything in kit. A section's root is `kit-section-<name>`
  (`kit-section-hero`, `kit-section-split`: kit already has `split` and `card` components), its
  parts `kit-<name>-<part>` (`kit-hero-title`), like components today.
- **Templates:** a Blade subset compiled to plain PHP; projects take either (above).
- **WordPress editing:** native blocks generated from each section's schema by a kit plugin, not
  ACF. The plan for WordPress built on that is `plans/wordpress.md`.

Still open:

1. **Where presets live.** In kit (`presets/steep.css`), or generated from the Hub library's
   DESIGN.md files by `kit brand`. Start with hand-written presets; generate later if more
   styles arrive.
2. **Tablet.** Design a tablet state for the sections that need one (header, product page,
   collage hero) before phase 2, or let them fall back to desktop or mobile.
3. **Images.** cg-cms media presets and WordPress image sizes need one agreed set of widths per
   section (hero, card, gallery) so `srcset` is the same in both.
