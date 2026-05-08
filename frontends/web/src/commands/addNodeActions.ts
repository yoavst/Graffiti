// User-initiated "add text node" / "add comment to selected node" actions.
// Mirrors the legacy event_addTextNode / event_addComment helpers in
// scripts/main.js — both reuse the same addNodeAndEdge pipeline as inbound
// websocket messages so undo, dedupe, and pen-color all behave identically.

import { normalizePendingNodeTheme } from '@/graph/model';
import { handleAddData } from '@/network/protocol/legacy';
import { graphsAtom } from '@/state/workspaces';
import { isExistingToNewAtom, isNewWillBeSelectedAtom } from '@/state/settings';
import { getActiveGraphFromStore } from '@/state/registry';
import { dialogs } from '@/ui/dialogs/Dialogs';
import type { JotaiStore } from '@/state/store';

const TEXTAREA_FOOTER = 'Use **bold** or *italic* — markdown is supported.';

export async function addTextNodeAction(store: JotaiStore): Promise<void> {
  const target = getActiveGraphFromStore(store);
  if (!target) {
    await dialogs.alert('No active graph.', { title: 'Add text node' });
    return;
  }

  const value = await dialogs.prompt(TEXTAREA_FOOTER, {
    title: 'Add text node',
    multiline: true,
    placeholder: 'Text…',
  });
  if (value == null || value === '') return;

  const pendingNodeTheme = normalizePendingNodeTheme(
    store.get(graphsAtom).find((g) => g.id === target.graphId)?.pendingNodeTheme as unknown,
  );

  handleAddData(
    {
      rt: target.rt,
      actions: target.actions,
      isExistingToNew: store.get(isExistingToNewAtom),
      isNewWillBeSelected: store.get(isNewWillBeSelectedAtom),
      pendingNodeTheme,
    },
    {
      type: 'addData',
      node: { label: value, isMarkdown: true },
      edge: {},
    },
  );
}

export async function addCommentAction(store: JotaiStore): Promise<void> {
  const target = getActiveGraphFromStore(store);
  if (!target) {
    await dialogs.alert('No active graph.', { title: 'Add comment' });
    return;
  }
  if (target.rt.selectedNodeId == null) {
    await dialogs.alert('Select a node first to attach a comment to it.', {
      title: 'No selected node',
    });
    return;
  }

  const value = await dialogs.prompt(TEXTAREA_FOOTER, {
    title: 'Add comment',
    multiline: true,
    placeholder: 'Comment…',
  });
  if (value == null || value === '') return;

  const pendingNodeTheme = normalizePendingNodeTheme(
    store.get(graphsAtom).find((g) => g.id === target.graphId)?.pendingNodeTheme as unknown,
  );

  // Comments always hang off the selected node (selected → new), regardless
  // of the global existing→new toggle. Match the legacy event_addComment.
  handleAddData(
    {
      rt: target.rt,
      actions: target.actions,
      isExistingToNew: true,
      isNewWillBeSelected: store.get(isNewWillBeSelectedAtom),
      pendingNodeTheme,
    },
    {
      type: 'addData',
      node: { label: value, isMarkdown: true, isComment: true, isUnclickable: true },
      edge: { isExistingToNew: true },
    },
  );
}
