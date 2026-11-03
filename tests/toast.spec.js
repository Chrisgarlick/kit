// toast.js: showing, announcing, timing, actions, dialogs and markup.
import { test, expect } from '@playwright/test';

const harness = 'http://127.0.0.1:8151/tests/harness.html';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(harness);
  await page.evaluate(async () => {
    document.getElementById('app').innerHTML = '<p hidden data-kit-toast data-tone="good">Saved from the server</p><dialog id="d"><p>In a dialog</p></dialog>';
    window.mod = await import('/components/toast/toast.js');
  });
});

const card = (page, text) => page.locator('.kit-toast', { hasText: text });
const live = (page) => page.evaluate(() => [...document.querySelectorAll('[data-kit-live]')].map((r) => r.textContent).join('|'));

test('markup flash messages become toasts, and are announced', async ({ page }) => {
  await expect(page.getByRole('list', { name: 'Notifications' }).getByText('Saved from the server')).toBeVisible();
  await expect.poll(() => live(page)).toContain('Saved from the server');
});

test('toast() shows a message that goes by itself, and can be dismissed', async ({ page }) => {
  await page.evaluate(() => { window.kit.toast('Short one', { duration: 300 }); window.mod.toast('Stays', { duration: Infinity }); });
  await expect(card(page, 'Short one')).toBeVisible();
  await expect(card(page, 'Short one')).toBeHidden({ timeout: 2000 });
  await expect(card(page, 'Stays')).toBeVisible();
  await page.locator('.kit-toast', { hasText: 'Stays' }).getByRole('button', { name: 'Dismiss' }).click();
  await expect(card(page, 'Stays')).toBeHidden();
});

test('the timer waits while the pointer is over the toast', async ({ page }) => {
  await page.evaluate(() => window.mod.toast('Hover me', { duration: 600 }));
  await card(page, 'Hover me').hover();
  await page.waitForTimeout(1000);
  await expect(card(page, 'Hover me')).toBeVisible();
  await page.mouse.move(5, 5);
  await expect(card(page, 'Hover me')).toBeHidden({ timeout: 2000 });
});

test('an action runs and dismisses; errors are announced assertively', async ({ page }) => {
  await page.evaluate(() => { window.undone = 0; window.mod.toast('Deleted', { action: { label: 'Undo', onClick: () => { window.undone++; } } }); });
  await page.getByRole('button', { name: 'Undo' }).click();
  expect(await page.evaluate(() => window.undone)).toBe(1);
  await expect(card(page, 'Deleted')).toBeHidden();
  await page.evaluate(() => window.mod.toast('Failed', { tone: 'bad' }));
  await expect.poll(() => page.evaluate(() => document.querySelector('[data-kit-live="assertive"]')?.textContent)).toBe('Failed');
});

test('at most four at once, and inside an open modal dialog they live in it', async ({ page }) => {
  await page.evaluate(() => { for (let i = 1; i <= 6; i++) window.mod.toast(`T${i}`, { duration: Infinity }); });
  await expect(page.locator('.kit-toast')).toHaveCount(4);
  await expect(page.locator('.kit-toast').first()).toHaveText('T3'); // the oldest went first
  await page.evaluate(() => { document.getElementById('d').showModal(); window.mod.toast('Over the dialog', { duration: Infinity }); });
  await expect(page.locator('#d .kit-toast')).toHaveText('Over the dialog');
  await page.locator('#d').getByRole('button', { name: 'Dismiss' }).click();
  await expect(page.locator('#d .kit-toast')).toHaveCount(0);
});
