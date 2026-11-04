//! kit's chart renderer, for Typeset (PDF) and Motion (SVG and video).
//!
//! The same JavaScript that draws `<kit-chart>` in the browser
//! (`core/charts.js`, bundled into `js/kit-charts.js` by `kit bundle-charts`)
//! runs here in an embedded QuickJS engine, so every output draws the same
//! chart. Build one [`Renderer`] per thread and reuse it.
//!
//! ```no_run
//! let r = kit_render::Renderer::new()?;
//! let out = r.render(&serde_json::json!({
//!     "type": "bar", "width": 640, "values": true,
//!     "data": { "title": "Scores", "labels": ["SEO", "Content"], "series": [{ "name": "Score", "values": [95, 64] }] },
//!     "theme": { "accent": "#4F46E5", "series-1": "#4F46E5" },
//! }))?;
//! std::fs::write("scores.svg", out.svg)?;
//! # Ok::<(), Box<dyn std::error::Error>>(())
//! ```

use rquickjs::{Context, Function, Runtime};
use serde::Deserialize;

const BUNDLE: &str = include_str!("../js/kit-charts.js");

/// A rendered chart: a standalone SVG, and the summary to use as alt text.
#[derive(Debug, Clone, Deserialize)]
pub struct Rendered {
    pub svg: String,
    pub summary: String,
    pub width: f64,
    pub height: f64,
}

/// Something went wrong in the engine or the spec.
#[derive(Debug)]
pub struct Error(pub String);

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "kit-render: {}", self.0)
    }
}

impl std::error::Error for Error {}

fn err(e: impl std::fmt::Display) -> Error {
    Error(e.to_string())
}

/// A QuickJS runtime with kit's renderer loaded. Not thread-safe: one per thread.
pub struct Renderer {
    _rt: Runtime,
    ctx: Context,
}

impl Renderer {
    /// Starts an engine and loads the renderer (a few milliseconds, once).
    pub fn new() -> Result<Self, Error> {
        let rt = Runtime::new().map_err(err)?;
        rt.set_memory_limit(64 * 1024 * 1024);
        let ctx = Context::full(&rt).map_err(err)?;
        ctx.with(|c| c.eval::<(), _>(BUNDLE)).map_err(err)?;
        Ok(Self { _rt: rt, ctx })
    }

    /// Renders a chart spec: the options `renderStatic` takes (`type`,
    /// `width`, `height`, `format`, `values`, `background`, …), `data`
    /// (`{ title, labels, series: [{ name, values }] }`) and `theme` (token
    /// values by name, as a mode of a brand's tokens.json).
    pub fn render(&self, spec: &serde_json::Value) -> Result<Rendered, Error> {
        let json = spec.to_string();
        let out: String = self
            .ctx
            .with(|c| {
                let f: Function = c.globals().get("kitRender")?;
                f.call::<_, String>((json,))
            })
            .map_err(|e| self.explain(e))?;
        serde_json::from_str(&out).map_err(err)
    }

    // QuickJS reports a thrown JS error as "Exception"; fetch the message.
    fn explain(&self, e: rquickjs::Error) -> Error {
        if matches!(e, rquickjs::Error::Exception) {
            let msg = self.ctx.with(|c| {
                let ex = c.catch();
                ex.as_exception().map(|x| x.message().unwrap_or_default()).unwrap_or_else(|| format!("{ex:?}"))
            });
            return Error(msg);
        }
        err(e)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn data() -> serde_json::Value {
        json!({ "title": "kritano.com", "labels": ["SEO", "A11y", "Content"], "series": [{ "name": "Score", "values": [95, 98, 64] }] })
    }

    #[test]
    fn renders_every_type_as_standalone_svg() {
        let r = Renderer::new().unwrap();
        for t in ["line", "area", "bar", "donut", "scatter", "histogram", "heatmap", "funnel", "bullet"] {
            let out = r.render(&json!({ "type": t, "width": 480, "data": data(), "theme": { "series-1": "#4F46E5" } })).unwrap();
            assert!(out.svg.starts_with("<svg xmlns=\"http://www.w3.org/2000/svg\""), "{t}: {}", &out.svg[..60]);
            assert!(!out.svg.contains("var(--") && !out.svg.contains("currentColor"), "{t} depends on CSS");
            assert!(out.svg.contains("<title>kritano.com</title>"), "{t} has no title");
            assert!(!out.summary.is_empty(), "{t} has no summary");
        }
    }

    #[test]
    fn numbers_format_without_intl() {
        let r = Renderer::new().unwrap();
        let out = r
            .render(&json!({ "type": "bar", "width": 400, "values": true, "format": "currency:GBP",
                "data": { "labels": ["a", "b"], "series": [{ "name": "Revenue", "values": [1850.5, 128400] }] } }))
            .unwrap();
        assert!(out.summary.contains("£1,850.50") && out.summary.contains("£128,400.00"), "{}", out.summary);
    }

    #[test]
    fn errors_are_reported() {
        let r = Renderer::new().unwrap();
        let e = r.render(&json!({ "type": "bar" })).unwrap_err();
        assert!(e.0.contains("labels") || e.0.contains("undefined"), "{e}");
    }

    #[test]
    fn fast_enough() {
        let r = Renderer::new().unwrap();
        let spec = json!({ "type": "line", "width": 640, "data": { "labels": (1..=12).map(|i| i.to_string()).collect::<Vec<_>>(),
            "series": [{ "name": "A", "values": (1..=12).map(|i| i * 100).collect::<Vec<_>>() }] } });
        r.render(&spec).unwrap();
        let start = std::time::Instant::now();
        for _ in 0..50 {
            r.render(&spec).unwrap();
        }
        let each = start.elapsed() / 50;
        eprintln!("a 12-point line chart takes {each:?}");
        assert!(each < std::time::Duration::from_millis(50), "{each:?}");
    }
}
