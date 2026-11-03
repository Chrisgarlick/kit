// SPDX-License-Identifier: MIT
//
// KitElement: the base class for kit's tier 2 components.
//
//   static props   attribute-backed, typed, optionally reflected
//   static state   internal reactive fields (no attribute)
//   static styles  CSSStyleSheets from css`` (shadow DOM components)
//   static shadow  false for light DOM (form controls, progressive enhancement)
//   render()       optional: return html``; leave it out to enhance the
//                  element's own children instead
//
// Writes are synchronous and renders are batched into one microtask, so
// `this.count += 1` twice reads 2 straight away and renders once. Object and
// array values are compared by identity: replace them, don't mutate them.

import { render } from './html.js';

const kebab = (s) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
const fromAttr = {
  String: (v) => v,
  Number: (v) => (v == null || v === '' ? null : Number(v)),
  Boolean: (v) => v !== null,
};
const toAttr = {
  String: (v) => (v == null ? null : String(v)),
  Number: (v) => (v == null || Number.isNaN(v) ? null : String(v)),
  Boolean: (v) => (v ? '' : null),
};
const MAX_CYCLES = 50;

// AbortSignal.any() arrived in Safari 17.4, after kit's browser floor.
function anySignal(...signals) {
  const live = signals.filter(Boolean);
  if (live.length === 1) return live[0];
  const c = new AbortController();
  for (const s of live) {
    if (s.aborted) { c.abort(s.reason); break; }
    s.addEventListener('abort', () => c.abort(s.reason), { once: true, signal: c.signal });
  }
  return c.signal;
}

export class KitElement extends HTMLElement {
  static props = {};
  static state = {};
  static styles = [];
  static shadow = true;
  static formAssociated = false;

  static get observedAttributes() {
    this.finalize();
    return [...this._attrs.keys()];
  }

  // Builds the accessors once per class; subclasses inherit their parent's
  // props and state.
  static finalize() {
    if (Object.hasOwn(this, '_decl')) return;
    const parent = Object.getPrototypeOf(this);
    if (parent.finalize) parent.finalize();
    const decl = { ...(parent._decl ?? {}) };
    if (Object.hasOwn(this, 'props')) {
      for (const [k, o] of Object.entries(this.props)) {
        const type = o.type ?? String;
        decl[k] = { ...o, type, attr: o.attribute !== false && type.name in fromAttr ? (o.attribute ?? kebab(k)) : null };
      }
    }
    if (Object.hasOwn(this, 'state')) {
      for (const [k, v] of Object.entries(this.state)) decl[k] = { default: v, attr: null };
    }
    this._decl = decl;
    this._attrs = new Map(Object.entries(decl).filter(([, o]) => o.attr).map(([k, o]) => [o.attr, k]));
    for (const name of Object.keys(decl)) {
      if (Object.hasOwn(this.prototype, name)) continue;
      Object.defineProperty(this.prototype, name, {
        configurable: true,
        get() { return this.__values.get(name); },
        set(next) {
          const prev = this.__values.get(name);
          if (Object.is(prev, next)) return;
          this.__values.set(name, next);
          this.requestUpdate(name, prev);
        },
      });
    }
  }

  // __values is the one non-private field: the accessors defined in
  // finalize() live on subclass prototypes and need to reach it.
  __values = new Map();
  #changed = new Map();
  #pending = false;
  #connected = false;
  #rendered = false;
  #rendering = false;
  #flushing = false;
  #cycles = 0;
  #reflecting = false;
  #upgraded = false;
  #controller = null;
  #tasks = new Map();
  #complete = Promise.resolve(true);

  constructor() {
    super();
    const C = this.constructor;
    C.finalize();
    for (const [k, o] of Object.entries(C._decl)) {
      const d = typeof o.default === 'function' ? o.default() : o.default;
      this.__values.set(k, d);
      if (o.reflect && d !== undefined) this.#changed.set(k, undefined); // reflected on first update
    }
    if (C.formAssociated) this.internals = this.attachInternals();
    this.renderRoot = C.shadow ? (this.shadowRoot ?? this.attachShadow({ mode: 'open', delegatesFocus: C.delegatesFocus ?? false })) : this;
  }

  /** Resolves after the pending render (true) or false if the update loop was stopped. */
  get updateComplete() { return this.#complete; }

  /** Aborts when the element leaves the page: pass it to fetch and addEventListener. */
  get signal() { return this.#controller?.signal; }

  connectedCallback() {
    this.#connected = true;
    this.#controller = new AbortController();
    if (!this.#upgraded) {
      this.#upgraded = true;
      // Properties set before the element was defined (el.items = […] on an
      // unupgraded tag) are own properties hiding the accessors: re-apply them.
      for (const k of Object.keys(this.constructor._decl)) {
        if (Object.hasOwn(this, k)) {
          const v = this[k];
          delete this[k];
          this[k] = v;
        }
      }
      if (this.shadowRoot && this.constructor.styles.length) this.shadowRoot.adoptedStyleSheets = [...this.constructor.styles];
    }
    this.connected?.();
    this.requestUpdate();
  }

  disconnectedCallback() {
    this.#connected = false;
    this.#controller?.abort();
    for (const c of this.#tasks.values()) c.abort();
    this.#tasks.clear();
    this.disconnected?.();
  }

  attributeChangedCallback(attr, _old, value) {
    if (this.#reflecting) return;
    const name = this.constructor._attrs.get(attr);
    const { type } = this.constructor._decl[name];
    this[name] = fromAttr[type.name](value);
  }

  /** Schedules one render for this microtask. Called by every property write. */
  requestUpdate(name, prev) {
    if (this.#rendering) console.warn(`[kit] <${this.localName}> changed "${String(name)}" during render(); render must not change state`);
    if (name !== undefined && !this.#changed.has(name)) this.#changed.set(name, prev);
    if (this.#pending) return;
    if (this.#flushing) {
      // A change from willUpdate/updated starts another cycle; stop runaway loops.
      if (++this.#cycles > MAX_CYCLES) {
        console.error(`[kit] <${this.localName}> updated itself ${MAX_CYCLES} times in a row; stopping. Check updated() for a state change that always differs.`);
        this.#changed.clear();
        this.#complete = Promise.resolve(false);
        return;
      }
    } else {
      this.#cycles = 0;
    }
    this.#pending = true;
    this.#complete = Promise.resolve().then(() => this.#flush());
  }

  #flush() {
    this.#pending = false;
    if (!this.#connected) return true; // connectedCallback asks again
    const changed = this.#changed;
    this.#changed = new Map();
    this.#flushing = true;
    try {
      this.willUpdate?.(changed);
      this.#reflect(changed);
      if (typeof this.render === 'function') {
        this.#rendering = true;
        const out = this.render();
        this.#rendering = false;
        if (out !== undefined) render(out, this.renderRoot);
      }
      if (!this.#rendered) {
        this.#rendered = true;
        this.firstUpdated?.(changed);
      }
      this.updated?.(changed);
    } catch (err) {
      console.error(`[kit] <${this.localName}> failed to update`, err);
    } finally {
      this.#rendering = false;
      this.#flushing = false;
    }
    return this.#pending ? this.#complete : true;
  }

  #reflect(changed) {
    this.#reflecting = true; // stops attribute -> property -> attribute loops
    try {
      for (const name of changed.keys()) {
        const o = this.constructor._decl[name];
        if (!o?.reflect || !o.attr) continue;
        const v = toAttr[o.type.name](this[name]);
        if (v === null) this.removeAttribute(o.attr);
        else if (this.getAttribute(o.attr) !== v) this.setAttribute(o.attr, v);
      }
    } finally {
      this.#reflecting = false;
    }
  }

  /**
   * Latest-wins async work: a newer call with the same key aborts the older
   * one, and so does leaving the page. Resolves undefined when superseded.
   */
  async run(key, fn) {
    this.#tasks.get(key)?.abort();
    const controller = new AbortController();
    this.#tasks.set(key, controller);
    const signal = anySignal(controller.signal, this.signal);
    try {
      const out = await fn(signal);
      return signal.aborted ? undefined : out;
    } catch (err) {
      if (signal.aborted) return undefined;
      throw err;
    } finally {
      if (this.#tasks.get(key) === controller) this.#tasks.delete(key);
    }
  }

  /** Dispatches a bubbling, composed CustomEvent. Returns false if a listener cancelled it. */
  emit(name, detail, { cancelable = false } = {}) {
    return this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true, cancelable }));
  }
}
