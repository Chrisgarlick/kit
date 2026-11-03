// SPDX-License-Identifier: MIT
//
// Progress rings: keeps each .kit-ring's --kit-ring (how far round, 0% to
// 100%) in step with its aria-valuenow, -valuemin and -valuemax, including
// when they change later and for rings added later. Importing it twice is harmless.

const KEY = Symbol.for('kit.ring');

export function syncRing(el) {
  const now = el.getAttribute('aria-valuenow');
  if (now == null) { el.style.removeProperty('--kit-ring'); return; }
  const min = Number(el.getAttribute('aria-valuemin') ?? 0);
  const max = Number(el.getAttribute('aria-valuemax') ?? 100);
  const pct = max > min ? Math.max(0, Math.min(100, ((Number(now) - min) / (max - min)) * 100)) : 0;
  el.style.setProperty('--kit-ring', `${pct}%`);
}

function install() {
  if (globalThis[KEY]) return;
  globalThis[KEY] = true;
  const all = (root) => { for (const r of root.querySelectorAll('.kit-ring')) syncRing(r); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => all(document), { once: true });
  else all(document);
  new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'attributes' && r.target.classList?.contains('kit-ring')) syncRing(r.target);
      for (const n of r.addedNodes ?? []) {
        if (n.nodeType !== 1) continue;
        if (n.classList.contains('kit-ring')) syncRing(n);
        all(n);
      }
    }
  }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'] });
}

install();
