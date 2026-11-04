// The entry kit bundle-charts builds for QuickJS: one global function that
// takes a JSON spec ({ type, width, data, theme, ... }) and returns JSON
// ({ svg, summary, width, height }).
import { renderStatic } from '../../../core/charts-static.js';

globalThis.kitRender = (json) => {
  const spec = JSON.parse(json);
  const out = renderStatic(spec.data, spec);
  return JSON.stringify(out);
};
