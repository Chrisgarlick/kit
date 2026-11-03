// SPDX-License-Identifier: MIT
//
// define(tag, Class) registers a custom element once. On pages where two
// copies of kit load (WordPress plugins with their own copies), the second
// define of a tag is skipped with a warning instead of throwing.

export function define(tag, cls) {
  const existing = customElements.get(tag);
  if (existing) {
    if (existing !== cls) console.warn(`[kit] <${tag}> is already defined by another copy of kit (${existing.version ?? 'unknown version'}); keeping that one`);
    return existing;
  }
  customElements.define(tag, cls);
  return cls;
}
