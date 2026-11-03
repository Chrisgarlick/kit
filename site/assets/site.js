// SPDX-License-Identifier: MIT
// The documentation site's behaviour: the scheme, density and accent controls,
// and demo wiring for components whose behaviour hasn't moved into kit's core
// yet (marked "site only" below, removed as each tier 2 component lands).

const root = document.documentElement;
const store = {
  get: (k) => { try { return localStorage.getItem('kit-' + k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem('kit-' + k, v); } catch { /* storage unavailable */ } },
};

// Roving-tabindex radio group (APG): arrows move and choose, Home and End
// jump. Site only until <kit-segmented>.
function radioGroup(group, onChoose) {
  const options = () => [...group.querySelectorAll('[role="radio"]')];
  const choose = (opt, focus) => {
    for (const o of options()) {
      const on = o === opt;
      o.setAttribute('aria-checked', String(on));
      o.tabIndex = on ? 0 : -1;
    }
    if (focus) opt.focus();
    onChoose?.(opt);
  };
  for (const o of options()) o.tabIndex = o.getAttribute('aria-checked') === 'true' ? 0 : -1;
  group.addEventListener('click', (e) => {
    const opt = e.target.closest('[role="radio"]');
    if (opt) choose(opt);
  });
  group.addEventListener('keydown', (e) => {
    const list = options();
    const i = list.indexOf(document.activeElement);
    if (i < 0) return;
    const rtl = getComputedStyle(group).direction === 'rtl';
    const next = { ArrowDown: 1, ArrowUp: -1, ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
    let j = null;
    if (next) j = (i + next + list.length) % list.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = list.length - 1;
    if (j === null) return;
    e.preventDefault();
    choose(list[j], true);
  });
  return choose;
}

// ---------- scheme, density and accent ----------
const prefs = {
  theme: (v) => { if (v === 'system') delete root.dataset.theme; else root.dataset.theme = v; },
  density: (v) => { if (v === 'compact') root.dataset.density = 'compact'; else delete root.dataset.density; },
};
for (const group of document.querySelectorAll('[data-pref]')) {
  const key = group.dataset.pref;
  const saved = store.get(key);
  if (saved) {
    for (const o of group.querySelectorAll('[role="radio"]')) o.setAttribute('aria-checked', String(o.dataset.value === saved));
  }
  radioGroup(group, (opt) => { prefs[key](opt.dataset.value); store.set(key, opt.dataset.value); });
}
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

// ---------- demo wiring (site only) ----------
for (const group of document.querySelectorAll('[data-demo-radiogroup]')) {
  const out = group.dataset.demoOutput && document.getElementById(group.dataset.demoOutput);
  radioGroup(group, (opt) => {
    if (out) out.textContent = out.textContent.replace(/last .*\.$/, `last ${opt.textContent.toLowerCase()}.`);
  });
}
for (const b of document.querySelectorAll('[data-demo-toggle]')) {
  b.addEventListener('click', () => {
    const group = b.closest('[role="group"]');
    for (const x of group.querySelectorAll('[data-demo-toggle]')) x.setAttribute('aria-pressed', String(x === b));
  });
}
for (const b of document.querySelectorAll('[data-demo-busy]')) {
  b.addEventListener('click', () => {
    if (b.getAttribute('aria-busy') === 'true') return;
    const label = b.textContent;
    b.setAttribute('aria-busy', 'true');
    b.textContent = 'Saving…';
    setTimeout(() => { b.removeAttribute('aria-busy'); b.textContent = label; }, 1400);
  });
}
