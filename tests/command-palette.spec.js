// <kit-command>: opening, filtering, keyboard, picking and server results.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const harness = 'http://127.0.0.1:8151/tests/harness.html';
const markup = `
<button id="open" commandfor="p" command="--open">Search</button>
<kit-command id="p" label="Search the app">
  <a href="#settings" data-group="Pages" data-keywords="preferences account">Settings</a>
  <a href="#members" data-group="Pages">Members</a>
  <button value="new" data-group="Actions" data-hint="N">New project</button>
  <button value="dup" data-group="Actions">Duplicate project</button>
  <button value="off" disabled data-group="Actions">Archived thing</button>
</kit-command>`;

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(harness);
  await page.evaluate(async (m) => {
    document.getElementById('app').innerHTML = m;
    await import('/components/command-palette/command-palette.js');
    await document.querySelector('kit-command').updateComplete;
    window.picks = [];
    window.clicked = 0;
    document.querySelector('kit-command').addEventListener('select', (e) => window.picks.push(e.detail.value));
    document.querySelector('button[value="new"]').addEventListener('click', () => { window.clicked++; });
  }, markup);
});

const box = (page) => page.getByRole('combobox', { name: 'Search the app' });

test('a button opens it as a modal with every item, grouped, and the first highlighted', async ({ page }) => {
  await page.locator('#open').click();
  await expect(page.getByRole('dialog', { name: 'Search the app' })).toBeVisible();
  await expect(box(page)).toBeFocused();
  await expect(page.getByRole('option')).toHaveText(['Settings', 'Members', 'New projectN', 'Duplicate project']);
  await expect(page.getByRole('group', { name: 'Actions' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true');
  const axe = await new AxeBuilder({ page }).include('dialog').withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
});

test('the shortcut toggles it; Escape closes and focus returns', async ({ page }) => {
  await page.locator('#open').focus();
  const mod = await page.evaluate(() => (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? 'Meta' : 'Control'));
  await page.keyboard.press(`${mod}+k`);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('#open')).toBeFocused();
});

test('every word must match, keywords count, label starts rank first', async ({ page }) => {
  await page.locator('#open').click();
  await box(page).fill('pref');
  await expect(page.getByRole('option')).toHaveText(['Settings']);
  await box(page).fill('proj dup');
  await expect(page.getByRole('option')).toHaveText(['Duplicate project']);
  await box(page).fill('pro');
  await expect(page.getByRole('option')).toHaveText(['New projectN', 'Duplicate project']);
  await box(page).fill('nothing like it');
  await expect(page.getByText('No results for “nothing like it”')).toBeVisible();
});

test('Enter on a button item clicks it and fires select; links are followed', async ({ page }) => {
  await page.locator('#open').click();
  await box(page).fill('new');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await page.evaluate(() => [window.picks, window.clicked])).toEqual([['new'], 1]);
  await page.locator('#open').click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#members$/);
});

test('server results merge in, and only the latest search counts', async ({ page }) => {
  await page.evaluate(() => {
    document.querySelector('kit-command').source = async (q, signal) => {
      await new Promise((r, j) => { const t = setTimeout(r, q === 'a' ? 300 : 50); signal.addEventListener('abort', () => { clearTimeout(t); j(new Error('aborted')); }); });
      return [{ label: `Result for ${q}`, group: 'Sites', value: q }];
    };
  });
  await page.locator('#open').click();
  await box(page).fill('a');
  await box(page).fill('re');
  await expect(page.getByRole('option', { name: 'Result for re' })).toBeVisible();
  await page.waitForTimeout(400);
  await expect(page.getByRole('option', { name: /Result for/ })).toHaveCount(1);
  await page.getByRole('option', { name: 'Result for re' }).click();
  expect(await page.evaluate(() => window.picks)).toEqual(['re']);
});

test('server results are kept even when the words are the server’s own, and show a description', async ({ page }) => {
  await page.evaluate(() => {
    document.querySelector('kit-command').source = async () => [{ label: 'Appearance', description: 'Settings · theme', group: 'Pages', href: '#appearance' }];
  });
  await page.locator('#open').click();
  await box(page).fill('dark mode');
  const opt = page.getByRole('option', { name: /Appearance/ });
  await expect(opt).toBeVisible();
  await expect(opt).toContainText('Settings · theme');
});
