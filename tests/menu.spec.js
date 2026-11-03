// <kit-menu>: roles, opening, keyboard, typeahead, picking and dismissal.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const harness = 'http://127.0.0.1:8151/tests/harness.html';

const markup = `
<button id="before">Before</button>
<kit-menu>
  <button>Actions</button>
  <div class="kit-menu-list">
    <button value="edit">Edit</button>
    <button>Duplicate</button>
    <button disabled>Archive</button>
    <hr>
    <button value="delete">Delete</button>
  </div>
</kit-menu>
<button id="after">After</button>`;

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(harness);
  await page.evaluate(async (m) => {
    document.getElementById('app').innerHTML = m;
    await import('/components/menu/menu.js');
    await document.querySelector('kit-menu').updateComplete;
    window.picks = [];
    document.querySelector('kit-menu').addEventListener('select', (e) => window.picks.push(e.detail.value));
  }, markup);
});

const trigger = (page) => page.getByRole('button', { name: 'Actions' });

test('the button opens a menu below it, on the first item', async ({ page }) => {
  await expect(trigger(page)).toHaveAttribute('aria-haspopup', 'menu');
  await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('menu')).toBeHidden();
  await trigger(page).click();
  await expect(page.getByRole('menu', { name: 'Actions' })).toBeVisible();
  await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeFocused();
  const [t, m] = await Promise.all([trigger(page).boundingBox(), page.getByRole('menu').boundingBox()]);
  expect(Math.round(m.y - (t.y + t.height))).toBe(6);
  expect(Math.round(m.x)).toBe(Math.round(t.x));
  const axe = await new AxeBuilder({ page }).include('kit-menu').withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
});

test('arrows wrap and skip disabled items; ArrowUp on the button opens on the last', async ({ page }) => {
  await trigger(page).focus();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeFocused();
  await page.keyboard.press('ArrowDown'); // wraps
  await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown'); // skips Archive
  await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeFocused();
});

test('typing jumps to an item; Enter picks it once, closes, and focus returns', async ({ page }) => {
  await trigger(page).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeFocused();
  await page.keyboard.type('du');
  await expect(page.getByRole('menuitem', { name: 'Duplicate' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menu')).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  expect(await page.evaluate(() => window.picks)).toEqual(['Duplicate']);
  await page.keyboard.press('Space');
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => window.picks)).toEqual(['Duplicate', 'edit']);
});

test('Escape and a click outside close it', async ({ page }) => {
  await trigger(page).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  await trigger(page).click();
  await page.mouse.click(600, 400);
  await expect(page.getByRole('menu')).toBeHidden();
  expect(await page.evaluate(() => window.picks)).toEqual([]);
});

test('a click on an item picks it; Tab closes and moves on', async ({ page }) => {
  await trigger(page).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  expect(await page.evaluate(() => window.picks)).toEqual(['delete']);
  await trigger(page).click();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('menu')).toBeHidden();
  await expect(page.locator('#after')).toBeFocused();
});

test('without the popover API (Safari 16.4, Firefox 115) it still opens beside the button', async ({ page }) => {
  await page.goto(harness);
  await page.evaluate(async (m) => {
    for (const k of ['showPopover', 'hidePopover', 'togglePopover']) delete HTMLElement.prototype[k];
    document.getElementById('app').innerHTML = `<div style="overflow:hidden;height:60px">${m}</div>`;
    await import('/components/menu/menu.js?nopopover');
    await customElements.whenDefined('kit-menu');
  }, markup);
  await trigger(page).click();
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(page.getByRole('menu')).not.toHaveAttribute('popover');
  // position: fixed, so the clipping parent doesn't hide it.
  await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
});
