import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Dark mode is always on; light mode is intentionally not supported. We
// keep the atom (read-only, always true) so existing call sites still
// compile.
export const darkModeAtom = atom(true);
export const isCurvedEdgesAtom = atomWithStorage<boolean>('isCurvedEdges', false);
export const isKeymapReversedAtom = atomWithStorage<boolean>('isKeymapReversed', false);
export const hoverDocAtom = atomWithStorage<boolean>('hoverDoc', false);
export const isDomainModeAtom = atomWithStorage<boolean>(
  'isDomainMode',
  // localhost: doesn't matter; graffiti.quest: don't enable.
  typeof location !== 'undefined' && location.hostname !== 'graffiti.quest',
);

export const isExistingToNewAtom = atomWithStorage<boolean>('isExistingToNew', true);
export const isNewWillBeSelectedAtom = atomWithStorage<boolean>(
  'isNewWillBeSelected',
  true,
);

export const sidebarVisibleAtom = atomWithStorage<boolean>('sidebarVisible', true);
export const inspectorVisibleAtom = atomWithStorage<boolean>('inspectorVisible', true);

export const mruMountSizeAtom = atomWithStorage<number>('mruMountSize', 8);

// Light mode is no longer supported; strip any leftover `light` class set
// by an older build before the user upgraded.
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('light');
}
