// URL state: ?workspace=<id>&graph=<id>&pane2=<id>
//
// Updates use history.replaceState so they don't pollute browser history.

const KEYS = ['workspace', 'graph', 'pane2'] as const;
type Key = (typeof KEYS)[number];

export function readUrlState(): Partial<Record<Key, string>> {
  if (typeof location === 'undefined') return {};
  const params = new URLSearchParams(location.search);
  const out: Partial<Record<Key, string>> = {};
  for (const k of KEYS) {
    const v = params.get(k);
    if (v) out[k] = v;
  }
  return out;
}

export function writeUrlState(state: Partial<Record<Key, string | null>>) {
  if (typeof location === 'undefined') return;
  const url = new URL(location.href);
  for (const k of KEYS) {
    if (!(k in state)) continue;
    const v = state[k];
    if (v == null || v === '') url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  }
  history.replaceState(null, '', url.toString());
}
