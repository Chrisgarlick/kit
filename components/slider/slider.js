// SPDX-License-Identifier: MIT
//
// Slider behaviour for native range inputs (no custom element):
//
//   <input type="range" class="kit-slider" id="vol" min="0" max="100" value="40">
//   <output for="vol"></output>
//
// Keeps --kit-fill (how far along the value is, 0% to 100%) on the input,
// which slider.css uses to colour the track up to the thumb, and the text of
// any <output for="id"> in step with the value (data-format="percent" adds a %,
// data-unit adds a unit). Importing it twice is harmless.

const KEY = Symbol.for('kit.slider');

export function syncSlider(input) {
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const pct = max > min ? ((Number(input.value) - min) / (max - min)) * 100 : 0;
  input.style.setProperty('--kit-fill', `${pct}%`);
  if (!input.id) return;
  for (const out of document.querySelectorAll(`output[for~="${CSS.escape(input.id)}"]`)) {
    const n = Number(input.value);
    const text = out.dataset.format === 'percent' ? `${Math.round(pct)}%` : n.toLocaleString();
    out.textContent = out.dataset.unit ? `${text} ${out.dataset.unit}` : text;
  }
}

function install() {
  if (globalThis[KEY]) return;
  globalThis[KEY] = true;
  const all = () => { for (const i of document.querySelectorAll('input.kit-slider')) syncSlider(i); };
  document.addEventListener('input', (e) => { if (e.target.matches?.('input.kit-slider')) syncSlider(e.target); }, true);
  // Form resets change the value without an input event.
  document.addEventListener('reset', () => setTimeout(all), true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all, { once: true });
  else all();
  new MutationObserver((records) => {
    for (const r of records) for (const n of r.addedNodes) {
      if (n.nodeType !== 1) continue;
      if (n.matches('input.kit-slider')) syncSlider(n);
      for (const i of n.querySelectorAll('input.kit-slider')) syncSlider(i);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
}

install();
