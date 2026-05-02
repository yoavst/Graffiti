/** Ctrl+Enter (Windows/Linux) or ⌘+Enter (macOS). */
export function isModEnter(e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey'>): boolean {
  return e.key === 'Enter' && (e.ctrlKey || e.metaKey);
}
