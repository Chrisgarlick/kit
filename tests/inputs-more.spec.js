// Context menu, number stepper, tag input, file drop and colour picker.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const harness = 'http://127.0.0.1:8151/tests/harness.html';
async function mount(page, markup, mods) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(harness);
  await page.evaluate(async ([m, mods]) => {
    document.getElementById('app').innerHTML = m;
    for (const x of mods) await import(x);
    await Promise.all([...document.querySelectorAll('kit-menu, kit-tags')].map((el) => el.updateComplete));
  }, [markup, mods]);
}
const live = (page) => page.evaluate(() => document.querySelector('[data-kit-live="polite"]')?.textContent);

test('context menu: right-click opens at the pointer; Shift+F10 from focus; Escape returns focus', async ({ page }) => {
  await mount(page, `<kit-menu context label="Item actions"><div id="r" tabindex="0" style="height:200px">Region</div>
    <div class="kit-menu-list"><button value="open">Open</button><button value="rename">Rename</button></div></kit-menu>`, ['/components/menu/menu.js']);
  await page.evaluate(() => { window.picks = []; document.querySelector('kit-menu').addEventListener('select', (e) => window.picks.push(e.detail.value)); });
  await page.mouse.click(120, 90, { button: 'right' });
  const menu = page.getByRole('menu', { name: 'Item actions' });
  await expect(menu).toBeVisible();
  const box = await menu.boundingBox();
  expect(Math.abs(box.x - 120)).toBeLessThan(4);
  await expect(page.getByRole('menuitem', { name: 'Open' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.picks)).toEqual(['rename']);
  await page.locator('#r').focus();
  await page.keyboard.press('Shift+F10');
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(page.locator('#r')).toBeFocused();
});

test('number stepper: buttons step within min and max, disable at the limits, and fire change', async ({ page }) => {
  await mount(page, `<div class="kit-stepper"><button type="button" data-step="down" aria-label="Decrease">−</button><input class="kit-input" id="n" type="number" min="1" max="3" value="2" aria-label="Quantity"><button type="button" data-step="up" aria-label="Increase">+</button></div>`, ['/components/number-stepper/number-stepper.js']);
  await page.evaluate(() => { window.changes = 0; document.getElementById('n').addEventListener('change', () => window.changes++); });
  await page.getByRole('button', { name: 'Increase' }).click();
  await expect(page.locator('#n')).toHaveValue('3');
  await expect(page.getByRole('button', { name: 'Increase' })).toBeDisabled();
  await page.getByRole('button', { name: 'Decrease' }).click();
  await page.getByRole('button', { name: 'Decrease' }).click();
  await expect(page.locator('#n')).toHaveValue('1');
  await expect(page.getByRole('button', { name: 'Decrease' })).toBeDisabled();
  expect(await page.evaluate(() => window.changes)).toBe(3);
  expect(await page.getByRole('button', { name: 'Increase' }).evaluate((b) => b.tabIndex)).toBe(-1);
});

test('tag input: enhances a comma list, adds and removes by keyboard, and submits the joined value', async ({ page }) => {
  await mount(page, `<form id="f"><label for="t">Topics</label><kit-tags max="4"><input class="kit-input" id="t" name="topics" value="Design, Research"></kit-tags><button type="reset">Reset</button></form>`, ['/components/tag-input/tag-input.js']);
  const form = () => page.evaluate(() => new FormData(document.getElementById('f')).get('topics'));
  await expect(page.getByRole('list', { name: 'Topics' }).getByRole('listitem')).toHaveText(['Design', 'Research']);
  const entry = page.getByRole('textbox', { name: 'Topics' });
  await entry.fill('Testing');
  await page.keyboard.press('Enter');
  await entry.pressSequentially('Ops,');
  await expect(page.getByRole('listitem')).toHaveCount(4);
  expect(await form()).toBe('Design, Research, Testing, Ops');
  await expect(entry).toBeDisabled(); // max reached
  await page.getByRole('button', { name: 'Remove Research' }).click();
  await expect.poll(() => live(page)).toBe('Research removed');
  await entry.focus();
  await page.keyboard.press('Backspace');
  expect(await form()).toBe('Design, Testing');
  await entry.fill('design');
  await page.keyboard.press('Enter'); // a duplicate, ignored
  expect(await form()).toBe('Design, Testing');
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect.poll(form).toBe('Design, Research');
  const axe = await new AxeBuilder({ page }).include('form').withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
});

test('file drop: lists chosen and dropped files (filtered by accept), and removes them', async ({ page }) => {
  await mount(page, `<label class="kit-drop"><input type="file" id="fi" multiple accept=".txt,image/*"><span>Drop files</span></label>`, ['/components/file-drop/file-drop.js']);
  await page.locator('#fi').setInputFiles([{ name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') }]);
  await expect(page.getByRole('list', { name: 'Chosen files' }).getByRole('listitem')).toHaveCount(1);
  await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.items.add(new File(['x'], 'b.png', { type: 'image/png' }));
    dt.items.add(new File(['y'], 'c.exe', { type: 'application/octet-stream' }));
    document.querySelector('.kit-drop').dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
  });
  await expect(page.locator('.kit-drop-name')).toHaveText(['a.txt', 'b.png']);
  await expect.poll(() => live(page)).toBe('1 file added, 1 not allowed');
  await page.getByRole('button', { name: 'Remove a.txt' }).click();
  expect(await page.evaluate(() => [...document.getElementById('fi').files].map((f) => f.name))).toEqual(['b.png']);
});

test('colour picker: hex, colour input and swatches stay in step', async ({ page }) => {
  await mount(page, `<div class="kit-colour"><input type="color" id="c" value="#0f766e" aria-label="Colour"><input class="kit-input" type="text" aria-label="Colour, hex" value="#0f766e">
    <div class="kit-colour-swatches" role="group" aria-label="Presets"><button type="button" data-colour="#0f766e" aria-label="Teal"></button><button type="button" data-colour="#4F46E5" aria-label="Indigo"></button></div></div>`, ['/components/colour-picker/colour-picker.js']);
  await expect(page.getByRole('button', { name: 'Teal' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Indigo' }).click();
  await expect(page.locator('#c')).toHaveValue('#4f46e5');
  await expect(page.getByRole('textbox', { name: 'Colour, hex' })).toHaveValue('#4F46E5');
  await page.getByRole('textbox', { name: 'Colour, hex' }).fill('f00');
  await expect(page.locator('#c')).toHaveValue('#ff0000');
  await page.getByRole('textbox', { name: 'Colour, hex' }).fill('nope');
  await expect(page.getByRole('textbox', { name: 'Colour, hex' })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#c')).toHaveValue('#ff0000');
  await expect(page.getByRole('button', { name: 'Teal' })).toHaveAttribute('aria-pressed', 'false');
});
