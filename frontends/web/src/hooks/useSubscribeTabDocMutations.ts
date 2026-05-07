import { useAtomValue } from 'jotai';
import { tabTickAtom } from '@/state/graph';

/** Subscribe so this component re-renders when the tab graph mutates (doc is updated in place; tick bumps). */
export function useSubscribeTabDocMutations(tabId: string): void {
  useAtomValue(tabTickAtom(tabId));
}
