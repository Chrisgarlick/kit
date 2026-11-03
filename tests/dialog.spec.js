// The native <dialog> with dialog.js: markup-only commands (native or filled
// in), returnValue, light dismiss, Escape and focus return.
import { test, expect } from '@playwright/test';

const harness = 'http://127.0.0.1:8151/tests/harness.html';

const markup = `
<button id="open" commandfor="d" command="show-modal">Open</button>
<dialog id="d" closedby="any" aria-label="Example">
  <p>Body</p>
  <button id="cancel" commandfor="d" command="close" value="cancel">Cancel</button>
  <button id="ok" commandfor="d" command="close" value="ok">OK</button>
  <button id="ask" commandfor="d" command="request-close" value="asked">Ask</button>
</dialog>`;

// "native" uses the browser's own commands where it has them; "filled in"
// hides them first, so dialog.js does the work, as in older browsers.
for (const mode of ['native', 'filled in']) {
  test.describe(mode, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(harness);
      await page.evaluate(async ([m, fill]) => {
        if (fill) {
          delete HTMLButtonElement.prototype.commandForElement;
          delete HTMLButtonElement.prototype.command;
          delete HTMLDialogElement.prototype.closedBy;
          delete HTMLDialogElement.prototype.requestClose;
          // The browser still acts on the attributes as a click's default
          // action; cancelling it after dialog.js has run leaves only dialog.js.
          window.addEventListener('click', (e) => { if (e.target.closest?.('[commandfor]')) e.preventDefault(); });
        }
        document.getElementById('app').innerHTML = m;
        window.closes = [];
        document.getElementById('d').addEventListener('close', (e) => window.closes.push(e.target.returnValue));
        await import('/components/dialog/dialog.js');
      }, [markup, mode === 'filled in']);
    });

    test('opens as a modal, closes with the button value, focus returns to the opener', async ({ page }) => {
      await page.locator('#open').click();
      await expect(page.locator('#d')).toBeVisible();
      expect(await page.evaluate(() => document.getElementById('d').matches(':modal'))).toBe(true);
      await page.locator('#ok').click();
      await expect(page.locator('#d')).toBeHidden();
      await expect.poll(() => page.evaluate(() => window.closes)).toEqual(['ok']);
      await expect(page.locator('#open')).toBeFocused();
    });

    test('Escape closes it', async ({ page }) => {
      await page.locator('#open').click();
      await page.keyboard.press('Escape');
      await expect(page.locator('#d')).toBeHidden();
      await expect(page.locator('#open')).toBeFocused();
    });

    test('request-close can be refused by a cancel listener', async ({ page }) => {
      await page.locator('#open').click();
      await page.evaluate(() => document.getElementById('d').addEventListener('cancel', (e) => e.preventDefault(), { once: true }));
      await page.locator('#ask').click();
      await expect(page.locator('#d')).toBeVisible();
      await page.locator('#ask').click();
      await expect(page.locator('#d')).toBeHidden();
    });

    test('closedby="any": a click on the backdrop closes it, a click inside does not', async ({ page }) => {
      await page.locator('#open').click();
      await page.locator('#d p').click();
      await expect(page.locator('#d')).toBeVisible();
      await page.mouse.click(5, 5);
      await expect(page.locator('#d')).toBeHidden();
    });
  });
}
