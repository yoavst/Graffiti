import { atom } from 'jotai';

/** `currentGraph` = active graph only (Mod+F). `allGraphs` = workspace (Mod+Shift+F), jumps open on primary. */
export type NodeSearchScope = 'currentGraph' | 'allGraphs';
export const nodeSearchScopeAtom = atom<NodeSearchScope>('currentGraph');
