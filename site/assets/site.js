// SPDX-License-Identifier: MIT
// The documentation site's behaviour: the scheme, density and accent
// controls, and the small bits of demo wiring that show a component's events
// in use. Components themselves live in kit.js.

const root = document.documentElement;
const store = {
  get: (k) => { try { return localStorage.getItem('kit-' + k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem('kit-' + k, v); } catch { /* storage unavailable */ } },
};

// ---------- scheme and density: two <kit-segmented>s ----------
const apply = {
  theme: (v) => { if (v === 'system') delete root.dataset.theme; else root.dataset.theme = v; },
  density: (v) => { if (v === 'compact') root.dataset.density = 'compact'; else delete root.dataset.density; },
};
for (const control of document.querySelectorAll('kit-segmented[data-pref]')) {
  const key = control.dataset.pref;
  const saved = store.get(key);
  if (saved) {
    control.value = saved;
    // Match the server-rendered state too, in case the element hasn't upgraded yet.
    for (const b of control.querySelectorAll(':scope > button')) b.setAttribute('aria-checked', String(b.value === saved));
  }
  control.addEventListener('change', (e) => {
    apply[key](e.detail.value);
    store.set(key, e.detail.value);
  });
}

// ---------- accent ----------
const accents = [...document.querySelectorAll('.accents [data-accent]')];
const savedAccent = store.get('accent') ?? 'spruce';
for (const b of accents) {
  b.setAttribute('aria-pressed', String(b.dataset.accent === savedAccent));
  b.addEventListener('click', () => {
    const v = b.dataset.accent;
    if (v === 'spruce') delete root.dataset.accent; else root.dataset.accent = v;
    store.set('accent', v);
    for (const x of accents) x.setAttribute('aria-pressed', String(x === b));
  });
}

// ---------- demo wiring ----------
// <kit-segmented>'s change event, shown in the note under the demo.
for (const control of document.querySelectorAll('kit-segmented[data-demo-note]')) {
  const note = document.getElementById(control.dataset.demoNote);
  control.addEventListener('change', (e) => {
    note.textContent = note.textContent.replace(/last .*\.$/, `last ${e.detail.value.toLowerCase()}.`);
  });
}
// Toggle buttons in a button group (tier 1 has no behaviour of its own).
for (const b of document.querySelectorAll('[data-demo-toggle]')) {
  b.addEventListener('click', () => {
    for (const x of b.closest('[role="group"]').querySelectorAll('[data-demo-toggle]')) x.setAttribute('aria-pressed', String(x === b));
  });
}
// The loading state on a button.
for (const b of document.querySelectorAll('[data-demo-busy]')) {
  b.addEventListener('click', () => {
    if (b.getAttribute('aria-busy') === 'true') return;
    const label = b.textContent;
    b.setAttribute('aria-busy', 'true');
    b.textContent = 'Saving…';
    setTimeout(() => { b.removeAttribute('aria-busy'); b.textContent = label; }, 1400);
  });
}
