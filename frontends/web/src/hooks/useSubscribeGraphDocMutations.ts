import { useAtomValue } from 'jotai';
import { graphTickAtom } from '@/state/graph';

/** Subscribe so this component re-renders when the graph mutates (doc is updated in place; tick bumps). */
export function useSubscribeGraphDocMutations(graphId: string): void {
  useAtomValue(graphTickAtom(graphId));
}

