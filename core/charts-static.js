// SPDX-License-Identifier: MIT
//
// Static charts: the same chart renderChart() draws for the browser, as a
// standalone SVG for Typeset (PDF), Motion (SVG and video) and any other
// renderer. Every colour and font becomes a plain attribute from a theme (a
// mode from a brand's tokens.json, kit's light tokens by default), the hover
// layer goes, and the legend, a <title> and a <desc> (the summary) are drawn in.
//
//   import { renderStatic } from 'kit/core/charts-static.js';
//   const { svg, summary } = renderStatic(data, { type: 'bar', width: 640, theme: tokens.light });

import { renderChart } from './charts.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** renderChart options, plus theme (token values by name) and background (true fills the surface colour). */
export function renderStatic(data, options = {}) {
  const r = renderChart(data, options);
  const { svg, height } = staticSVG(r.svg, { W: r.width, H: r.height, legend: r.legend, summary: r.summary, title: data.title, theme: options.theme, background: options.background });
  return { svg, summary: r.summary, width: r.width, height };
}


// kit's own light tokens, for a static chart drawn without a brand.
const KIT_LIGHT = {
  'font-ui': '"Instrument Sans", system-ui, sans-serif', 'font-display': '"Bricolage Grotesque", system-ui, sans-serif', 'display-weight': '600',
  bg: '#f5f6f8', surface: '#ffffff', 'surface-2': '#f0f2f5', 'surface-3': '#e8ebef', line: '#e2e5ea', 'line-strong': '#cdd2d9',
  fg: '#0d1014', 'fg-2': '#48505b', 'fg-3': '#69717d', accent: '#0f766e', 'accent-fg': '#ffffff',
  'series-1': '#0f766e', 'series-2': '#4f46e5', 'series-3': '#d97706', 'series-4': '#db2777', 'series-5': '#0284c7', 'series-6': '#65a30d',
};

// a moved toward b by amount, both #RRGGBB (what chart.css does with color-mix).
function mixHex(a, b, amount) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(String(h).slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  if (x.some(Number.isNaN) || y.some(Number.isNaN)) return a;
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * amount).toString(16).padStart(2, '0')).join('')}`;
}

// The attributes each of kit's chart classes stands for, from a theme.
function attrsFor(classes, t, colour) {
  const a = {};
  const has = (c) => classes.includes(c);
  if (has('kit-chart-grid')) Object.assign(a, { stroke: t.line, 'stroke-width': 1 });
  if (has('kit-chart-zero')) a.stroke = t['line-strong'];
  if (has('kit-chart-line')) Object.assign(a, { fill: 'none', stroke: colour, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
  if (has('kit-chart-area')) Object.assign(a, { fill: colour, 'fill-opacity': 0.14 });
  if (has('kit-chart-bar') || has('kit-chart-point')) a.fill = colour;
  if (has('kit-chart-point')) Object.assign(a, { 'fill-opacity': 0.8, stroke: t.surface, 'stroke-width': 1 });
  if (has('kit-chart-slice')) Object.assign(a, { fill: has('kit-chart-track') ? t['surface-3'] : colour, stroke: t.surface, 'stroke-width': 2 });
  if (has('kit-chart-heat')) a.fill = has('kit-chart-empty') ? t['surface-2'] : t.accent;
  if (has('kit-chart-bullet-track')) a.fill = t['surface-3'];
  if (has('kit-chart-bullet-band')) a.fill = mixHex(t['surface-3'], t.fg, 0.08);
  if (has('kit-chart-target')) Object.assign(a, { stroke: t.fg, 'stroke-width': 2.5, 'stroke-linecap': 'round' });
  if (has('kit-chart-tick')) Object.assign(a, { fill: t['fg-3'], 'font-size': 11 });
  if (has('kit-chart-value')) Object.assign(a, { fill: t['fg-2'], 'font-weight': 600 });
  if (has('kit-chart-axis-title') || has('kit-chart-funnel-label')) Object.assign(a, { fill: t['fg-2'], 'font-weight': 600 });
  if (has('kit-chart-funnel-label')) a['font-size'] = 12;
  if (has('kit-chart-funnel-step') || has('kit-chart-bullet-pct')) Object.assign(a, { fill: t['fg-2'], 'font-weight': 600 });
  if (has('kit-chart-bar-value')) Object.assign(a, { fill: t['accent-fg'], 'font-size': 12, 'font-weight': 600 });
  if (has('kit-chart-heat-value')) Object.assign(a, { fill: has('kit-chart-heat-on') ? t['accent-fg'] : t.fg, 'font-size': 10, 'font-weight': 500 });
  if (has('kit-chart-total')) Object.assign(a, { fill: t.fg, 'font-size': 22, 'font-family': t['font-display'], 'font-weight': t['display-weight'] || 600 });
  return a;
}

// staticSVG makes a renderChart SVG stand alone: theme colours and fonts as
// attributes, no hover layer, the legend drawn in, a <title>, and xmlns.
function staticSVG(svg, { W, H, legend, summary, title, theme, background }) {
  const t = { ...KIT_LIGHT, ...(theme || {}) };
  const series = (n) => t[`series-${((n - 1) % 6) + 1}`];
  let out = svg.replace(/<g class="kit-chart-hover"><\/g>/g, '');
  out = out.replace(/<(\w+)([^>]*?) class="([^"]+)"([^>]*?)(\/?)>/g, (all, tag, before, cls, after, close) => {
    const classes = cls.split(/\s+/);
    const sn = classes.map((c) => /^kit-s(\d)$/.exec(c)).find(Boolean);
    const attrs = attrsFor(classes, t, sn ? series(Number(sn[1])) : t.accent);
    const present = before + after;
    const extra = Object.entries(attrs).filter(([k]) => !new RegExp(`\\s${k}=`).test(present)).map(([k, v]) => ` ${k}="${esc(v)}"`).join('');
    return `<${tag}${before}${after}${extra}${close}>`;
  });
  // The legend, drawn under the chart.
  let height = H;
  let legendSVG = '';
  if (Array.isArray(legend) && legend.length) {
    let x = 0;
    let y = H + 18;
    const items = legend.map((it) => {
      const w = 22 + String(it.label).length * 6.6;
      if (x + w > W && x > 0) { x = 0; y += 20; }
      const mark = it.target
        ? `<rect x="${x + 3}" y="${y - 9}" width="3" height="12" rx="1" fill="${t.fg}"/>`
        : `<rect x="${x}" y="${y - 8}" width="10" height="10" rx="2" fill="${series(it.series + 1)}"/>`;
      const s = `${mark}<text x="${x + 16}" y="${y + 1}" font-size="12" fill="${t['fg-2']}">${esc(it.label)}</text>`;
      x += w + 10;
      return s;
    });
    height = y + 10;
    legendSVG = `<g class="kit-legend">${items.join('')}</g>`;
  } else if (legend?.scale) {
    height = H + 28;
    legendSVG = `<defs><linearGradient id="kit-scale"><stop offset="0" stop-color="${t.accent}" stop-opacity="0.1"/><stop offset="1" stop-color="${t.accent}"/></linearGradient></defs>`
      + `<text x="0" y="${H + 19}" font-size="12" fill="${t['fg-2']}">${esc(legend.scale[0])}</text><rect x="40" y="${H + 10}" width="110" height="8" rx="4" fill="url(#kit-scale)"/><text x="158" y="${H + 19}" font-size="12" fill="${t['fg-2']}">${esc(legend.scale[1])}</text>`;
  }
  const bg = background ? `<rect width="${W}" height="${height}" fill="${t.surface}"/>` : '';
  out = out.replace(/^<svg[^>]*>/, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${height}" width="${W}" height="${height}" role="img" font-family="${esc(t['font-ui'])}"><title>${esc(title || summary)}</title><desc>${esc(summary)}</desc>${bg}`);
  out = out.replace(/<\/svg>$/, `${legendSVG}</svg>`);
  return { svg: out, height };
}
