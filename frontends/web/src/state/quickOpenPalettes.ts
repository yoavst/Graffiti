import { atom } from 'jotai';

export const tabJumpPaletteOpenAtom = atom(false);
export const nodeSearchPaletteOpenAtom = atom(false);

/** `currentTab` = active graph only (Mod+F). `allTabs` = workspace (Mod+Shift+F), jumps open on primary. */
export type NodeSearchScope = 'currentTab' | 'allTabs';
export const nodeSearchScopeAtom = atom<NodeSearchScope>('currentTab');
