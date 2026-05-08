import { atom } from 'jotai';

/** At most one of these UI surfaces is open at a time (plus imperative `dialogAtom` alerts). */
export type AppOverlay =
  | 'none'
  | 'commandPalette'
  | 'graphJump'
  | 'nodeSearch'
  | 'shareGraph'
  | 'token'
  | 'help';

export const appOverlayAtom = atom<AppOverlay>('none');
