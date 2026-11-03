// slider.js: the filled track and the output readout follow the value.
import { test, expect } from '@playwright/test';

test('the fill and the output follow the value, from the keyboard and on reset', async ({ page }) => {
  await page.goto('http://127.0.0.1:8151/tests/harness.html');
  await page.evaluate(async () => {
    document.getElementById('app').innerHTML = `<form><label for="v">Volume</label><output for="v" data-format="percent"></output>
      <input type="range" class="kit-slider" id="v" min="0" max="200" value="50"><output for="v" data-unit="GB"></output><button type="reset">Reset</button></form>`;
    await import('/components/slider/slider.js');
  });
  const fill = () => page.locator('#v').evaluate((i) => i.style.getPropertyValue('--kit-fill'));
  expect(await fill()).toBe('25%');
  await expect(page.locator('output').first()).toHaveText('25%');
  await expect(page.locator('output').last()).toHaveText('50 GB');
  await page.locator('#v').focus();
  await page.keyboard.press('End');
  expect(await fill()).toBe('100%');
  await expect(page.locator('output').last()).toHaveText('200 GB');
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect.poll(fill).toBe('25%');
});
