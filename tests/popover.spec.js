// popover.js: placement beside the opener, native or filled in.
import { test, expect } from '@playwright/test';

const harness = 'http://127.0.0.1:8151/tests/harness.html';
const markup = `
<div style="padding:100px">
  <button id="open" popovertarget="p">Open</button>
  <div popover id="p" class="kit-popover"><p>Body</p><button id="inner">Inner</button></div>
  <button id="other">Other</button>
</div>`;

for (const mode of ['native', 'filled in']) {
  test.describe(mode, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(harness);
      if (mode === 'filled in') {
        // Hide the popover API before kit loads, and cancel the browser's own
        // popovertarget action, so only popover.js is doing the work.
        await page.evaluate(() => {
          for (const k of ['showPopover', 'hidePopover', 'togglePopover']) delete HTMLElement.prototype[k];
          window.addEventListener('click', (e) => { if (e.target.closest?.('[popovertarget]')) e.preventDefault(); });
        });
      }
      await page.evaluate(async (m) => {
        document.getElementById('app').innerHTML = m;
        await import('/components/popover/popover.js');
      }, markup);
    });

    test('opens beside its button, closes with Escape and returns focus', async ({ page }) => {
      if (mode === 'filled in') await expect(page.locator('#p')).toBeHidden();
      await page.locator('#open').click();
      await expect(page.locator('#p')).toBeVisible();
      await expect(page.locator('#open')).toHaveAttribute('aria-expanded', 'true');
      const [b, p] = await Promise.all([page.locator('#open').boundingBox(), page.locator('#p').boundingBox()]);
      expect(Math.round(p.y - (b.y + b.height))).toBe(6);
      expect(Math.round(p.x)).toBe(Math.round(b.x));
      await page.locator('#inner').focus();
      await page.keyboard.press('Escape');
      await expect(page.locator('#p')).toBeHidden();
      await expect(page.locator('#open')).toBeFocused();
      await expect(page.locator('#open')).toHaveAttribute('aria-expanded', 'false');
    });

    test('a click outside closes it; a click inside does not', async ({ page }) => {
      await page.locator('#open').click();
      await page.locator('#p p').click();
      await expect(page.locator('#p')).toBeVisible();
      await page.mouse.click(5, 5);
      await expect(page.locator('#p')).toBeHidden();
    });
  });
}
