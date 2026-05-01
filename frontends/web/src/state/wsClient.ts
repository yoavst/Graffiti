import { atom } from 'jotai';
import type { WSClient } from '@/network/websocket';

export const wsClientAtom = atom<WSClient | null>(null);
