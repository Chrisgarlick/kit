// SPDX-License-Identifier: MIT
//
// Number steppers: in a .kit-stepper, buttons with data-step="up" or
// "down" step the number input (its own stepUp/stepDown, so min, max and
// step hold), fire input and change, repeat while held, and disable at the
// limits. Importing it twice is harmless.

const KEY = Symbol.for('kit.stepper');

function sync(box) {
  const input = box.querySelector('input[type="number"]');
  if (!input) return;
  const v = input.valueAsNumber;
  const min = input.min === '' ? -Infinity : Number(input.min);
  const max = input.max === '' ? Infinity : Number(input.max);
  for (const b of box.querySelectorAll('button[data-step]')) {
    b.tabIndex = -1;
    b.disabled = input.disabled || (Number.isFinite(v) && (b.dataset.step === 'up' ? v >= max : v <= min));
  }
}

function step(box, dir) {
  const input = box.querySelector('input[type="number"]');
  if (!input || input.disabled || input.readOnly) return false;
  const before = input.value;
  try { if (dir === 'up') input.stepUp(); else input.stepDown(); } catch { return false; }
  if (input.value === before) return false;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  sync(box);
  return true;
}

function install() {
  if (globalThis[KEY]) return;
  globalThis[KEY] = true;
  const all = () => { for (const b of document.querySelectorAll('.kit-stepper')) sync(b); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all, { once: true });
  else all();
  let timer = 0;
  const stop = () => { clearTimeout(timer); timer = 0; };
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest?.('.kit-stepper button[data-step]');
    if (!b || b.disabled || e.button !== 0) return;
    e.preventDefault(); // keep focus where it is
    const box = b.closest('.kit-stepper');
    step(box, b.dataset.step);
    const repeat = (delay) => { timer = setTimeout(() => { if (step(box, b.dataset.step)) repeat(60); }, delay); };
    repeat(400);
  });
  for (const t of ['pointerup', 'pointercancel', 'pointerleave', 'blur']) document.addEventListener(t, stop, true);
  // Clicks from assistive technology don't come with a pointerdown.
  document.addEventListener('click', (e) => {
    const b = e.target.closest?.('.kit-stepper button[data-step]');
    if (b && e.detail === 0 && !b.disabled) step(b.closest('.kit-stepper'), b.dataset.step);
  });
  document.addEventListener('input', (e) => { const box = e.target.closest?.('.kit-stepper'); if (box) sync(box); });
}

install();
