// SPDX-License-Identifier: MIT
//
// css`` makes a CSSStyleSheet that every instance of a component shares
// (adoptedStyleSheets: parsed once, and not blocked by a strict style-src).
// It takes no ${…} values, which closes off CSS injection; dynamic styling
// goes through custom properties (styleMap) instead.

export function css(strings, ...values) {
  if (!Array.isArray(strings?.raw)) throw new TypeError('css must be used as a tagged template literal');
  if (values.length) throw new Error('kit: css`` takes no ${…} values; use custom properties');
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(strings[0]);
  return sheet;
}
