// SPDX-License-Identifier: MIT
//
// <kit-sparkline>: a tiny trend line (or bars) to sit beside a number.
//
//   <kit-sparkline values="12 18 15 22 30 28 34" label="Weekly visits"></kit-sparkline>
//
// It's an image to screen readers, named by `label` and described in words
// ("from 12 to 34, low 12, high 34"). data-tone="good|bad|warn|info" colours
// it; type="bar" draws bars; `area` fills under the line.

import { KitElement } from '../../core/element.js';
import { define } from '../../core/define.js';
import { linear, formatter } from '../../core/scale.js';

export class KitSparkline extends KitElement {
  static shadow = false;
  static props = {
    values: { type: String },
    label: { type: String },
    type: { type: String }, // line (default) or bar
    area: { type: Boolean },
    format: { type: String },
  };

  #size = [0, 0];

  connected() {
    this.setAttribute('role', 'img');
    const ro = new ResizeObserver(() => {
      const size = [Math.round(this.clientWidth), Math.round(this.clientHeight)];
      if (size[0] !== this.#size[0] || size[1] !== this.#size[1]) { this.#size = size; this.requestUpdate(); }
    });
    ro.observe(this);
    this.signal.addEventListener('abort', () => ro.disconnect(), { once: true });
  }

  updated() {
    const v = (this.values ?? '').split(/[\s,]+/).filter(Boolean).map(Number).filter(Number.isFinite);
    const fmt = formatter(this.format || 'number');
    const [W, H] = this.#size;
    if (!v.length) { this.setAttribute('aria-label', `${this.label || 'Trend'}: no data`); this.replaceChildren(); return; }
    const lo = Math.min(...v);
    const hi = Math.max(...v);
    this.setAttribute('aria-label', `${this.label || 'Trend'}: from ${fmt(v[0])} to ${fmt(v.at(-1))}, low ${fmt(lo)}, high ${fmt(hi)}`);
    if (!W || !H) return;
    const pad = 3;
    const sy = linear(this.type === 'bar' ? Math.min(0, lo) : lo, hi === lo ? lo + 1 : hi, H - pad, pad);
    let body;
    if (this.type === 'bar') {
      const bw = W / v.length;
      const base = sy(Math.max(0, Math.min(0, hi)));
      body = v.map((x, i) => {
        const y = sy(x);
        return `<rect x="${(i * bw + bw * 0.15).toFixed(1)}" y="${Math.min(y, base).toFixed(1)}" width="${(bw * 0.7).toFixed(1)}" height="${Math.max(1, Math.abs(base - y)).toFixed(1)}" rx="1"/>`;
      }).join('');
    } else {
      const sx = linear(0, Math.max(1, v.length - 1), pad, W - pad);
      const d = v.map((x, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)} ${sy(x).toFixed(1)}`).join('');
      body = (this.area ? `<path class="kit-spark-area" d="${d}L${sx(v.length - 1).toFixed(1)} ${H}L${pad} ${H}Z"/>` : '')
        + `<path class="kit-spark-line" d="${d}"/><circle cx="${sx(v.length - 1).toFixed(1)}" cy="${sy(v.at(-1)).toFixed(1)}" r="2.5"/>`;
    }
    this.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false">${body}</svg>`;
  }
}

KitSparkline.version = '0.1.0';
define('kit-sparkline', KitSparkline);
