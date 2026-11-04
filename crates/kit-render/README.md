# kit-render

kit's chart renderer for Rust: chart data and a brand theme in, a standalone SVG and its spoken summary out. It runs the same JavaScript that draws `<kit-chart>` on the web (`core/charts.js` and `core/charts-static.js`, bundled into `js/kit-charts.js` by `./bin/kit bundle-charts`) in an embedded QuickJS engine, so Typeset's PDFs and Motion's animations draw exactly the charts the apps do.

```rust
let r = kit_render::Renderer::new()?;           // once per thread, a few ms
let out = r.render(&serde_json::json!({
    "type": "bar", "width": 640, "values": true,
    "data": { "title": "Scores", "labels": ["SEO", "Content"], "series": [{ "name": "Score", "values": [95, 64] }] },
    "theme": tokens["light"],                    // a mode from a brand's tokens.json (kit brand)
}))?;
// out.svg: standalone SVG; out.summary: alt text
```

A 12-point line chart renders in about half a millisecond. Types: line, area, bar (`stacked`), donut (`center: "first"`), scatter, histogram (`bins`), heatmap, funnel, bullet. Options: `width`, `height`, `format` (`number`, `compact`, `percent`, `currency:GBP`), `values` (print bar values), `background` (fill the surface colour).

Depend on it by git tag:

```toml
kit-render = { git = "https://github.com/Chrisgarlick/kit", tag = "…" }
```

After changing the chart code, run `./bin/kit bundle-charts`; CI fails if the bundle is out of date.
