import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'auth_required' | 'closed' | 'error';

export const lastConnectedUrlAtom = atomWithStorage<string>('lastConnectedUrl', '');
export const authTokenAtom = atomWithStorage<string | null>('authToken', null);

export const connectionStatusAtom = atom<ConnectionStatus>('idle');
export const connectionUrlAtom = atom<string>('');

export function defaultSocketUrl(isDomain: boolean): string {
  if (typeof location === 'undefined') return 'ws://localhost:8503';
  const forceWs = location.hostname === 'graffiti.quest';
  const protocol = location.protocol === 'https:' && !forceWs ? 'wss' : 'ws';
  const host = isDomain ? location.hostname : 'localhost';
  return `${protocol}://${host}:8503`;
}
