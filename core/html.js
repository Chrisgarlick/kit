// SPDX-License-Identifier: MIT
//
// kit's template renderer: html`` and svg`` tagged templates that render into
// a container and, on later renders, update only the parts that changed.
// Inputs keep their focus and caret because their nodes persist.
//
// Safe by default:
//   - ${values} in content are always text, never HTML;
//   - attribute values go through setAttribute, which never parses HTML;
//   - URL attributes (href, src, action…) only accept http(s), mailto, tel,
//     same-origin blob: and relative URLs; anything else becomes "#";
//   - bindings to on* attributes or properties, srcdoc, innerHTML and
//     outerHTML throw, and style only takes a styleMap() of custom
//     properties;
//   - html must be used as a tagged template literal, so a string from
//     elsewhere can never become a template.

const RESULT = Symbol('kit.result');
const DIRECTIVE = Symbol('kit.directive');
const MARK = 'kit' + Math.random().toString(36).slice(2, 8);
const MARK_RE = new RegExp(MARK + '(\\d+)', 'g');
const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title', 'xmp', 'noscript']);
const URL_ATTRS = new Set(['href', 'src', 'action', 'formaction', 'poster', 'xlink:href', 'cite', 'background', 'ping', 'data']);
const BLOCKED_ATTRS = new Set(['srcdoc']);
const BLOCKED_PROPS = new Set(['innerhtml', 'outerhtml', 'srcdoc']);
const URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

const templates = { html: new WeakMap(), svg: new WeakMap() };
const roots = new WeakMap();

// Under a Trusted Types policy, the one HTML sink (parsing a template's own
// static strings) goes through a named policy.
const policy = globalThis.trustedTypes?.createPolicy?.('kit', { createHTML: (s) => s });

function tag(kind) {
  return (strings, ...values) => {
    // Template literals carry .raw; a string or a concatenation does not.
    if (!Array.isArray(strings) || !Array.isArray(strings.raw)) {
      throw new TypeError(`${kind} must be used as a tagged template literal`);
    }
    return { [RESULT]: kind, strings, values };
  };
}

/** A template of HTML. */
export const html = tag('html');
/** A template of SVG elements, for use inside an <svg> (charts, icons). */
export const svg = tag('svg');

/** True when v is the result of html`` or svg``. */
export const isTemplate = (v) => v != null && v[RESULT] !== undefined;

/**
 * Keyed list: items are matched by key between renders, so moved rows keep
 * their DOM (focus, input values, transitions) instead of being rebuilt.
 */
export const repeat = (items, key, template) => ({ [DIRECTIVE]: 'repeat', items: [...items], key, template });

/**
 * Styles for a style="${…}" binding. Only custom properties (--name) are
 * set, through the CSSOM, so it works under a strict style-src CSP and can't
 * inject CSS. Components read them: width: var(--bar-width).
 */
export const styleMap = (props) => ({ [DIRECTIVE]: 'style', props });

/** Returns url when it is safe for a URL attribute, otherwise "#". */
export function safeUrl(url) {
  const value = String(url ?? '').trim();
  if (value === '') return value;
  try {
    const u = new URL(value, document.baseURI);
    if (URL_PROTOCOLS.has(u.protocol)) return value;
    if (u.protocol === 'blob:' && u.origin === location.origin) return value;
  } catch { /* not a URL at all */ }
  return '#';
}

// ---------------------------------------------------------------- parsing

// prepare turns a template's static strings into a <template> with markers
// where the values go: a comment for content, a marker inside attribute
// values. A small scanner tracks where each hole falls (text, attribute
// value, comment, raw text), so a ">" inside an attribute can't confuse it.
function prepare(kind, strings) {
  let out = '';
  const names = []; // per hole: the attribute name as written (case kept)
  let state = 'text';
  let tagName = '';
  let closing = false;
  let attr = '';
  let rawTag = '';

  for (let i = 0; i < strings.length; i++) {
    const s = strings[i];
    for (let j = 0; j < s.length; j++) {
      const c = s[j];
      switch (state) {
        case 'text':
          if (c === '<') {
            if (s.startsWith('!--', j + 1)) { state = 'comment'; j += 3; }
            else if (/[a-zA-Z/]/.test(s[j + 1] ?? '')) { state = 'tagName'; tagName = ''; closing = s[j + 1] === '/'; if (closing) j++; }
          }
          break;
        case 'tagName':
          if (/[\s/>]/.test(c)) { state = c === '>' ? endTag() : 'tag'; } else tagName += c.toLowerCase();
          break;
        case 'tag':
          if (c === '>') state = endTag();
          else if (!/[\s/]/.test(c)) { state = 'attrName'; attr = c; }
          break;
        case 'attrName':
          if (c === '=') state = 'beforeValue';
          else if (c === '>') state = endTag();
          else if (/[\s/]/.test(c)) state = 'afterAttrName';
          else attr += c;
          break;
        case 'afterAttrName':
          if (c === '=') state = 'beforeValue';
          else if (c === '>') state = endTag();
          else if (!/[\s/]/.test(c)) { state = 'attrName'; attr = c; }
          break;
        case 'beforeValue':
          if (c === '"') state = 'dq';
          else if (c === "'") state = 'sq';
          else if (c === '>') state = endTag();
          else if (!/\s/.test(c)) state = 'uq';
          break;
        case 'dq': if (c === '"') state = 'tag'; break;
        case 'sq': if (c === "'") state = 'tag'; break;
        case 'uq':
          if (c === '>') state = endTag();
          else if (/\s/.test(c)) state = 'tag';
          break;
        case 'comment':
          if (s.startsWith('-->', j)) { state = 'text'; j += 2; }
          break;
        case 'raw':
          if (c === '<' && s.slice(j + 1, j + 2 + rawTag.length).toLowerCase() === '/' + rawTag) { state = 'tagName'; tagName = ''; closing = true; j++; }
          break;
      }
    }
    out += s;
    if (i === strings.length - 1) break;

    // A hole: what kind depends on where the scanner stopped.
    if (state === 'text') {
      out += `<!--${MARK}${i}-->`;
    } else if (state === 'dq' || state === 'sq' || state === 'uq' || state === 'beforeValue') {
      if (state === 'beforeValue') state = 'uq';
      names[i] = attr;
      out += MARK + i;
    } else if (state === 'raw') {
      throw new Error(`kit: no bindings inside <${rawTag}> (use .value= on a textarea)`);
    } else if (state === 'comment') {
      throw new Error('kit: no bindings inside comments');
    } else {
      throw new Error('kit: a binding must be an attribute value (name="${…}") or content, not a bare ${…} inside a tag');
    }
  }
  if (state !== 'text') throw new Error('kit: the template ends inside a tag or comment');

  const t = document.createElement('template');
  const source = kind === 'svg' ? `<svg>${out}</svg>` : out;
  t.innerHTML = policy ? policy.createHTML(source) : source; // static, developer-written strings only
  if (kind === 'svg') {
    const wrapper = t.content.firstChild;
    t.content.replaceChildren(...wrapper.childNodes);
  }
  return { template: t, names };

  function endTag() {
    if (!closing && RAW_TEXT.has(tagName)) { rawTag = tagName; return 'raw'; }
    return 'text';
  }
}

// ---------------------------------------------------------------- instances

class Instance {
  constructor(result) {
    this.kind = result[RESULT];
    this.strings = result.strings;
    const cache = templates[this.kind];
    let prepared = cache.get(this.strings);
    if (!prepared) cache.set(this.strings, (prepared = prepare(this.kind, this.strings)));
    this.fragment = document.importNode(prepared.template.content, true);
    this.parts = [];
    const found = [];
    const walker = document.createTreeWalker(this.fragment, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT);
    while (walker.nextNode()) found.push(walker.currentNode);
    for (const node of found) {
      if (node.nodeType === Node.COMMENT_NODE) {
        if (node.data.startsWith(MARK)) this.parts.push(new ChildPart(node, Number(node.data.slice(MARK.length))));
        continue;
      }
      for (const a of [...node.attributes]) {
        if (!a.value.includes(MARK)) continue;
        node.removeAttribute(a.name);
        const idx = [...a.value.matchAll(MARK_RE)].map((m) => Number(m[1]));
        this.parts.push(new AttrPart(node, prepared.names[idx[0]] ?? a.name, a.value, idx));
      }
    }
    this.update(result.values);
  }
  update(values) {
    for (const p of this.parts) p.commit(values);
  }
}

class ChildPart {
  // start is a marker node already in the DOM; content goes after it.
  constructor(start, idx) {
    this.start = start;
    this.idx = idx;
    this.end = document.createComment('');
    start.after(this.end);
    this.value = undefined; // Instance | Text | Node | ChildPart[] | keyed Map
  }
  commit(values) { this.set(values[this.idx]); }
  clear() {
    for (let n = this.start.nextSibling; n && n !== this.end; n = this.start.nextSibling) n.remove();
    this.value = undefined;
  }
  // Every node this part owns, start and end markers included.
  nodes() {
    const out = [this.start];
    for (let n = this.start.nextSibling; n && n !== this.end; n = n.nextSibling) out.push(n);
    out.push(this.end);
    return out;
  }
  set(v) {
    if (isTemplate(v)) {
      if (this.value instanceof Instance && this.value.strings === v.strings) return this.value.update(v.values);
      this.clear();
      const inst = new Instance(v);
      this.end.before(inst.fragment);
      this.value = inst;
    } else if (v?.[DIRECTIVE] === 'repeat') {
      this.setKeyed(v);
    } else if (Array.isArray(v) || (v != null && typeof v !== 'string' && typeof v[Symbol.iterator] === 'function')) {
      this.setList([...v]);
    } else if (v instanceof Node) {
      if (this.value === v) return;
      this.clear();
      this.end.before(v);
      this.value = v;
    } else {
      const text = v == null || v === false ? '' : String(v); // always a text node
      if (this.value instanceof Text) {
        if (this.value.data !== text) this.value.data = text;
      } else {
        this.clear();
        this.value = document.createTextNode(text);
        this.end.before(this.value);
      }
    }
  }
  // Unkeyed lists reuse parts by position, adding or removing at the end.
  setList(items) {
    if (!Array.isArray(this.value) || this.value.keyed) { this.clear(); this.value = []; }
    const parts = this.value;
    items.forEach((item, i) => {
      if (!parts[i]) {
        const m = document.createComment('');
        this.end.before(m);
        parts[i] = new ChildPart(m, 0);
      }
      parts[i].set(item);
    });
    for (const p of parts.splice(items.length)) for (const n of p.nodes()) n.remove();
  }
  // Keyed lists match items by key and move existing DOM into the new order.
  setKeyed({ items, key, template }) {
    if (!(this.value instanceof Map)) { this.clear(); this.value = new Map(); }
    const old = this.value;
    const next = new Map();
    items.forEach((item, i) => {
      const k = key(item, i);
      if (next.has(k)) throw new Error(`kit: repeat() key ${String(k)} is used twice`);
      let part = old.get(k);
      if (!part) {
        const m = document.createComment('');
        this.end.before(m);
        part = new ChildPart(m, 0);
      }
      part.set(template(item, i));
      next.set(k, part);
    });
    for (const [k, p] of old) if (!next.has(k)) for (const n of p.nodes()) n.remove();
    // Put the parts in order, moving only those that are out of place.
    let cursor = this.start;
    for (const p of next.values()) {
      if (cursor.nextSibling !== p.start) {
        const frag = document.createDocumentFragment();
        frag.append(...p.nodes());
        cursor.after(frag);
      }
      cursor = p.end;
    }
    this.value = next;
  }
}

class AttrPart {
  constructor(el, name, raw, idx) {
    this.el = el;
    this.idx = idx;
    this.statics = raw.split(MARK_RE).filter((_, i) => i % 2 === 0);
    this.prefix = /^[@.?]/.test(name) ? name[0] : '';
    const [base, ...mods] = (this.prefix ? name.slice(1) : name).split(this.prefix === '@' ? '.' : /(?!)/);
    this.name = base;
    const lower = base.toLowerCase();
    if (this.prefix !== '@' && lower.startsWith('on')) throw new Error(`kit: binding "${name}" is not allowed; use @${lower.slice(2)}=`);
    if (this.prefix === '' && BLOCKED_ATTRS.has(lower)) throw new Error(`kit: binding "${name}" is not allowed`);
    if (this.prefix === '.' && BLOCKED_PROPS.has(lower)) throw new Error(`kit: binding "${name}" is not allowed; content is always text`);
    if ((this.prefix === '@' || this.prefix === '.' || this.prefix === '?') && idx.length > 1) throw new Error(`kit: "${name}" takes a single value`);
    this.url = URL_ATTRS.has(lower);
    if (this.prefix === '@') {
      const opts = { passive: mods.includes('passive'), capture: mods.includes('capture'), once: mods.includes('once') };
      this.handler = (e) => this.fn?.call(el, e); // always the latest function
      el.addEventListener(base, this.handler, opts);
    }
  }
  commit(values) {
    const { el, prefix, name } = this;
    const v = values[this.idx[0]];
    if (prefix === '@') {
      if (v != null && typeof v !== 'function') throw new TypeError(`kit: @${name} needs a function`);
      this.fn = v;
      return;
    }
    if (prefix === '?') { el.toggleAttribute(name, Boolean(v)); return; }
    if (prefix === '.') {
      const next = this.url ? safeUrl(v) : v;
      if (el[name] !== next) el[name] = next; // the guard keeps the caret in inputs
      return;
    }
    if (name.toLowerCase() === 'style') { this.setStyle(v); return; }
    if (this.idx.length === 1 && this.statics[0] === '' && this.statics[1] === '' && (v == null || v === false)) {
      if (this.prev !== null) { el.removeAttribute(name); this.prev = null; }
      return;
    }
    let out = this.statics[0];
    this.idx.forEach((i, n) => { out += String(values[i] ?? '') + this.statics[n + 1]; });
    if (this.url) out = safeUrl(out);
    if (this.prev !== out) { el.setAttribute(name, out); this.prev = out; }
  }
  setStyle(v) {
    if (v?.[DIRECTIVE] !== 'style') throw new Error('kit: style="${…}" takes styleMap({ "--name": value })');
    const seen = new Set();
    for (const [k, val] of Object.entries(v.props)) {
      if (!k.startsWith('--')) throw new Error(`kit: styleMap only sets custom properties (--name), not "${k}"`);
      seen.add(k);
      if (val == null || val === false) this.el.style.removeProperty(k);
      else this.el.style.setProperty(k, String(val));
    }
    for (const k of this.prevStyle ?? []) if (!seen.has(k)) this.el.style.removeProperty(k);
    this.prevStyle = seen;
  }
}

/**
 * Renders a template into container. The first render builds the DOM; later
 * renders of the same template only update what changed.
 */
export function render(result, container) {
  if (!isTemplate(result)) throw new TypeError('kit: render() takes the result of html`` or svg``');
  const current = roots.get(container);
  if (current && current.strings === result.strings) return current.update(result.values);
  const inst = new Instance(result);
  container.replaceChildren(inst.fragment);
  roots.set(container, inst);
}
