// SPDX-License-Identifier: MIT
//
// Colour pickers: in a .kit-colour, keeps the native colour input, the hex
// text box and the preset swatches (button[data-colour], painted here) in
// step, marking the current swatch aria-pressed. Importing it twice is harmless.

const KEY = Symbol.for('kit.colour');

export function normaliseHex(text) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(text).trim());
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  return `#${h.toLowerCase()}`;
}

function parts(box) {
  return {
    colour: box.querySelector('input[type="color"]'),
    hex: box.querySelector('input.kit-input'),
    swatches: [...box.querySelectorAll('.kit-colour-swatches > button[data-colour]')],
  };
}

function show(box, value, from) {
  const { colour, hex, swatches } = parts(box);
  if (colour && from !== 'colour' && colour.value !== value) {
    colour.value = value;
    colour.dispatchEvent(new Event('input', { bubbles: true }));
    colour.dispatchEvent(new Event('change', { bubbles: true }));
  }
  if (hex && from !== 'hex') { hex.value = value.toUpperCase(); hex.removeAttribute('aria-invalid'); }
  for (const s of swatches) s.setAttribute('aria-pressed', String(normaliseHex(s.dataset.colour) === value));
}

function setup(box) {
  const { colour, swatches } = parts(box);
  for (const s of swatches) s.style.setProperty('--kit-swatch', s.dataset.colour);
  if (colour) show(box, colour.value.toLowerCase(), 'init');
}

function install() {
  if (globalThis[KEY]) return;
  globalThis[KEY] = true;
  const all = () => { for (const b of document.querySelectorAll('.kit-colour')) setup(b); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all, { once: true });
  else all();
  document.addEventListener('input', (e) => {
    const box = e.target.closest?.('.kit-colour');
    if (!box) return;
    if (e.target.type === 'color') show(box, e.target.value.toLowerCase(), 'colour');
    else if (e.target.matches('input.kit-input')) {
      const v = normaliseHex(e.target.value);
      if (v) show(box, v, 'hex');
      else e.target.setAttribute('aria-invalid', 'true');
    }
  });
  document.addEventListener('change', (e) => {
    const box = e.target.closest?.('.kit-colour');
    if (box && e.target.matches('input.kit-input')) {
      const v = normaliseHex(e.target.value);
      if (v) show(box, v, null); // tidy the text to #RRGGBB on leaving
    }
  });
  document.addEventListener('click', (e) => {
    const s = e.target.closest?.('.kit-colour-swatches > button[data-colour]');
    const box = s?.closest('.kit-colour');
    const v = s && normaliseHex(s.dataset.colour);
    if (box && v) show(box, v, null);
  });
}

install();
