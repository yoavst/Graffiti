// Dispatcher for inbound websocket messages. Runs at the WS boundary,
// validates with Zod, and routes to either the legacy handler or the MCP
// handler. Unknown messages are logged and dropped (forward-compat).

import { addDataBulkSchema, addDataSchema, mcpRequestSchema, updateNodesSchema } from './types';
import { handleAddData, handleAddDataBulk, handleUpdateNodes } from './legacy';
import { handleMcp } from './mcp';
import type { GraphActions, GraphRuntime } from '@/state/graph';
import type { WSClient } from '../websocket';
import type { JotaiStore } from '@/state/store';
import { graphsAtom } from '@/state/workspaces';

export interface DispatchEnv {
  store: JotaiStore;
  /**
   * Look up the active graph runtime + actions. The dispatcher targets the
   * currently-selected graph for legacy messages; MCP messages may target a
   * specific `graphId`.
   */
  getCurrentGraph: () => { graphId: string; rt: GraphRuntime; actions: GraphActions } | null;
  getGraph: (graphId: string) => { graphId: string; rt: GraphRuntime; actions: GraphActions } | null;
  ws: WSClient | null;
  /** Header switches */
  isExistingToNew: () => boolean;
  isNewWillBeSelected: () => boolean;
}

export function dispatchInbound(env: DispatchEnv, raw: unknown) {
  if (!raw || typeof raw !== 'object') return;
  const type = (raw as { type?: string }).type;
  if (!type) return;

  switch (type) {
    case 'addData': {
      const parsed = addDataSchema.safeParse(raw);
      if (!parsed.success) return console.warn('addData parse failed', parsed.error);
      const target = env.getCurrentGraph();
      if (!target) return;
      const pendingNodeTheme = env.store
        .get(graphsAtom)
        .find((t) => t.id === target.graphId)?.pendingNodeTheme;
      handleAddData(
        {
          rt: target.rt,
          actions: target.actions,
          isExistingToNew: env.isExistingToNew(),
          isNewWillBeSelected: env.isNewWillBeSelected(),
          pendingNodeTheme,
        },
        parsed.data,
      );
      return;
    }
    case 'addDataBulk': {
      const parsed = addDataBulkSchema.safeParse(raw);
      if (!parsed.success) return console.warn('addDataBulk parse failed', parsed.error);
      const target = env.getCurrentGraph();
      if (!target) return;
      const pendingNodeTheme = env.store
        .get(graphsAtom)
        .find((t) => t.id === target.graphId)?.pendingNodeTheme;
      handleAddDataBulk(
        {
          rt: target.rt,
          actions: target.actions,
          isExistingToNew: env.isExistingToNew(),
          isNewWillBeSelected: env.isNewWillBeSelected(),
          pendingNodeTheme,
        },
        parsed.data,
      );
      return;
    }
    case 'updateNodes': {
      const parsed = updateNodesSchema.safeParse(raw);
      if (!parsed.success) return console.warn('updateNodes parse failed', parsed.error);
      // Apply to all tabs (matches legacy behavior).
      // In our atoms we don't have a list iterator yet; for now just current.
      const target = env.getCurrentGraph();
      if (!target) return;
      handleUpdateNodes(target.rt, target.actions, parsed.data);
      return;
    }
    default: {
      if (type.startsWith('mcp_')) {
        const parsed = mcpRequestSchema.safeParse(raw);
        if (!parsed.success) return console.warn('mcp parse failed', parsed.error);
        void handleMcp(env, parsed.data as Record<string, unknown> & { type: string });
        return;
      }
      // Unknown — ignore.
      console.debug('unknown ws message', type);
    }
  }
}
