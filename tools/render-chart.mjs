#!/usr/bin/env node
// SPDX-License-Identifier: MIT
//
// Renders a kit chart as a standalone SVG, from a JSON spec on stdin (or a
// file named as the first argument), to stdout:
//
//   {
//     "type": "bar", "width": 640, "format": "compact",
//     "data": { "title": "…", "labels": ["Jan", …], "series": [{ "name": "…", "values": [1, 2] }] },
//     "theme": "site/themes/kritano/tokens.json", "mode": "light",
//     "background": true
//   }
//
// theme is a tokens.json path (from kit brand) or an object of token values;
// mode picks light or dark from it. The summary goes to stderr, for alt text.

import { readFileSync } from 'node:fs';
import { renderStatic } from '../core/charts-static.js';

const spec = JSON.parse(readFileSync(process.argv[2] ?? 0, 'utf8'));
let theme = spec.theme;
if (typeof theme === 'string') {
  const t = JSON.parse(readFileSync(theme, 'utf8'));
  theme = { ...t.shared, ...t[spec.mode === 'dark' ? 'dark' : 'light'] };
}
const { svg, summary } = renderStatic(spec.data, { ...spec, theme });
process.stdout.write(svg + '\n');
process.stderr.write(summary + '\n');
