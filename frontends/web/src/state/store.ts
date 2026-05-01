// Single Jotai store handle so non-React code (the websocket dispatcher,
// command palette, etc.) can read/write atoms without a Provider tree.

import { createStore } from 'jotai';

export type JotaiStore = ReturnType<typeof createStore>;

let store: JotaiStore | null = null;

export function getStore(): JotaiStore {
  if (!store) store = createStore();
  return store;
}
