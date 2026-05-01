// Port of updateNodeProperties / formatString from legacy TabController.js.
// `computedProperties` lets the backend describe a label as a format string
// over other extra-fields, so a rename (updateNodes) can re-derive the label.

import type { NodeExtra } from './model';

function formatString(s: string, replacements: unknown[]): string {
  let str = s;
  for (let i = 0; i < replacements.length; i++) {
    str = str.replace(new RegExp(`\\{${i}\\}`, 'gi'), String(replacements[i] ?? ''));
  }
  return str;
}

/**
 * Apply `extra.computedProperties` in-place. After this, fields named by
 * each computed property (commonly `label`) are derived from the named
 * source fields using a format string.
 */
export function applyComputedProperties(extra: NodeExtra): void {
  const computed = extra.computedProperties;
  if (!computed) return;
  for (const { name, format, replacements } of computed) {
    const values = replacements.map((field) => extra[field]);
    (extra as Record<string, unknown>)[name] = formatString(format, values);
  }
}
