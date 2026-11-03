// core/position.js: the maths, and place() and follow() in a real page.
import { test, expect } from '@playwright/test';

const harness = 'http://127.0.0.1:8151/tests/harness.html';
const vp = { width: 800, height: 600 };
const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });

test.beforeEach(async ({ page }) => { await page.goto(harness); });

const compute = (page, ...args) => page.evaluate(async (a) => (await import('/core/position.js')).computePosition(...a), args);

test('sits below, aligned to the start, and flips above when there is more room there', async ({ page }) => {
  const below = await compute(page, rect(100, 100, 80, 30), { width: 200, height: 150 }, vp, { placement: 'bottom-start', offset: 6 });
  expect(below).toMatchObject({ x: 100, y: 136, side: 'bottom' });
  const flipped = await compute(page, rect(100, 500, 80, 30), { width: 200, height: 150 }, vp, { placement: 'bottom-start', offset: 6 });
  expect(flipped).toMatchObject({ x: 100, y: 344, side: 'top' });
  // No room either way: stays on the side with more.
  const cramped = await compute(page, rect(100, 350, 80, 30), { width: 200, height: 500 }, vp, {});
  expect(cramped.side).toBe('top');
});

test('slides along to stay inside the viewport, and end/centre alignment', async ({ page }) => {
  const edge = await compute(page, rect(750, 100, 40, 30), { width: 200, height: 100 }, vp, { placement: 'bottom-start', padding: 8 });
  expect(edge.x).toBe(800 - 8 - 200);
  const end = await compute(page, rect(300, 100, 80, 30), { width: 200, height: 100 }, vp, { placement: 'bottom-end' });
  expect(end.x).toBe(180);
  const centre = await compute(page, rect(300, 100, 80, 30), { width: 40, height: 20 }, vp, { placement: 'top' });
  expect(centre).toMatchObject({ x: 320, side: 'top' });
  const rtl = await compute(page, rect(300, 100, 80, 30), { width: 200, height: 100 }, vp, { placement: 'bottom-start', rtl: true });
  expect(rtl.x).toBe(180); // start is the right-hand edge on right-to-left pages
});

test('left and right sides flip too, and report the room they have', async ({ page }) => {
  const r = await compute(page, rect(700, 100, 40, 30), { width: 150, height: 60 }, vp, { placement: 'right-start', offset: 6, padding: 8 });
  expect(r).toMatchObject({ side: 'left', x: 700 - 6 - 150, y: 100 });
  const b = await compute(page, rect(100, 100, 80, 30), { width: 200, height: 150 }, vp, { placement: 'bottom', offset: 6, padding: 8 });
  expect(b.availableHeight).toBe(600 - 130 - 8 - 6);
});

test('follow() keeps a floating element beside its anchor as the page scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  const gap = await page.evaluate(async () => {
    const { follow } = await import('/core/position.js');
    document.getElementById('app').innerHTML = '<div style="height:2000px;padding-top:200px"><button id="a">Anchor</button></div><div id="f" style="width:120px;height:40px;background:red">Float</div>';
    const a = document.getElementById('a');
    const f = document.getElementById('f');
    const stop = follow(f, a, { placement: 'bottom-start', offset: 6 });
    const before = f.getBoundingClientRect().top - a.getBoundingClientRect().bottom;
    scrollTo(0, 120);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const after = f.getBoundingClientRect().top - a.getBoundingClientRect().bottom;
    stop();
    return { before, after, side: f.dataset.side ?? null };
  });
  expect(gap).toEqual({ before: 6, after: 6, side: null });
});
