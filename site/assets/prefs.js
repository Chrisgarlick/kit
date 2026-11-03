// SPDX-License-Identifier: MIT
// Applies the visitor's saved scheme, density and accent before the page
// paints, so a dark-mode choice never flashes light. Loaded as a classic,
// blocking script in <head>; everything else waits for site.js.
(() => {
  const root = document.documentElement;
  const get = (k) => { try { return localStorage.getItem('kit-' + k); } catch { return null; } };
  const theme = get('theme');
  if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
  if (get('density') === 'compact') root.dataset.density = 'compact';
  const accent = get('accent');
  // A brand theme page brings its own accent.
  if (!root.hasAttribute('data-brand') && (accent === 'indigo' || accent === 'amber' || accent === 'rose')) root.dataset.accent = accent;
})();
