# kit in Typeset and Motion

**Status:** plan, 3 November 2026. To build next. Owner: kit (the shared pieces), with small changes in `~/dev/typeset` and `~/dev/motion`.

## Why

Typeset (Markdown → branded PDF via Typst) and Motion (YAML scenes → animated SVG and PNG, Rust) already look good. What they lack is kit's data side: stat tiles, score bars, trend lines, heatmaps, funnels and bullet charts that look identical to the app and the website. A Kritano audit report as a PDF should carry the same charts as app.kritano.com; a Motion stat sting should animate the same bar chart.

Neither can run kit as it is. kit is HTML, CSS and browser JS; Typeset renders through the Typst CLI and Motion emits SVG itself, both on small servers with no browser. Rendering kit pages in headless Chrome is ruled out: too heavy for 1-vCPU boxes, and Typst paginates better than a browser.

## The approach: a hybrid of shared tokens and shared charts

Three layers, each with one source of truth:

| Layer | Source | kit (browser) | Typeset (Typst) | Motion (SVG) |
|---|---|---|---|---|
| **Brand** | `brand.yaml` (Clients format, `specs/brand.md`) | theme CSS (`--kit-*` tokens) | Typst tokens (`#let kit = (...)`) | colour, type and shape roles (already) |
| **Charts and data visuals** | one JS renderer in kit: data + size + resolved theme → standalone SVG string | `<kit-chart>` calls it and adds hover, keys and the table | embedded as SVG images, with the summary as alt text | a `chart` layer, the SVG plus enter animations |
| **Text components** (stat tile, badge, callout, timeline, description list, table styling) | the kit look, written natively per renderer | kit CSS | a small Typst library, `kit.typ`, styled from the tokens | Motion's own text and shape layers, styled from the roles |

Charts are shared code because they are maths (scales, ticks, layouts, summaries) that must agree everywhere. Text components are re-drawn natively because Typst must own text, pagination and PDF tagging, and Motion must own animation; sharing their look through tokens is enough.

## Phase 1: brand → tokens, one generator (small)

**Done 4 November 2026.** `kit brand` in `internal/brand` and `cmd/kit/brand.go`; both site themes now import generated `tokens.css`, with `kit.yaml` holding their few deliberate choices (Kritano's darker green and chart colours, chrisgarlick's blue info, pill buttons, two-layer shadows, the site's mono stack). It caught the same Kritano contrast failure found by hand. A Go test fails if a theme's generated files are stale. Next is phase 2.

A Go command in kit, `kit brand`, reads a Clients `brand.yaml` (modes included) and writes:

- `theme.css`: kit tokens, as `site/themes/*/theme.css` are today by hand (light on `:root`, dark under both the media query and `[data-theme="dark"]`). Fills the roles kit needs that the brand format doesn't have (`fg-3`, `surface-2`/`-3`, six series colours) with the same derivations every time, and checks WCAG AA for every text-on-surface pair in both modes, failing loudly.
- `tokens.typ`: the same resolved values as a Typst dictionary, for `kit.typ`.
- `tokens.json`: resolved roles for Motion and for the chart renderer's theme argument.

Done when the Kritano and Chris Garlick `theme.css` files are regenerated from their `brand.yaml` with no visual change (screenshot diff on the theme pages), and Typeset and Motion read the JSON or Typst output in a test.

Open question: should Clients run this at publish time, so a published brand version carries its kit theme? Probably yes, later: it already resolves defaults and checks contrast.

## Phase 2: the chart renderer, out of the element (medium)

**Done 4 November 2026.** `core/charts.js` (`renderChart`, DOM-free, every type) draws for `<kit-chart>`, now a 288-line shell for hover, keys and the table. `core/charts-static.js` (`renderStatic`) writes a standalone SVG: theme colours and fonts as attributes, legend drawn in, `<title>` and `<desc>` (the summary), optional `background` and bar `values`; kept out of `kit.js`. `tools/render-chart.mjs` renders from a JSON spec with a `tokens.json` theme. Checked by compiling real Kritano-themed charts into a Typst page (Typst 0.14). Note for phase 4: SVG text uses whatever fonts Typst has, so Typeset must load the brand fonts. Next is phase 3.

Split `components/line-chart/chart.js` into:

- `core/charts/*.js`, pure functions: `renderChart({ type, data, width, height, theme, format, options }) → { svg, summary }`. No DOM, no `document`, no CSS variables in the output: colours, fonts and sizes come from `theme` (from `tokens.json`) and are written as attributes, so the SVG stands alone. Every type: line, area, bar (grouped and stacked), donut, scatter, histogram, heatmap, funnel, bullet, sparkline, small multiples.
- `<kit-chart>` becomes a thin shell: reads the table, measures itself, calls `renderChart` with a theme that points at CSS variables (so the browser keeps live theming), then adds tooltip, keyboard, table toggle. Same output as today, checked by the existing tests.

A `static` flag in the output adds what print and video need and the web doesn't: value labels on bars, a printed legend, no hover layer.

Done when `<kit-chart>` passes its tests on top of the renderer, and `node tools/render-chart.mjs < spec.json > chart.svg` produces a standalone SVG that opens correctly in a browser, Typst and resvg.

## Phase 3: running the renderer from Rust (medium)

**Done 4 November 2026.** `crates/kit-render`: `Renderer::new()` loads `js/kit-charts.js` (24 KB, from `./bin/kit bundle-charts`) into QuickJS via `rquickjs` 0.14; `render(&spec)` returns `{ svg, summary, width, height }`. A 12-point line chart takes about 0.4 ms in release. QuickJS has no `Intl`, so `core/scale.js` falls back to `plainFormat`, which matches `Intl`'s en-GB output on 150 cases. CI runs the crate's tests and fails if the bundle is stale. The Node sidecar fallback wasn't needed. Next is phase 4 (Typeset).

Typeset and Motion are Rust. Embed the renderer rather than port it, so there is one implementation:

- A small crate, `kit-render` (in the kit repo, `crates/kit-render`), wrapping **QuickJS** through `rquickjs` (about 1 MB, no Node). It bundles `core/charts` (esbuild, at build time) and exposes `render_chart(spec: &ChartSpec, theme: &Theme) -> Result<Rendered>` with the SVG and the summary.
- Cost target: under 5 ms for a 12-point line chart, a few MB of memory; the runtime is created once per process.
- Both services depend on it by git tag, so a kit release is a dependency bump.

Fallback if QuickJS is a problem on the servers: a tiny Node sidecar on the same box, called over a Unix socket. Porting to Rust is the last resort, because the two copies would drift.

## Phase 4: Typeset

- `kit.typ`, a Typst library styled from `tokens.typ`: `stat-tile`, `stat-row`, `badge`, `callout` (kit's alert), `timeline`, `steps`, `description-list`, and table styling that matches kit's data table (tabular figures, header band, totals row).
- Markdown authoring, following the README's rules:
  - ```` ```chart ```` fenced blocks: YAML (type, format, options) plus a Markdown table or inline data; Typeset renders the SVG through `kit-render` and embeds it with `image(..., alt: summary)`, so the PDF carries the same words a screen reader gets on the web.
  - ```` ```stats ```` blocks for a row of stat tiles.
  - Charts and stat rows stay whole across page breaks, like code blocks and callouts (rule 4).
- Fonts: the SVG names the brand's fonts; check that Typst's SVG text rendering uses the fonts Typeset already loads. If not, the renderer converts text to paths for PDF (a `static` option).
- Snapshot tests in the existing gallery: one page per chart type, light brand and dark cover.

Done when a Kritano audit report (scores bar chart, category heatmap, trend line, stat row) renders as a PDF matching app.kritano.com.

## Phase 5: Motion

- A `chart` layer type: the static SVG from `kit-render`, with enter animations written by Motion's emitter, so they work in animated SVG, PNG frames and later MP4: bars grow from the baseline, lines draw on (stroke-dash), donut slices sweep, heatmap cells fade in staggered (`motion.stagger` from the brand), numbers count up in stat layers.
- The renderer marks animatable parts (`data-part="bar"`, `data-i`), and Motion targets them; the chart itself stays static and printable.
- Scenes reference data the same way as other inputs, so a template ("monthly score sting") takes a table.

Done when a scene animates a kit bar chart and a stat count-up in the Kritano brand, as animated SVG and PNG, under a second to render on the server.

## Order and size

1. Phase 1: a day. Immediate win: themes stop being hand-written.
2. Phase 2: one to two days. The chart code already exists; this is a split plus a static mode.
3. Phase 3: a day to prove QuickJS in a spike (render one chart from Rust, measure), then a day to harden.
4. Phase 4: two to three days, mostly `kit.typ` and the gallery.
5. Phase 5: two days, mostly the animation mapping.

Each phase ships on its own; Typeset can use phases 1 and 4's `kit.typ` before charts arrive.

## Risks

- **SVG text in Typst and resvg.** Fonts must resolve; mitigated by text-to-path in static mode.
- **QuickJS speed and stability.** Spike first (phase 3), Node sidecar as the fallback.
- **Two looks drifting.** `kit.typ` and kit CSS are written separately; a screenshot comparison in CI (a kit page and the Typst gallery side by side) keeps them honest.
- **Accessibility in PDFs.** Every chart image gets its summary as alt text; Typeset's PDF tagging (PDF/UA) should be checked once charts land.
