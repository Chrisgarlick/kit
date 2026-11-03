# Kit: review, implementation plan and build choices

Companion to [spec.md](spec.md) (draft v0.1). Written 2 November 2026.

> **Status (3 November 2026):** the repo is public at [Chrisgarlick/kit](https://github.com/Chrisgarlick/kit) under MIT. Built so far, ahead of the core runtime, because you chose the design system and site first:
> - the design tokens (light, dark, four accents, compact density) and the three typefaces, self-hosted;
> - twenty-three tier 1 components across layout, actions, inputs, feedback, navigation and data display;
> - `kit site build` and `kit site serve` (Go), which assemble the site from the component folders.
>
> - the core runtime (3 November), with `<kit-segmented>` as its first component, and browser tests for both.
>
> - CI on GitHub Actions (3 November): Go lint, tests and a site build, and the browser tests in Chromium, Firefox and WebKit;
> - [ui.chrisgarlick.com](https://ui.chrisgarlick.com) is live (3 November), deployed with `kit site deploy`.
>
> Next: the screen-reader pass (VoiceOver) across the interactive components, then adoption in an app. Progress is noted under each phase below.

The aim, in your words: one UI library that everything you build uses (Kritano's app and sites, chrisgarlick.com, future apps), shown off on **ui.chrisgarlick.com** as a fully interactive site. Premium, sleek and beautiful; very light and very fast; and good enough for **data analysis** (dense tables, charts, dashboards), not just forms and buttons.

This document has four parts:

1. A deeper review of the spec (what to change before writing code)
2. Go vs Rust (and where each would actually run)
3. How ui.chrisgarlick.com is built and hosted on a small server
4. The implementation plan, phase by phase, with "done when" for each

---

## 1. Review of the spec

The spec is strong: the three tiers, the security rules, the async table, the accessibility chapter and the definition of done are the right foundations, and the copy-in model suits a library you'll use across several stacks. What follows is what I'd change before phase 1, ordered by how much it matters.

### 1.1 The data-analysis goal isn't in the spec yet

The spec is written for app chrome (buttons, dialogs, tabs). Data analysis needs things the core can't do today:

| Need | Gap in the spec | Change |
|---|---|---|
| Charts are SVG | Templates parse in an HTML `<template>`, so an SVG fragment returned on its own (`<path>`, `<g>`) is created in the HTML namespace and doesn't render | Add an `svg` tag alongside `html` (parse inside `<svg>`, unwrap) |
| Bar widths, positions, colours driven by data | `style` bindings are blocked, and the spec says "use custom properties", but there's no safe way to set one per element from a template | Add a `styleMap`-style directive that only calls `el.style.setProperty('--x', value)` through the CSSOM (CSP-safe, no CSS parsing of user input). Allow `--*` names only |
| Tables with 10,000+ rows | Arrays re-render fully; keyed `repeat()` is phase 2 | Keyed `repeat()` moves to the core in phase 1. The data grid doesn't use the template renderer per cell at all: it recycles a fixed pool of row elements (virtualisation) |
| Export (CSV, PNG) | `safeUrl` turns `blob:` URLs into `#` | Allow same-origin `blob:` for `href` and `download` |
| Heavy work (grouping 1M rows) | Nothing on workers | A small worker helper: transferable typed arrays, latest-wins via `run()` |
| Scroll performance | `@` bindings can't take listener options | Support `@scroll.passive`, `@touchstart.passive` (and `.capture`, `.once`) |
| Numbers and dates | Not covered | `Intl.NumberFormat` / `DateTimeFormat` wrappers with tabular figures; locale from `<html lang>` |
| Density | Not covered | A `--kit-density` token (comfortable, compact) that every component respects; data UIs default to compact |

### 1.2 Bugs and holes in the reference code

1. **`.innerHTML=${value}` is allowed.** Property bindings block `on*`, `style` and `srcdoc`, but not `innerHTML`, `outerHTML` or `innerText` on script-like elements. That breaks the promise that the easy path can't produce XSS. Block `innerHTML` and `outerHTML` in both forms, and add them to the XSS corpus.
2. **The "inside a tag" detection is a heuristic, and it breaks on ordinary markup** (`title="a > b"`). The spec lists it as a known limit, but it's too common to leave. Replace it with a small scanner over the static strings (text, tag, attribute-name, quoted value), as lit-html does.
3. **The base class is called `Element`**, which shadows the browser's `Element` in every module that imports it (`instanceof Element` breaks, and it reads badly). Call it `KitElement`.
4. **Default values are never reflected.** Reflection runs only for changed properties, so `variant: 'primary', reflect: true` never appears as an attribute, and `:host([variant=primary])` CSS never matches until someone sets it. Reflect reflected defaults on the first update.
5. **`announce()` breaks inside modal dialogs.** `showModal()` makes everything outside the dialog inert, including the live region appended to `<body>`, so announcements made while a dialog is open aren't read. Keep a live region inside each open dialog (the dialog component owns one), and fall back to the body region otherwise.
6. **One live region switches between polite and assertive.** Screen readers don't reliably notice a politeness change on an existing region. Use two fixed regions.
7. **The loader can't see inside shadow roots.** A dialog that renders a `kit-button` in its shadow root never gets it loaded. Components import their own dependencies statically (the registry's `dependsOn` already says what they are); the loader is for top-level tags only.
8. **Implicit form submission doesn't work.** Pressing Enter in a field won't submit through a `kit-button type="submit"`, because the browser doesn't treat a custom element as a submit button. Either render a hidden native submit button in light DOM, or document it as a known limit.
9. **The ~50-cycle guard for state set in `updated()`** is described but not implemented.
10. **Two kit versions on one page** (two WordPress plugins with their own copies) silently keep whichever registered first. The configurable prefix fixes it; `define()` should say which version won.
11. **`kit diff` can't merge.** `kit.lock` stores hashes, not the files the copy started from, so a three-way merge of upstream changes into local edits isn't possible. Cache the base version's files (`.kit/base/<version>/`).
12. **The 4 KB core budget won't survive** `svg`, keyed `repeat()`, `styleMap`, listener options and the dev checks. Budget 6 KB gzipped for the core (still far below Lit's ~6–7 KB plus directives), with dev-only checks stripped from the production build.

### 1.3 Things the spec doesn't decide

- **Browser support.** Decided 3 November: as wide as possible. The floor is Safari and iOS 16.4, Chrome and Edge 111, and Firefox 115 ESR, tested in Playwright's Chromium, Firefox and WebKit. Newer APIs get fallbacks (see phase 0).
- **Theming per app.** One kit, several brands. Kit ships the mechanism and a neutral default, and each app brings its own theme: a file in the app's repo that overrides the `--kit-*` tokens, in light and dark (decided 3 November).
- **Colour.** Define the palette in OKLCH; the Go CLI converts to sRGB to check contrast. (`light-dark()` was proposed here but is newer than the browser floor, so dark values stay declared separately.)
- **Positioning** (menus, popovers, tooltips, date pickers). CSS anchor positioning where supported; a ~1.5 KB fallback for the rest. Popover API for the top layer.
- **Icons.** One SVG sprite of the icons the kit and your apps use (a subset of an ISC/MIT set such as Lucide), with `aria-hidden` by default.
- **Versioning.** Semver for the kit; parts, custom properties and events are public API (the spec already says so); a deprecation note lasts one minor version.
- **Licence and name.** Needed before the registry is public. Placeholder `kit` throughout this document.
- **Chart accessibility.** Charts need their own section: every chart ships a visually hidden data table (or a "Show as table" toggle), a text summary, and keyboard navigation between points. Colour palettes for series must pass 3:1 against the background and stay distinguishable for colour-blind users (patterns or labels, not colour alone).
- **Print.** Data reports get printed. Tier 1 CSS includes print styles (no shadows, dark-on-white, full tables).

---

## 2. Go or Rust?

### 2.1 Where code actually runs

| Place | Language | Why |
|---|---|---|
| The browser: every component | **Plain JavaScript** (ES modules, JSDoc types) | Smallest download, no build step for consumers, best INP and LCP. Rust or Go UI frameworks compiled to WebAssembly (Leptos, Yew, Go's wasm) cost 100 KB to 2 MB before the first component, which is the opposite of the goal |
| The browser: heavy number-crunching (optional, later) | **Rust → WebAssembly**, loaded only when needed | If profiling ever shows JavaScript plus workers isn't enough (very large group-bys, statistics on millions of rows), Rust produces small, fast WASM (tens of KB) with SIMD. Go's WASM is ~2 MB; TinyGo is smaller but slower and patchy |
| Tooling: CLI, build, registry, site generator, dev server | **Go** | See below |
| Browser tests | **Playwright** (Node) | Real Chromium, Firefox and WebKit. You already run it in cms and Kritano |

### 2.2 Why Go for the tooling

- **It's your stack.** cms and Kritano are Go, with the same lint, test and release habits. One toolchain to keep up to date, on a Mac with little disk to spare.
- **esbuild is written in Go and works as a library.** The CLI can minify and bundle JavaScript and CSS in-process (`github.com/evanw/esbuild/pkg/api`), with no Node in the build. It's the fastest bundler there is.
- **The other tools are in Go's standard library or close to it:** gzip sizes (stdlib), Brotli sizes (a pure-Go package), SHA-256 hashing, signing (minisign has a Go library), templates for the site (`html/template`, contextual escaping), a dev server with live reload (`net/http`), and embedding (`//go:embed`).
- **A single static binary** for `kit init`, `kit add`, `kit verify` and `kit diff`, cross-compiled for Mac and Linux.
- **Dogfooding Kritano.** Kritano's audit engine is Go with Chromium. CI can audit every page of ui.chrisgarlick.com with it (accessibility, security headers, performance) alongside axe.

### 2.3 What Rust would buy you, and why it isn't worth it for the tooling

Rust has the best CSS tooling (Lightning CSS) and the oxc parser/minifier, and its binaries are a little smaller. None of that outweighs a second language for a one-person project: esbuild's CSS minifier is good enough for hand-written token CSS, and if Lightning CSS's syntax lowering is ever needed, the Go CLI can call its binary.

**Recommendation:** Go for everything outside the browser; plain JavaScript inside it; Rust only as an optional, lazily loaded WASM module for heavy data work, decided by benchmarks in phase 6, not up front.

---

## 3. ui.chrisgarlick.com on a small server

ui.chrisgarlick.com shares a small server with other sites, so it adds **no process at all**:

- **Fully static.** `kit site build` (Go) generates every page, demo and the registry into `dist/` on your Mac or in CI. The server only stores files.
- **Served by the nginx that's already there**, as one more server block: `gzip_static` with pre-compressed `.gz` files (that nginx has no Brotli module), hashed filenames cached for a year, HTML revalidated. Memory cost: effectively zero.
- **Interactivity is all client-side**: live demos, props controls, theme switching, the playground and the dashboards run in the browser. Heavy pages (the code editor in the playground, big datasets) load their modules only on those pages.
- **Deploy** with `kit site deploy`: rsync to a new release folder, then switch a symlink (atomic, instant rollback). No database, no PHP, no Docker.
- **The site is also the registry.** `ui.chrisgarlick.com/r/registry.json` (signed) plus each file at a hashed URL, so `kit add` installs from the same place people browse.
- **Optional later:** put Cloudflare in front for a global edge cache. Not needed for the traffic you'll have.

### What makes it premium

Light and fast is the foundation, but "premium" is mostly craft in the design system:

- **Typography:** one distinctive variable sans for UI, a mono for code and figures, tabular numbers everywhere data appears, a modular type scale, and optical sizing.
- **Colour:** OKLCH scales with perceptually even steps, a dark mode designed in its own right rather than inverted, and restrained accent use.
- **Depth:** layered, soft shadows and 1 px alpha borders, as on the Kritano redesign; elevation as tokens.
- **Motion:** short, purposeful transitions with designed easing curves (CSS `linear()` springs), View Transitions on the site, and everything off under `prefers-reduced-motion`.
- **Detail:** focus rings that look designed, not default; hover and press states on everything; skeletons that match final sizes; empty states and error states as first-class components.
- **Density:** comfortable for marketing and forms, compact for data. Dashboards look calm even when packed.

### Site map

One page per component group, so each page keeps growing as components are added:

| Page | Holds |
|---|---|
| `/` | A showcase of live components, the principles, and links into each group |
| `/foundations` | Colour, type, spacing, elevation, motion, density, icons and themes, with the live theme controls |
| `/actions` | Buttons, segmented controls, button groups, … |
| `/inputs` | Text fields, select, combobox, checkbox, radio, switch, slider, stepper, tags, file drop, date picker, … |
| `/feedback` | Alerts, toasts, progress, score rings, skeletons, empty states, … |
| `/overlays` | Dialog, drawer, menu, popover, tooltip, command palette, … |
| `/navigation` | Tabs, breadcrumbs, pagination, steps, accordion, sidebar, … |
| `/data-display` | Stat tiles, data table, badges, avatars, timeline, details, code, … |
| `/charts` | Line, area, bar, donut, heatmap, scatter, histogram, sparkline, … |
| `/patterns` | Whole compositions: a dashboard, a settings page, a sign-in, an empty app |
| `/playground` | Edit a snippet, see it live |
| `/get-started` | The CLI, the copy-in model, setup for Go, Laravel and WordPress, and the changelog |

**How pages grow.** Each component is a folder (`components/<name>/`) holding its code, a `README.md` and a `demo.html`, and its `README` front matter names its group (`group: actions`). `kit site build` assembles every group page from those folders: adding a component means adding a folder, and it appears on its group page, in the sidebar and in search, with no page to edit. Each component also gets its own deep page (`/actions/button`): the live demo, props controls, code tabs per backend, the accessibility contract, the keyboard table and the extension points.

**Placeholder data, not Kritano's.** Demos use one neutral, invented world, so the library reads as general-purpose: literal placeholder text ("Title", "Option one", "Supporting text"), with no invented company, people or records, and only `example.com` domains, so real products never appear and nothing reads as a real customer. Kritano, chrisgarlick.com and other apps show their own data when they adopt kit.

---

## 4. Implementation plan

Each phase ends in something usable, and each has the spec's definition of done as its quality gate. Rough sizes are relative (S, M, L, XL), not dates.

### Phase 0: decisions (S)

Make the calls the spec leaves open, so nothing is rebuilt later:

- name, tag prefix and licence
- repo: its own repo (recommended: `~/dev/kit`, `Chrisgarlick/kit`), not inside cms
- browser support matrix (1.3)
- shadow DOM default: shadow for self-contained widgets, light DOM for form controls (as the spec leans)
- loading default per backend: server-emitted tags for Go and Laravel; the loader for WordPress
- typefaces and the first two brand themes
- fold the review (part 1) into the spec as v0.2

**Done when** the spec is v0.2 with every open decision answered.

**Decided (2–3 November 2026):**
- name `kit`, MIT licence, its own public repo (`~/dev/kit`, [Chrisgarlick/kit](https://github.com/Chrisgarlick/kit));
- Go for tooling, plain JavaScript in the browser, Rust only if phase 5's benchmarks demand it;
- typefaces: Bricolage Grotesque (display), Instrument Sans (interface) and Geist Mono (figures, code and labels), self-hosted under the SIL OFL;
- the look: graphite neutrals with a spruce-teal accent, from the component catalogue (`design/components.html`);
- order: the design system and the site first, then the core, then the data components;
- tag prefix `kit-` (3 November);
- browser support as wide as possible (3 November). The floor is **Safari and iOS 16.4, Chrome and Edge 111, and Firefox 115 ESR**, and later: the first versions with everything web components need (custom elements, shadow DOM, constructable stylesheets, form-associated elements). Two rules apply on top:
  - below the floor, pages still work: tier 1 is plain HTML and CSS, and tier 2 components start from usable native markup;
  - anything newer than the floor (popover, anchor positioning) gets a fallback.

  `light-dark()` is dropped for this reason: separate dark values already work on the floor;
- brand themes live in the apps (3 November). Kit ships the token mechanism and one neutral default theme. Each app overrides the `--kit-*` tokens it wants (accent, fonts, radius) in a theme file in its own repo, loaded after kit's CSS.

**Still open:** the shadow DOM default and the loading default per backend; these settle while the core is built. The review in part 1 hasn't been folded into the spec as v0.2 yet.

### Phase 1: core and harnesses (L)

The engine and the safety nets every later component inherits.

- **Core:**
  - `KitElement`, `html`, `svg`, `css` and `define`, with the fixes from 1.2: a proper template scanner, reflected defaults, blocked `innerHTML`, a loop guard and listener options;
  - keyed `repeat()` and `styleMap` (custom properties only);
  - `a11y.js`, with per-dialog live regions and two politeness regions;
  - dev checks that are stripped from production.
- **Go CLI skeleton:** `kit build` (esbuild minify, per-file gzip and Brotli sizes, hashed filenames, manifest), `kit check` (size budgets, unsafe-sink lint).
- **Test harness:** Playwright component tests in three engines, the XSS corpus runner, race tests with a controllable fake `fetch`, render benchmarks at 4x CPU throttle, and a 10,000-cycle mount/unmount heap check.
- **Tokens v1:** colour (OKLCH), type, space, radius, elevation, motion, density; `kit check-contrast` in Go.

**Done when** the core tests, XSS corpus and benchmarks pass in all three engines, the core is under 6 KB gzipped, and a counter works in a Go template, a Blade view and a WordPress page.

**Done so far:**
- **Tokens v1:** `tokens/tokens.css` has colour, type, space, radius, elevation, motion and density, with dark mode, four accents (spruce, indigo, amber, rose) and compact density. The values are hex and `rgb()` for now: the OKLCH rewrite and `kit check-contrast` are still to do. Contrast is checked with axe instead, which caught and fixed two misses (`--kit-warn`, and amber in light mode).
- **Go CLI:** the site half exists (see phase 4). It bundles and minifies with esbuild, gives files content-hashed names, and prints each bundle's gzipped size. `kit check` (size budgets, unsafe-sink lint) isn't built.

- **The core runtime** (`core/`, 3 November): **5.6 KB gzipped** in all, under the 6 KB budget.
  - `KitElement`, with the fixes from 1.2: reflected defaults, a 50-cycle loop guard, optional `render()` for components that enhance server markup, `ElementInternals` for form controls, and a fallback for `AbortSignal.any`, which is newer than the browser floor;
  - `html`/`svg`, with a real scanner instead of the `>` heuristic, case-kept attribute names, keyed `repeat()`, CSP-safe `styleMap()` (custom properties only), and event options (`@scroll.passive`);
  - blocked bindings: `on*`, `.innerHTML`, `.outerHTML`, `srcdoc` and plain `style`. `safeUrl` allows same-origin `blob:`;
  - `css`, `define` (a second copy of a tag warns and keeps the first), and `a11y` (`uid`, `announce` with two regions and one inside an open modal, `roving`).
- **Browser tests** (`tests/`, Playwright, `make browser-test`):
  - the core: batching, reflection, early properties, disconnect and reconnect, latest-wins `run()`, the loop guard, the renderer and refused bindings;
  - an XSS corpus of 12 hostile values through every kind of binding;
  - `<kit-segmented>`, and every page of the site (axe in light and dark, at 1280 and 390 px, every accent).

  All 30 pass in Chromium, Firefox and WebKit (in CI; locally Chromium only, as the Mac's disk is short of space).

**Not started:** benchmarks and the heap check, `kit check` (size budgets, unsafe-sink lint) and the OKLCH token rewrite. The core always includes the renderer, about 2 KB of its size, even for components that don't render templates; that can be made optional.

### Phase 2: design system and static components (M)

The look, before the behaviour.

- **Final tokens and the default theme,** light and dark, plus a documented recipe for an app's own theme (Foundations → Theming on the site).
- **Tier 1 CSS:**
  - type, layout primitives (stack, cluster, grid, sidebar), surfaces and cards, badge, alert, avatar, kbd, skeleton, empty state;
  - table styles (tier 1, for server-rendered tables), form field styles, print styles.
- **The icon sprite.**
- **A visual-regression baseline** for every theme.

**Done when** a static page built only from tier 1 CSS looks finished in light and dark with every accent, an example app theme re-skins it without touching kit's files, and contrast passes everywhere.

**Done so far:**
- **The neutral kit theme,** light and dark, with four accents and two densities.
- **Tier 1 CSS:**
  - `button`: four variants, three sizes, icon-only, a loading spinner via `aria-busy`, and disabled;
  - `button-group`, with toggle buttons;
  - `segmented-control`: the styling, now also for `<kit-segmented>` (see phase 3);
  - `sidebar`: icons, counts and badges, section labels and nested pages. The site's own navigation uses it.
  - **Feedback** (3 November): `alert` (four tones, title, actions), `progress-bar` (native `<progress>`, tones, indeterminate), `skeleton`, `empty-state`.
  - **Data display** (3 November): `badge`, `status-dot` (with a live pulse), `avatar` (initials, photos, groups), `card` (with an accessible whole-card link), `kbd`; then `stat-tile` (trend shown by shape, `data-good="down"` for costs), `description-list` (container-query stacking, columns) and `data-table` (tabular figures, sticky header, scroll region, sortable columns via `table-sort.js` with natural, number and date order).
  - **Layout** (3 November): `stack`, `cluster`, `grid` (auto-filling columns, for groups of cards), `split` (side and main, stacking without breakpoints), `container`, `divider`.
  - **Inputs** (3 November): `text-field` (hint, error, prefix and suffix groups, textarea, read-only), `select` (native), `checkbox` (with the mixed state), `radio-group` (list, row and tiles).

  All CSS is 5.6 KB gzipped, fonts' `@font-face` rules and tokens included.
- **Placeholder content:** literal placeholder text in every demo (no invented company or records). Demos can still read `site/data/*.yaml` as `.Data`, for charts later.

**Theming recipe** (3 November): `site/themes/<id>/` (theme.yaml and theme.css) builds a showcase page per theme; the Kritano theme, from its clients.kritano.com brand file, is the worked example (1.5 KB gzipped, light and dark, AA-checked). New tokens `--kit-display-weight` and `--kit-display-tracking` let single-weight display faces work. README has the recipe. A second theme, **Chris Garlick** (from a new `brand.yaml` in the Clients format, written from the portfolio's CSS), adds `--kit-button-radius(-sm)` for pill buttons and per-element service accents (`data-cg`), and themes can ship full pages with no kit chrome (`theme.yaml` `pages:`, the bare layout): the chrisgarlick.com homepage rebuilt from kit at /themes/chrisgarlick/home/.

**Not started:** the rest of tier 1 (type primitives, scroll area, code block, print), the icon sprite and the visual-regression baseline.

### Phase 3: interactive components (L)

APG patterns, form-associated where they hold values.

- **Actions:** button (with `onActivate`, loading and icon-only label), icon button, segmented control.
- **Overlays:** dialog, drawer, popover, menu and dropdown, tooltip, toast (via `announce`).
- **Navigation:** tabs, disclosure and accordion, breadcrumbs, pagination.
- **Form controls:** text field, textarea, checkbox, radio group, switch, select, combobox with filtering, slider, date picker, file drop.
- **Command palette:** Kritano's ⌘K, generalised.
- **The positioning helper** (anchor positioning plus fallback).

**Done when** every component meets the definition of done, including the manual screen-reader pass, and a sample form submits natively with validation messages.

**Done so far:** `<kit-segmented>` (3 November, beta).
- It enhances server-rendered buttons: roles, a roving tabindex, arrows (swapped on right-to-left pages), Home and End.
- It has a `change` event and a `choose()` method.
- It submits with its form, resets with it, and follows a disabled `<fieldset>`.
- It warns in the console when it has no accessible name.

The site's own scheme and density controls use it. Its screen-reader pass is still to do.

Also done (3 November):
- **`<kit-tabs>`** (beta): APG tabs over server-rendered buttons and panels, automatic or manual activation, vertical, and every panel shown before the script loads.
- **Dialog** (beta): the native `<dialog>`, opened and closed from markup with the platform's `commandfor`/`command` and `closedby="any"`. `dialog.js` fills them in on browsers without them (tested both ways), and returns focus to the opener. **Drawer** is a dialog variant.
- **Accordion**: native `<details name>`, CSS only, animated where `::details-content` is supported.
- **The positioning helper** (`core/position.js`): place and follow, flipping and sliding to stay on screen; one JS path in every browser, since CSS anchor positioning isn't in Firefox or Safari 16.4. `core/layer.js` puts overlays in the top layer where popovers exist and falls back to fixed positioning.
- **Popover** (native `popover`, filled in for older browsers), **`<kit-menu>`** (APG menu button with typeahead) and **tooltip** (one `data-tooltip` attribute; hoverable, Escape, describedby only when it adds to the name).
- **Toast**: `toast()`, `kit.toast()`, server flash messages from markup and `data-toast` buttons; announced through the live regions, paused on hover and focus, kept inside open modals. **Switch** (native checkbox, `role="switch"`) and **slider** (native range with a filled track and `<output>` readout).
- **`<kit-combobox>`** (beta): enhances a `<select>` into an APG combobox with list autocomplete (accent- and case-insensitive, starts-with first, highlighted matches, match count announced). The hidden select keeps the value, so submit, `required` and reset are native.
- **`<kit-command>`** (beta): the command palette. Items from markup links and buttons (choosing one follows or clicks it), ⌘K/Ctrl+K, multi-word ranked filtering over labels, keywords and groups, and an async `source` for server results with latest-wins.
- **Charts** (beta): `<kit-chart>` draws line, area, bar (grouped or stacked) and donut charts from a plain `<table>` (the no-script fallback and the screen-reader view, revealed by "Show table"), with `core/scale.js` (nice ticks, linear scales, formatters), a generated text summary, hover and arrow-key values that are announced, and redraws on resize or table edits. `<kit-sparkline>` for trends beside a number. Then scatter (groups, nearest-point hover, correlation in the summary), histogram (round bins, Sturges by default) and heatmap (accent shading with printed values, 2-D keyboard movement).
- **`<kit-data-grid>`** (beta): APG data grid with virtual rows (a recycled pool, fixed row height), so 50,000 rows render a few dozen elements; aria-rowcount/colcount and per-row indices for the whole set, focus on the grid with the current cell as `aria-activedescendant`, arrows, Home/End, Ctrl+Home/End and Page Up/Down, header sorting, a multi-word `query`, per-column formats and safe `cell()` renderers.

### Phase 4: ui.chrisgarlick.com v1 and the registry (M)

- **`kit site build`:**
  - Go templates that read each component's README, demo and metadata;
  - generated props controls, code tabs per backend, sizes and test status;
  - the foundations pages and the theme switcher.
- **`kit init`, `kit add`, `kit verify`, `kit diff`:** signed registry, SHA-256 per file, cached base versions for three-way diffs.
- **Hosting:** an nginx block on the chrisgarlick.com server, plus `kit site deploy` (rsync and symlink switch).
- **CI:** builds the site, runs Lighthouse CI and axe on every page, and audits it with Kritano.

**Done when** ui.chrisgarlick.com is live, every page scores LCP ≤ 2.5 s, CLS ≤ 0.1 and INP ≤ 200 ms (lab, throttled), and `kit add button` installs a verified copy into a fresh project.

**Done so far:**
- **`kit site build`:**
  - the home page, Foundations (every token shown live), a page per group and a page per component;
  - each component page has the demo, its markup and the README;
  - all assembled from the component folders and checked as they're read (known group, required fields, valid tier and status, demo templates that run);
  - empty groups list what's planned, and shipped components drop off that list by themselves;
  - a sitemap, a 404 page and `.gz` copies for `gzip_static`;
  - the theme controls (scheme, density, accent), saved in the browser and applied before first paint;
  - no inline scripts or styles anywhere, so a strict CSP holds. A test enforces it.
- **`kit site serve`:** rebuilds in about 30 ms on any change and reloads the browser. It sends the same CSP as the live site will.
- **Tests:** `internal/site` builds a fixture site and the real repo, and checks that broken component folders are all reported.
- **Checked by hand in a browser:** axe (WCAG 2.2 AA) is clean on every page in light and dark, at 1280 and 390 px, and with every accent. There are no script errors and no sideways scrolling. The check is a Playwright script, not yet in the repo or CI.

- **Hosting (3 November):** [ui.chrisgarlick.com](https://ui.chrisgarlick.com) is live, as static files on the chrisgarlick.com server, with no new process.
  - nginx (`deploy/ui.chrisgarlick.com.conf`) serves `/var/www/ui/current` with `gzip_static`, a year's cache for hashed assets, `no-cache` pages, the strict CSP, HSTS, and a Let's Encrypt certificate.
  - `kit site deploy` rsyncs into a new release folder and switches `current` in one rename, keeping five releases; `-rollback` goes back one.
  - The site tests pass against the live site too (`KIT_SITE_URL=https://ui.chrisgarlick.com npx playwright test tests/site.spec.js`).
- **CI (3 November):** GitHub Actions on every push. It runs Go lint, tests and a site build, and the browser tests in Chromium, Firefox and WebKit. Actions are pinned to commits. All green on the first run.

**Not started:**
- props controls, code tabs per backend, and sizes and test status on pages;
- the registry commands;
- Lighthouse CI and the Kritano audit in CI.

### Phase 5: data analysis (XL)

The part that makes the kit different.

- **Data layer:**
  - a columnar dataset type (typed arrays for numbers);
  - a small scale module (linear, log, time, band) with "nice" ticks;
  - `Intl` formatters;
  - aggregation (group-by, bin, rollups) in a worker with transferable arrays.
- **Charts:**
  - SVG first: line, area, bar (grouped, stacked), sparkline, scatter, histogram, donut, heatmap;
  - Canvas renderer for large point counts, with downsampling (largest-triangle-three-buckets for lines);
  - shared axes, legends, crosshair tooltips and brushing to zoom;
  - accessible by default (data table, summary, keyboard navigation).
- **Data grid:**
  - virtualised rows and columns;
  - sort, filter, column resize, reorder and pin;
  - selection, the APG grid keyboard model, sticky header, totals row;
  - CSV export.
- **Dashboard pieces:** stat tiles with deltas, filter bar, date-range picker with presets, layout grid.
- **Budgets:**
  - charts core ≤ 12 KB gzipped, each chart type ≤ 3 KB on top;
  - grid ≤ 15 KB gzipped;
  - 100,000-row grid scrolls at 60 fps;
  - a 50,000-point line chart renders in under 50 ms at 4x throttle.

  For scale: Chart.js is about 65 KB and ECharts several hundred.
- **Dashboard gallery on the site,** using real public datasets.

**Done when** the budgets hold in CI, charts and the grid pass the definition of done (including screen-reader passes), and the gallery dashboards meet the Core Web Vitals targets.

### Phase 6: adoption, then the advanced parts (L, ongoing)

- **Each app adds its theme file** (accent, fonts, radius in light and dark) in its own repo: Kritano's indigo, amber and Outfit; chrisgarlick.com's own palette.
- **Kritano's app first:**
  - replace its hand-built pieces: score chart and sparklines, ⌘K palette, tables, menus, dialogs and tabs;
  - then the Kritano and docs sites through cms themes;
  - then chrisgarlick.com.

  Each move is measured: page weight and Core Web Vitals before and after.
- **Go helpers for cms and Kritano templates,** so tier 1 markup and per-page script tags come from one partial.
- **Declarative shadow DOM** for server-rendered first paint of tier 2 components.
- **Rust WASM kernels, only if phase 5's benchmarks show the need.**
- **Arrow and Parquet import,** lazily loaded.

**Done when** Kritano's app ships no UI code of its own outside site-specific subclasses.

### Order of work, in one line

0 → 1 → 2 → 3 → 4 (site goes live with the core components) → 5 (data) → 6 (adoption). Phases 2 and 3 can overlap once the core is stable; the site can go live as early as phase 2 if you want something to show.

**What actually happened:** you chose the design system and the site first, so parts of phases 2 and 4 were built before phase 1. That keeps the look settled while the core is written. The core is next.

---

## 5. Decisions

1. **Name, tag prefix and licence:** `kit`, `kit-` and MIT.
2. **Repo:** its own, public, at [Chrisgarlick/kit](https://github.com/Chrisgarlick/kit).
3. **Typefaces:** Bricolage Grotesque, Instrument Sans and Geist Mono, self-hosted.
4. **Languages:** Go for tooling and plain JavaScript in the browser; Rust only if benchmarks demand it.
5. **Order:** the design system and the site first, then the core, then the data components.
6. **Browsers:** as wide as possible. The floor is Safari and iOS 16.4, Chrome and Edge 111, and Firefox 115 ESR; below it pages still work, and above it newer features get fallbacks.
7. **Brand themes:** each app's own, in its own repo, overriding kit's tokens.
