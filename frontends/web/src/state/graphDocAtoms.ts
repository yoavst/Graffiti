import { atomFamily } from 'jotai-family';
import { atomWithStorage } from 'jotai/utils';
import type { GraphDoc } from '@/graph/model';
import { graphStorageKey } from '@/state/storageKeys';
import { emptyGraphDoc } from '@/state/workspaceTypes';

export const graphDocAtomFamily = atomFamily((tabId: string) =>
  atomWithStorage<GraphDoc>(graphStorageKey(tabId), emptyGraphDoc(), undefined, {
    getOnInit: true,
  }),
);
