// tooltip.js: hover and focus, Escape, hoverable, and the description.
import { test, expect } from '@playwright/test';

const harness = 'http://127.0.0.1:8151/tests/harness.html';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(harness);
  await page.evaluate(async () => {
    document.getElementById('app').innerHTML = `
      <div style="padding:80px">
        <button id="icon" aria-label="Copy" data-tooltip="Copy">C</button>
        <button id="hint" data-tooltip="Sends to everyone">Share</button>
        <button id="plain">Plain</button>
        <dialog id="d"><button id="in" data-tooltip="Inside">In</button></dialog>
      </div>`;
    await import('/components/tooltip/tooltip.js');
  });
});

const tip = (page) => page.getByRole('tooltip');

test('keyboard focus shows it at once, above the element; Escape hides it', async ({ page }) => {
  await page.keyboard.press('Tab');
  await expect(page.locator('#icon')).toBeFocused();
  await expect(tip(page)).toHaveText('Copy');
  const [b, t] = await Promise.all([page.locator('#icon').boundingBox(), tip(page).boundingBox()]);
  expect(Math.round(b.y - (t.y + t.height))).toBe(8);
  await page.keyboard.press('Escape');
  await expect(tip(page)).toBeHidden();
});

test('it repeats the name, so it is not a description; extra text is', async ({ page }) => {
  await page.keyboard.press('Tab');
  await expect(page.locator('#icon')).not.toHaveAttribute('aria-describedby', /./);
  await page.keyboard.press('Tab');
  await expect(tip(page)).toHaveText('Sends to everyone');
  await expect(page.locator('#hint')).toHaveAccessibleDescription('Sends to everyone');
  await page.keyboard.press('Tab');
  await expect(page.locator('#plain')).toBeFocused();
  await expect(tip(page)).toBeHidden();
  await expect(page.locator('#hint')).not.toHaveAttribute('aria-describedby', /./);
});

test('hover shows it after a pause, and the pointer can move onto it', async ({ page }) => {
  await page.locator('#hint').hover();
  await expect(tip(page)).toBeHidden();
  await expect(tip(page)).toBeVisible({ timeout: 2000 });
  const t = await tip(page).boundingBox();
  await page.mouse.move(t.x + t.width / 2, t.y + t.height - 2, { steps: 4 });
  await page.waitForTimeout(300);
  await expect(tip(page)).toBeVisible();
  await page.mouse.move(5, 500);
  await expect(tip(page)).toBeHidden();
});

test('inside a modal dialog it shows, and Escape hides it before closing the dialog', async ({ page }) => {
  await page.evaluate(() => document.getElementById('d').showModal());
  await page.keyboard.press('Tab');
  await page.locator('#in').focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(tip(page)).toHaveText('Inside');
  await page.keyboard.press('Escape');
  await expect(tip(page)).toBeHidden();
  await expect(page.locator('#d')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#d')).toBeHidden();
});
