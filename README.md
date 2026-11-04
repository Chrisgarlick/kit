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

Add its CSS and a `demo.html` (a Go template, with literal placeholder text; `.Data` holds anything in `site/data/*.yaml`). It appears on its group page, in the navigation and in the sitemap on the next build. `make serve` rebuilds as you edit.

## Using kit in an app

`kit dist` writes kit for another app to vendor (commit the output, so the app builds without kit):

```sh
kit dist -out web/static/kit \
  -js kit=command-palette,menu,tabs,dialog,data-table \
  -js charts=line-chart,sparkline \
  -css button,badge,alert,text-field
```

- `kit.css`: the tokens, plus the CSS of the components named in `-js` and `-css` (every component without `-css`). Add `-fonts` for kit's typefaces; apps with their own set the `--kit-font-*` tokens.
- One ES module per `-js` bundle (`kit.js`, `charts.js`), sharing one `kit-core-<hash>.js` chunk, so a page loads only the bundles it uses. Without `-js` there is one bundle, `kit`, with every tier 2 component; `-no-js` writes `kit.css` alone, for an app that uses kit's CSS only.
- `VERSION`: the kit commit (`+dirty` for uncommitted changes) and each bundle's components.

Entry names aren't hashed; the app versions its own asset URLs. Theme kit by overriding the `--kit-*` tokens in a stylesheet loaded after `kit.css` (see Theming).

## Theming

kit ships one neutral theme. An app re-skins it from its own repository with a stylesheet, loaded after `kit.css`, that only sets kit's `--kit-*` tokens: colours, type (including `--kit-display-weight` and `--kit-display-tracking` for display faces with one weight), radii, shadows and the six chart series. Set the light values on `:root` and the dark ones under both `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` and `:root[data-theme="dark"]`, as `tokens/tokens.css` does, and check text colours against WCAG AA on every surface.

You don't have to write the tokens by hand: `./bin/kit brand <folder>` reads a Clients `brand.yaml` (and an optional `kit.yaml` of token overrides beside it) and writes `tokens.css` for kit, `tokens.typ` for Typeset and `tokens.json` for Motion and charts. It derives the roles the brand format doesn't have by fixed rules and refuses to write anything if a text colour fails WCAG AA in either mode; `-check` fails when the files are out of date. Import `tokens.css` from the theme's stylesheet.

[`site/themes/kritano/theme.css`](site/themes/kritano/theme.css) is a worked example, built from Kritano's client brand file and shown at [ui.chrisgarlick.com/themes/kritano/](https://ui.chrisgarlick.com/themes/kritano/). Any `site/themes/<id>/` with a `theme.yaml` and `theme.css` gets a page like it.

## Developing

Requires Go 1.26, and Node for the browser tests (`npm install` once).

```sh
make serve          # http://localhost:8150, rebuilding on every change
make test           # Go tests
make browser-test   # the core, components and site in Chromium (KIT_ALL_BROWSERS=1 adds Firefox and WebKit)
make check          # all of it, plus lint and a full site build
```

## Deploying ui.chrisgarlick.com

The site is static files. `./bin/kit site deploy` builds it and rsyncs it into a new release folder on the server, then switches the `current` symlink nginx serves (`deploy/ui.chrisgarlick.com.conf`) in one step, keeping the last five releases. `./bin/kit site deploy -rollback` points it back at the previous one.

## Licence

MIT. The fonts in `tokens/fonts/` are under the SIL Open Font License; see `tokens/fonts/LICENSE`.
