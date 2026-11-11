# WordPress on kit: the schema plugin, the base theme and the plugin suite

**Status (11 November 2026): planned, nothing built.** Builds on `plans/sections.md` (the
sections, their Blade-subset templates and their schemas). Owner: kit for the schema format and
the generators; the WordPress plugins and theme live in their own repositories. Background:
`~/dev/board/site-infrastructure.md`.

## Why

Client sites on WordPress should be built the same way every time, from kit's sections, with the
owner editing their own pages in the normal block editor. Today that means either hand-writing
React for every block or relying on ACF. Instead, one plugin reads each section's **schema** and
does the rest: registers the block, builds its editing form, renders it with the section's
template, and keeps site-wide details (phone, address, opening hours, socials) in one place.

The schema is the foundation everything else stands on: the WordPress blocks, cg-cms's block
types, Scout's future Wix and Squarespace importer, and the docs site's demos all read it. So it
is specified first, carefully, and versioned.

## What gets built

| Piece | What it is | Repository |
|---|---|---|
| **Schema format** | The description of a section's content, its validation and its versions | kit (`schema/`, with the Go validator in `internal/schema`) |
| **kit Blocks** (plugin) | Blocks from schemas: registration, the generated editor form, server-side rendering, the Blade or PHP runtime, migrations | `~/dev/wp-base/plugins/kit-blocks` |
| **kit Fields** (plugin, later) | Site settings and custom fields from the same schema format, bound into blocks | `~/dev/wp-base/plugins`, a second plugin beside it |
| **kit Theme** (base theme) | A block theme: brand → `theme.json`, header and footer template parts, page patterns, WooCommerce templates, asset loading | `~/dev/wp-base/themes/kit-base` |
| **Plugin set** | The small, vetted third-party list every site gets | documented in the theme's README |

## 1. The schema format

A section's schema is JSON next to its template (`sections/hero/hero.schema.json`):

```json
{
  "$schema": "https://ui.chrisgarlick.com/schema/section/1.json",
  "name": "hero",
  "title": "Hero",
  "version": 1,
  "category": "kit-sections",
  "description": "The first thing on a page: a promise, a line of detail, actions and an image.",
  "variants": { "default": "Split, image beside the text", "centred": "Centred, image below" },
  "fields": {
    "eyebrow": { "type": "text", "label": "Label above the heading", "max": 60 },
    "title":   { "type": "rich-text", "label": "Heading", "required": true, "max": 120 },
    "lede":    { "type": "textarea", "label": "Supporting line", "max": 240 },
    "actions": { "type": "list", "label": "Buttons", "max": 2, "item": {
      "label":   { "type": "text", "required": true, "max": 40 },
      "url":     { "type": "url", "required": true },
      "style":   { "type": "enum", "options": ["primary", "secondary"], "default": "primary" }
    }},
    "image":   { "type": "image", "label": "Image", "alt": "required", "sizes": "hero" },
    "proof":   { "type": "text", "label": "Proof line", "max": 80, "bind": "site.review_summary" },
    "heading_level": { "type": "heading-level", "default": 1 }
  },
  "children": null
}
```

Field types, and how each is edited and rendered:

| Type | Edited as | Stored as | Rendered with |
|---|---|---|---|
| `text`, `textarea` | text input, textarea | string | `kit_e()` |
| `rich-text` | inline rich text with italic, bold and line breaks | plain text with `*em*`, `**strong**` and newlines (never HTML) | `kit_rich()`: escaped, then the marks become tags |
| `number`, `boolean`, `enum` | number field, toggle, select or segmented control | number, bool, string | as is, validated |
| `url` | an address (a page picker later) | string | `kit_url()` |
| `link` (later) | URL, label, "opens in a new tab" | `{url, label, new_tab}` | `kit_url()` |
| `image` | media library picker, alt text (or "decorative" when `alt` is `optional`), focal point later | `{src, alt, width, height}` (the plugin adds `id`) | `srcset`/`sizes` from the named size set |
| `icon` | Lucide picker | name | kit's icon sprite |
| `colour` | a choice of the brand's roles (`accent`, `surface`…), never a hex | role name | token class |
| `heading-level` | 1 to 4 | number | the heading element |
| `list` | repeater with add, remove and reorder, `min`/`max` | array of `item` objects | `@foreach` |
| `reference` | search for a post, page or product | id | the referenced item's fields |

- **`variants`** become the block's style choices (Hero: default or centred). Mobile is not a
  variant: it is CSS.
- **`children`** names the blocks a section may contain, for sections built around a slot
  (`section-grid` takes service, review, price or post cards; `split` takes two columns). Those
  become `InnerBlocks` with `allowedBlocks`, so the owner adds cards as blocks.
- **`bind`** ties a field to a site setting from kit Fields (the phone number in the header,
  the review summary under the hero): the block shows the setting unless the owner overrides it
  there. WordPress's Block Bindings API (6.5+) carries this.
- **`version`** and **migrations:** a schema change that renames or restructures fields bumps
  the version and ships a migration (`migrations/2.json`: rename, move into a list, default).
  The plugin migrates stored content when a block is next edited and registers the old shape as a
  block deprecation, so existing pages never break.

Phase 1 of the sections plan built this format (`internal/sections/schema.go`): the types
`text`, `textarea`, `rich-text`, `number`, `boolean`, `enum`, `url`, `image`, `heading-level` and
`list`; `icon`, `colour`, `link` and `reference` arrive with the sections that need them.

`kit section check` validates every schema in CI (types known, defaults valid, required fields
present in the demo content, every field used by the template and every template variable in the
schema).

## 2. kit Blocks (the plugin)

**Built 11 November 2026, in `~/dev/wp-base`** (one repo for the base setup: `plugins/kit-blocks`
and `themes/kit-base`, run in WordPress Playground with `make serve`). What was built, and where
it differs from the plan below:

- `kit build-wp -out plugins/kit-blocks/build -fixtures tests/fixtures.json` writes each
  section's `block.json`, compiled template, `render.php`, `style.css`, `schema.json` and
  `patterns.json`, plus `kit.php` and `kit.css`.
- A block's content is **one `content` object attribute** shaped by the schema, plus `variant`,
  not one attribute per field: a schema change migrates one value, and the plugin sanitises and
  fills it from the schema on render (mirroring kit's Go fill, checked byte for byte by
  `make test`).
- Variants are a select in the block's sidebar rather than block styles (a style is only a
  class; a variant changes the template's markup).
- The editor is the sidebar form and a server-rendered preview. **Inline editing on the canvas
  is not built yet**; neither are `bind`, migrations or the Blade target via Acorn.
- The theme's header and footer template parts start from the header and footer patterns.
- Tested: the blocks render kit's HTML for every demo, bad content (scripts, `javascript:`
  links, wrong types, too many items) is cleaned, and in Playground an edit in the sidebar is
  saved and shown on the front end, with saving locked while a required field is empty.


### Registration

- On `init`, reads the schemas a site has (shipped by the theme from `kit add`, or in the plugin
  for kit's own sections) and registers one block per section: `kit/hero`, `kit/section-grid`…
- `kit build-wp` (in kit's CLI) generates each `block.json` from the schema at build time, so
  registration at run time is a cached, fast `register_block_type()` per folder. No schema
  parsing on every request.
- Attributes come from the fields; `variants` become block styles; `children` become
  `allowedBlocks`; `category` is a kit block category.

### Editing: one generic editor, no React per block

One shared editor script renders every kit block's form from its schema:

- simple fields (labels, links, images, icons, selects) in the block's **sidebar**;
- the heading, lede and other prominent text **inline on the canvas**, with `RichText` limited to
  the field's marks, so the owner types straight into the page;
- lists as an inline repeater with add, remove and drag to reorder;
- validation as the owner types (required fields, lengths, alt text), with publishing blocked
  for errors and warnings for advice (a missing image alt where decorative isn't allowed).

### Preview and rendering

- **Front end:** `render_callback` runs the section template with the block's (validated,
  migrated) attributes. The compiled PHP template by default; the Blade one when the theme has
  Blade (Acorn), picked by a setting.
- **Editor preview:** the same template rendered server-side (the `ServerSideRender` pattern,
  debounced, cached by attribute hash), so the editor shows exactly what visitors will see.
  Inline-editable text is overlaid on it.
- **Styles:** each block's CSS registered with `wp_enqueue_block_style`, so WordPress only
  loads the CSS for blocks on the page (kit's per-page loading, natively).
- **Scripts:** only the tier 2 pieces (menu toggle, gallery, basket drawer), as script modules,
  loaded only with their blocks.

### Security

- Attributes are validated against the schema on save (REST) and again on render: unknown
  fields dropped, types coerced or rejected, lengths enforced, URLs and rich text through kit's
  helpers. Templates escape everything (sections plan).
- Capabilities: editing kit blocks follows the post's capabilities; settings need
  `manage_options`. Every REST route checks nonces and capabilities.
- No `unfiltered_html` path: even administrators can't put raw HTML in a kit block.

## 3. kit Fields (later, when a client needs it)

Built when a site needs fields beyond sections, from the same schema format:

- **Site settings:** an options page (business name, phone, email, address, opening hours,
  socials, review summary, logo variants) stored as one option, exposed to blocks through
  `bind` and to templates through a helper. This part likely comes first, with the header and
  footer.
- **Custom fields:** field groups on post types (a service's price, a team member's role, a
  case study's results), registered with `register_meta` and `show_in_rest`, edited in a
  sidebar panel generated from the schema, and available to blocks as bindings.
- **Custom post types:** declared in the same format (services, team, case studies,
  testimonials), so a grid section can list them with a `reference` or query field.

This is the "ACF replica" part. It is deliberately second: it's a large, long-lived surface, and
the sections only need the blocks.

## 4. kit Theme (the base theme)

A **block theme** (full site editing), so the header and footer are template parts the owner
can see and edit as blocks.

- **Brand:** `kit brand` writes `theme.json` from the client's Clients brand (palette as the
  brand's roles, the type scale and fonts, spacing, radii) alongside `--kit-*` tokens, so core
  blocks (paragraph, heading, list, image, buttons) match the kit sections. A preset (Steep,
  Brutalist) is a setting in `kit.yaml`.
- **Templates:** front page, page, single post, archive, search, 404, and WooCommerce's shop,
  product, cart and checkout templates. Header and footer template parts use the `kit/header`
  and `kit/footer` blocks.
- **Patterns:** whole pages built from kit blocks (home, services, about, contact, shop) for
  "Add page from pattern", using the Kit sections showcase as their content.
- **A focused editor:** `allowed_block_types_all` keeps the inserter to kit blocks plus the core
  text, list, image, buttons, columns and embed blocks; colour and font pickers limited to the
  brand; the block directory off.
- **Assets:** kit's CSS from kit Blocks (`kit.css` plus each block's own), no build tool in the
  theme, hashed or versioned file names, no external requests.
- **WooCommerce:** template overrides that print kit's `product-card`, `product-grid`,
  `product-page` and `basket-drawer` markup, through WooCommerce's hooks where it has them.
  WooCommerce's own block checkout stays as it is (payments are WooCommerce's and Stripe's).

## 5. The plugin set

Every site gets the same short list, chosen per job, and nothing else without a reason in
writing (each plugin is something Scout will one day flag as out of date):

| Job | Choice (to settle in phase 5) |
|---|---|
| Backups | one backup plugin to off-site storage (part of the care plan) |
| Security | headers, login protection; Sentry for WAF once its banning is in |
| Caching | page cache, or the host's |
| Images | WebP or AVIF conversion and resizing on upload |
| Forms | the contact section posts to a small kit Forms handler, or one forms plugin |
| SEO | titles, descriptions, sitemaps, schema.org |
| Spam | for forms and comments |

## 6. Distribution and updates

- The plugins and theme are private. Updates come from a small update endpoint (or GitHub
  releases) checked with WordPress's update API, signed, so client sites update from the
  dashboard like any plugin.
- `kit add section … --target php` pulls a section into a site's theme; `kit build-wp` writes
  its `block.json` and compiled template. A site's `kit.lock` records versions, as for
  components.

## 7. Testing

- **Schemas:** `kit section check` in CI (above).
- **Rendering:** PHPUnit renders every section with its demo content and with the XSS corpus,
  through both template targets, asserting identical HTML and no unescaped output.
- **Editor:** Playwright drives the block editor (WordPress Playground or a Docker site):
  insert each block, fill every field, save, reload, and check the front end matches the editor
  preview; migrations tested by loading content saved under the previous schema version.
- **Accessibility and visuals:** axe on every block's front end; screenshots at 390 and 1440
  beside Design's renders, as in the sections plan.

## Phases

| Phase | Scope | Done when |
|---|---|---|
| 1. Schema | The format, its JSON Schema, `kit section check`, schemas for header, hero and footer (built, but for the published JSON Schema) | The three schemas validate, and a change that breaks one fails CI |
| 2. Blocks | kit Blocks: registration from `block.json`, the generic editor (sidebar, inline text, lists), server-side render with the compiled PHP template, per-block CSS | An owner builds a page from header, hero and footer blocks in the editor, and it renders identically on the front end |
| 3. Theme | kit Theme: `theme.json` from `kit brand`, header and footer template parts, a focused editor; the content sections from phase 2 of the sections plan as blocks, with `children` and patterns | A full brochure site (the Kit sections showcase) is built from patterns and blocks in a fresh install |
| 4. Settings and bindings | kit Fields' site settings and `bind`; the Blade target via Acorn as an option | Changing the phone number once updates the header, footer and contact section |
| 5. Shop and plugin set | WooCommerce templates with kit's shop sections; the plugin set settled and documented; signed updates | A WooCommerce test shop runs on kit Theme, and a client site updates its plugins from the dashboard |
| 6. Custom fields | Field groups, post types and query or reference fields | A services post type with its own fields feeds a section grid |

## Open decisions

1. **Block theme or hybrid.** A block theme gives the owner header and footer editing; a
   hybrid (classic templates with blocks in the content) is simpler to lock down. The plan
   assumes a block theme.
2. **Inline editing depth.** Prominent text inline on the canvas over a server-rendered
   preview is the plan; full client-side rendering of each section in the editor would be
   smoother but means a JavaScript copy of every template. Start server-side.
3. **Names.** "kit Blocks", "kit Fields", "kit Theme" are working names.
4. **Forms.** A small kit Forms handler (spam protection, email, stored submissions, like
   cg-cms's) or one forms plugin.
5. **Update hosting.** A tiny update server on the droplet, or GitHub releases with a token.
6. **Minimum WordPress version.** 6.5 or later (Block Bindings, script modules, the
   Interactivity API if the tier 2 pieces use it).
