// Core runtime tests, in a real browser: KitElement, the renderer, css,
// define and the a11y helpers. Each test imports the source modules into a
// blank page and returns what it saw.
import { test, expect } from '@playwright/test';

const harness = 'http://127.0.0.1:8151/tests/harness.html';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (e) => { throw e; });
  await page.goto(harness);
});

test.describe('KitElement', () => {
  test('writes are synchronous and renders are batched', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const { KitElement, html, define } = await import('/core/index.js');
      let renders = 0;
      class C extends KitElement {
        static state = { count: 0 };
        render() { renders++; return html`<p>${this.count}</p>`; }
      }
      define('t-batch', C);
      const el = document.createElement('t-batch');
      document.body.append(el);
      await el.updateComplete;
      const before = renders;
      const seen = [];
      for (let i = 0; i < 10; i++) { el.count += 1; seen.push(el.count); }
      await el.updateComplete;
      return { extra: renders - before, last: seen.at(-1), text: el.shadowRoot.textContent };
    });
    expect(r).toEqual({ extra: 1, last: 10, text: '10' });
  });

  test('props come from attributes by type, and reflected defaults appear on first update', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const { KitElement, define } = await import('/core/index.js');
      class C extends KitElement {
        static props = {
          variant: { type: String, default: 'primary', reflect: true },
          step: { type: Number, default: 1 },
          open: { type: Boolean, reflect: true },
          maxItems: { type: Number },
          items: { type: Array, default: () => [] },
        };
      }
      define('t-props', C);
      document.body.innerHTML = '<t-props step="3" max-items="9"></t-props>';
      const el = document.querySelector('t-props');
      await el.updateComplete;
      const first = { variant: el.getAttribute('variant'), step: el.step, maxItems: el.maxItems, open: el.open, items: Array.isArray(el.items) };
      el.open = true;
      el.variant = 'ghost';
      await el.updateComplete;
      const reflected = { open: el.hasAttribute('open'), variant: el.getAttribute('variant') };
      el.setAttribute('open', ''); el.removeAttribute('open');
      return { first, reflected, openAfterRemove: el.open, observed: C.observedAttributes.sort() };
    });
    expect(r.first).toEqual({ variant: 'primary', step: 3, maxItems: 9, open: undefined, items: true });
    expect(r.reflected).toEqual({ open: true, variant: 'ghost' });
    expect(r.openAfterRemove).toBe(false);
    expect(r.observed).toEqual(['max-items', 'open', 'step', 'variant']); // items is property-only
  });

  test('a property set before the element is defined still works', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const { KitElement, html, define } = await import('/core/index.js');
      document.body.innerHTML = '<t-early></t-early>';
      const el = document.querySelector('t-early');
      el.label = 'set early';
      class C extends KitElement {
        static props = { label: { type: String } };
        render() { return html`<span>${this.label}</span>`; }
      }
      define('t-early', C);
      await el.updateComplete;
      el.label = 'then reactive';
      await el.updateComplete;
      return el.shadowRoot.textContent;
    });
    expect(r).toBe('then reactive');
  });

  test('leaving the page aborts the signal and running tasks; coming back works', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const { KitElement, define } = await import('/core/index.js');
      class C extends KitElement {}
      define('t-life', C);
      const el = document.createElement('t-life');
      document.body.append(el);
      const signal = el.signal;
      let taskSignal;
      const task = el.run('load', (s) => { taskSignal = s; return new Promise(() => {}); });
      el.remove();
      const aborted = signal.aborted && taskSignal.aborted;
      document.body.append(el);
      await el.updateComplete;
      return { aborted, fresh: el.signal !== signal && !el.signal.aborted, superseded: await Promise.race([task, new Promise((r) => setTimeout(() => r('pending'), 50))]) };
    });
    expect(r).toEqual({ aborted: true, fresh: true, superseded: 'pending' });
  });

  test('run() is latest-wins: an older, slower result is dropped', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const { KitElement, define } = await import('/core/index.js');
      class C extends KitElement {}
      define('t-race', C);
      const el = document.createElement('t-race');
      document.body.append(el);
      const delay = (ms, v) => (s) => new Promise((res) => { const t = setTimeout(() => res(v), ms); s.addEventListener('abort', () => clearTimeout(t)); });
      const slow = el.run('search', delay(60, 'old'));
      const fast = el.run('search', delay(5, 'new'));
      return { slow: await Promise.race([slow, new Promise((r) => setTimeout(() => r('dropped'), 120))]), fast: await fast };
    });
    expect(r).toEqual({ slow: 'dropped', fast: 'new' });
  });

  test('a component that keeps changing itself in updated() is stopped', async ({ page }) => {
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    const r = await page.evaluate(async () => {
      const { KitElement, define } = await import('/core/index.js');
      let cycles = 0;
      class C extends KitElement {
        static state = { n: 0 };
        updated() { cycles++; this.n++; }
      }
      define('t-loop', C);
      const el = document.createElement('t-loop');
      document.body.append(el);
      await new Promise((r) => setTimeout(r, 50));
      const settled = cycles;
      await new Promise((r) => setTimeout(r, 50));
      return { settled, later: cycles };
    });
    expect(r.settled).toBeLessThanOrEqual(52);
    expect(r.later).toBe(r.settled); // it really stopped
    expect(errors.join('\n')).toContain('updated itself 50 times');
  });
});

test.describe('html renderer', () => {
  test('values are text, inputs keep focus and caret, handlers stay current', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const { html, render } = await import('/core/index.js');
      const app = document.getElementById('app');
      let clicks = [];
      const view = (text, n) => html`<input .value=${text} aria-label="x"><p title="a > b">${text}</p><button @click=${() => clicks.push(n)}>go</button>`;
      render(view('<b>hi</b>', 1), app);
      const input = app.querySelector('input');
      input.focus(); input.setSelectionRange(2, 2);
      render(view('<b>hi</b>', 2), app); // same value: the caret must not move
      app.querySelector('button').click();
      return {
        bold: app.querySelectorAll('b').length,
        text: app.querySelector('p').textContent,
        title: app.querySelector('p').title,
        sameInput: app.querySelector('input') === input,
        focused: document.activeElement === input,
        caret: input.selectionStart,
        clicks,
      };
    });
    expect(r).toEqual({ bold: 0, text: '<b>hi</b>', title: 'a > b', sameInput: true, focused: true, caret: 2, clicks: [2] });
  });

  test('attribute names keep their case for properties, and booleans toggle', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const { html, render } = await import('/core/index.js');
      const app = document.getElementById('app');
      const v = (on) => html`<div .ariaLabel=${'Named'} ?hidden=${!on} class="a ${on ? 'on' : 'off'} z"></div>`;
      render(v(true), app);
      const a = { label: app.firstElementChild.getAttribute('aria-label'), hidden: app.firstElementChild.hidden, cls: app.firstElementChild.className };
      render(v(false), app);
      return { a, hidden: app.firstElementChild.hidden, cls: app.firstElementChild.className };
    });
    expect(r).toEqual({ a: { label: 'Named', hidden: false, cls: 'a on z' }, hidden: true, cls: 'a off z' });
  });

  test('svg`` makes real SVG elements, even as a fragment', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const { html, svg, render } = await import('/core/index.js');
      const app = document.getElementById('app');
      const bars = [10, 20].map((h, i) => svg`<rect x=${i * 12} y="0" width="10" height=${h}></rect>`);
      render(html`<svg viewBox="0 0 30 30">${bars}</svg>`, app);
      const rects = app.querySelectorAll('rect');
      return { count: rects.length, ns: rects[0].namespaceURI, height: rects[1].getAttribute('height') };
    });
    expect(r).toEqual({ count: 2, ns: 'http://www.w3.org/2000/svg', height: '20' });
  });

  test('repeat() keeps each keyed row\'s DOM when the order changes', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const { html, render, repeat } = await import('/core/index.js');
      const app = document.getElementById('app');
      const list = (items) => html`<ul>${repeat(items, (i) => i.id, (i) => html`<li><input aria-label=${i.name} .value=${i.name}></li>`)}</ul>`;
      render(list([{ id: 1, name: 'Ada' }, { id: 2, name: 'Sam' }, { id: 3, name: 'Mira' }]), app);
      const sam = app.querySelectorAll('input')[1];
      sam.focus();
      render(list([{ id: 3, name: 'Mira' }, { id: 2, name: 'Sam' }, { id: 4, name: 'Leo' }]), app);
      const inputs = [...app.querySelectorAll('input')];
      return { names: inputs.map((i) => i.value), samKept: inputs[1] === sam, stillFocused: document.activeElement === sam };
    });
    expect(r).toEqual({ names: ['Mira', 'Sam', 'Leo'], samKept: true, stillFocused: true });
  });

  test('styleMap sets custom properties through the CSSOM, and only them', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const { html, render, styleMap } = await import('/core/index.js');
      const app = document.getElementById('app');
      render(html`<span style=${styleMap({ '--w': '40%', '--c': null })}></span>`, app);
      const w = app.firstElementChild.style.getPropertyValue('--w');
      let refused = '';
      try { render(html`<i style=${styleMap({ color: 'red' })}></i>`, app); } catch (e) { refused = e.message; }
      return { w, refused };
    });
    expect(r.w).toBe('40%');
    expect(r.refused).toContain('only sets custom properties');
  });

  test('dangerous bindings are refused', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const { html, render, css } = await import('/core/index.js');
      const app = document.getElementById('app');
      const attempt = (f) => { try { f(); return 'allowed'; } catch (e) { return e.message.split(';')[0]; } };
      const x = 'alert(1)';
      return {
        onAttr: attempt(() => render(html`<img onerror=${x}>`, app)),
        onProp: attempt(() => render(html`<img .onerror=${x}>`, app)),
        innerHTML: attempt(() => render(html`<div .innerHTML=${'<img src=x onerror=alert(1)>'}></div>`, app)),
        outerHTML: attempt(() => render(html`<div .outerHTML=${'<b>x</b>'}></div>`, app)),
        srcdoc: attempt(() => render(html`<iframe srcdoc=${'<script>alert(1)</script>'}></iframe>`, app)),
        plainStyle: attempt(() => render(html`<div style=${'color:red'}></div>`, app)),
        bareInTag: attempt(() => render(html`<div ${'hidden'}></div>`, app)),
        inScript: attempt(() => render(html`<script>${x}</script>`, app)),
        notTagged: attempt(() => html('<b>' + x + '</b>')),
        cssValue: attempt(() => css`a { color: ${'red'} }`),
      };
    });
    expect(r.onAttr).toContain('not allowed');
    expect(r.onProp).toContain('not allowed');
    expect(r.innerHTML).toContain('not allowed');
    expect(r.outerHTML).toContain('not allowed');
    expect(r.srcdoc).toContain('not allowed');
    expect(r.plainStyle).toContain('styleMap');
    expect(r.bareInTag).toContain('must be an attribute value');
    expect(r.inScript).toContain('no bindings inside <script>');
    expect(r.notTagged).toContain('tagged template literal');
    expect(r.cssValue).toContain('takes no');
  });
});

test('the XSS corpus: hostile values in every kind of binding run nothing', async ({ page }) => {
  const r = await page.evaluate(async () => {
    const { html, render } = await import('/core/index.js');
    window.__xss = 0;
    const payloads = [
      '<img src=x onerror="window.__xss++">',
      '"><img src=x onerror="window.__xss++">',
      "'><svg onload=window.__xss++>",
      '<script>window.__xss++</script>',
      'javascript:window.__xss++',
      ' JaVaScRiPt:window.__xss++',
      'data:text/html,<script>window.__xss++</script>',
      'vbscript:msgbox(1)',
      '<iframe srcdoc="<script>parent.__xss++</script>">',
      '{{constructor.constructor("window.__xss++")()}}',
      '<style>@import "x"</style>',
      '`${window.__xss++}`',
    ];
    const app = document.getElementById('app');
    const hrefs = [];
    for (const p of payloads) {
      render(html`<a href=${p} title=${p} class="x ${p}" data-v=${p} .rel=${p}>${p}</a><img src=${p} alt=${p}><a .href=${p}>link</a><form action=${p}></form>`, app);
      hrefs.push(app.querySelector('a').getAttribute('href'), app.querySelector('img').getAttribute('src'), app.querySelectorAll('a')[1].getAttribute('href'), app.querySelector('form').getAttribute('action'));
      if (app.querySelectorAll('script, iframe, svg, style').length || app.querySelectorAll('img').length !== 1) throw new Error('markup was injected by ' + p);
    }
    await new Promise((res) => setTimeout(res, 200)); // let any onerror/onload fire
    const unsafe = hrefs.filter((h) => /^\s*(javascript|data|vbscript):/i.test(h));
    return { ran: window.__xss, unsafe };
  });
  expect(r).toEqual({ ran: 0, unsafe: [] });
});

test.describe('a11y helpers', () => {
  test('announce() speaks through a live region, inside an open modal dialog when there is one', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const { announce } = await import('/core/index.js');
      announce('Saved');
      await new Promise((res) => setTimeout(res, 150));
      const body = document.querySelector('body > [data-kit-live="polite"]')?.textContent;
      const d = document.createElement('dialog');
      d.innerHTML = '<p>Confirm</p>';
      document.body.append(d);
      d.showModal();
      announce('Deleted', 'assertive');
      await new Promise((res) => setTimeout(res, 150));
      return { body, inDialog: d.querySelector('[data-kit-live="assertive"]')?.textContent };
    });
    expect(r).toEqual({ body: 'Saved', inDialog: 'Deleted' });
  });

  test('define() keeps the first class when a second copy registers the same tag', async ({ page }) => {
    const warnings = [];
    page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });
    const same = await page.evaluate(async () => {
      const { define } = await import('/core/index.js');
      class A extends HTMLElement {}
      class B extends HTMLElement {}
      define('t-twice', A);
      return define('t-twice', B) === A;
    });
    expect(same).toBe(true);
    expect(warnings.join('\n')).toContain('already defined by another copy of kit');
  });
});
