# kit

[![CI](https://github.com/Chrisgarlick/kit/actions/workflows/ci.yml/badge.svg)](https://github.com/Chrisgarlick/kit/actions/workflows/ci.yml)

A small, fast, accessible component library that drops into any backend: Go, Laravel, WordPress or plain HTML. Components are copied into your project (the shadcn model), so you own every line.

- **Light:** a tiny core, and pages load only the components they use.
- **Accessible:** WCAG 2.2 AA as the floor, native elements first, the WAI-ARIA patterns where there are none.
- **Safe:** values are text, never HTML; everything runs under a strict content security policy.
- **Themeable:** one set of design tokens (`tokens/tokens.css`) drives light and dark, density and accent.

The documentation and live demos are at [ui.chrisgarlick.com](https://ui.chrisgarlick.com).

## Status

Early. In so far:
- the design tokens;
- the core runtime (`core/`, 5.6 KB gzipped);
- the first components: button, button group, sidebar, and `<kit-segmented>`, the first tier 2 component.

See [plan.md](plan.md) and [spec.md](spec.md).

## Layout

| Path | What |
|---|---|
| `core/` | The runtime for tier 2 components: `KitElement`, the `html`/`svg` renderer, `css`, `define`, and the accessibility helpers |
| `tokens/` | Design tokens and the self-hosted fonts |
| `components/<name>/` | One folder per component: its CSS (and later JS), `README.md` and `demo.html` |
| `site/` | The documentation site: groups, placeholder data, templates and the site's own assets |
| `cmd/kit`, `internal/` | The `kit` tool (Go) |
| `tests/` | Browser tests (Playwright): the core, each component, and every page of the site |
| `design/` | Design explorations |

## Adding a component

Make a folder under `components/` with a `README.md` whose front matter names its group:

```yaml
---
title: Toggle button
group: actions        # an id from site/groups.yaml
order: 40             # position on the group page
tier: 1               # 1 = CSS only, 2 = behaviour
pattern: APG button (toggle)
status: preview       # preview, beta or stable
summary: One line that says what it's for.
---
```

Add its CSS and a `demo.html` (a Go template; the placeholder data is `.Data`, from `site/data/`). It appears on its group page, in the navigation and in the sitemap on the next build. `make serve` rebuilds as you edit.

## Developing

Requires Go 1.26, and Node for the browser tests (`npm install` once).

```sh
make serve          # http://localhost:8150, rebuilding on every change
make test           # Go tests
make browser-test   # the core, components and site in Chromium (KIT_ALL_BROWSERS=1 adds Firefox and WebKit)
make check          # all of it, plus lint and a full site build
```

## Licence

MIT. The fonts in `tokens/fonts/` are under the SIL Open Font License; see `tokens/fonts/LICENSE`.
