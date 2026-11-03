// SPDX-License-Identifier: MIT
//
// Banners: a .kit-banner-close button hides its banner. With
// data-banner-id, the banner stays hidden on later visits in this browser.
// Focus moves to the main content so it isn't lost. Importing it twice is harmless.

const KEY = Symbol.for('kit.banner');
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};

function install() {
  if (globalThis[KEY]) return;
  globalThis[KEY] = true;
  const hideSaved = () => {
    for (const b of document.querySelectorAll('.kit-banner[data-banner-id]')) {
      if (store.get(`kit-banner:${b.dataset.bannerId}`) === 'dismissed') b.hidden = true;
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hideSaved, { once: true });
  else hideSaved();
  document.addEventListener('click', (e) => {
    const close = e.target.closest?.('.kit-banner-close');
    const banner = close?.closest('.kit-banner');
    if (!banner) return;
    banner.hidden = true;
    if (banner.dataset.bannerId) store.set(`kit-banner:${banner.dataset.bannerId}`, 'dismissed');
    const main = document.querySelector('main, [role="main"]');
    if (main) { if (!main.hasAttribute('tabindex')) main.tabIndex = -1; main.focus({ preventScroll: true }); }
    banner.dispatchEvent(new CustomEvent('dismiss', { bubbles: true }));
  });
}

install();
