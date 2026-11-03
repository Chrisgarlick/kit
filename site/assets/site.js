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
    note.textContent = `Selected: ${e.detail.value}`;
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
// "Select all" above a list of checkboxes: checked, unchecked or mixed.
for (const set of document.querySelectorAll('[data-demo-selectall]')) {
  const all = set.querySelector('[data-all]');
  const ones = [...set.querySelectorAll('[data-one]')];
  const sync = () => {
    const n = ones.filter((x) => x.checked).length;
    all.checked = n === ones.length;
    all.indeterminate = n > 0 && n < ones.length;
  };
  all.addEventListener('change', () => { for (const x of ones) x.checked = all.checked; sync(); });
  for (const x of ones) x.addEventListener('change', sync);
  sync();
}
// A dialog's returnValue, shown in the note under the demo.
for (const d of document.querySelectorAll('dialog[data-demo-note]')) {
  const note = document.getElementById(d.dataset.demoNote);
  d.addEventListener('close', () => { note.textContent = `Closed with: ${d.returnValue || 'Escape or the backdrop'}`; d.returnValue = ''; });
}
// A menu's select event, shown in the note under the demo.
for (const m of document.querySelectorAll('kit-menu[data-demo-note]')) {
  const note = document.getElementById(m.dataset.demoNote);
  m.addEventListener('select', (e) => { note.textContent = `Selected: ${e.detail.value}`; });
}
// A toast's action, shown in the note under the demo.
for (const b of document.querySelectorAll('[data-toast][data-demo-note]')) {
  const note = document.getElementById(b.dataset.demoNote);
  b.addEventListener('toastaction', () => { note.textContent = 'Undo pressed: yes'; });
}
// A combobox's change event, shown in the note under the demo.
for (const c of document.querySelectorAll('kit-combobox[data-demo-note]')) {
  const note = document.getElementById(c.dataset.demoNote);
  c.addEventListener('change', (e) => { note.textContent = `Chosen: ${e.detail.label || 'nothing'}`; });
}
