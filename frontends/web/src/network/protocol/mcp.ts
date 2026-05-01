// MCP request/response handlers. Additive — does not affect legacy traffic.
//
// Each request carries a `requestId`; the response echoes it.
// Errors are returned as `{type:"mcp_error", requestId, code, message}`.

import {
  applyComputedProperties,
} from '@/graph/computedProperties';
import {
  type Op,
  descendants,
  findNode,
  nextId,
  queryNodes,
} from '@/graph/reducer';
import type { GEdge, GNode, NodeExtra } from '@/graph/model';
import type { DispatchEnv } from './dispatch';
import { db } from '@/persistence/db';
import { newId } from '@/util/ids';
import type { SelectionV1, SelectionV2 } from './selection';

type Req = Record<string, unknown> & { type: string; requestId?: string };

function reply(env: DispatchEnv, req: Req, payload: Record<string, unknown>) {
  if (!env.ws) return;
  env.ws.send({
    type: req.type + '_response',
    requestId: req.requestId,
    ...payload,
  });
}

function err(env: DispatchEnv, req: Req, code: string, message: string) {
  if (!env.ws) return;
  env.ws.send({
    type: 'mcp_error',
    requestId: req.requestId,
    code,
    message,
  });
}

function targetTab(env: DispatchEnv, req: Req) {
  const tabId = req.tabId as string | undefined;
  if (tabId) return env.getTab(tabId);
  return env.getCurrentTab();
}

export async function handleMcp(env: DispatchEnv, req: Req) {
  switch (req.type) {
    case 'mcp_list_workspaces': {
      const ws = await db.workspaces.orderBy('orderIndex').toArray();
      const groups = await db.tabGroups.orderBy('orderIndex').toArray();
      const tabs = await db.tabs.orderBy('orderIndex').toArray();
      const out = ws.map((w) => ({
        id: w.id,
        name: w.name,
        tabGroups: groups
          .filter((g) => g.workspaceId === w.id)
          .map((g) => ({
            id: g.id,
            name: g.name,
            color: g.color,
            tabs: tabs
              .filter((t) => t.tabGroupId === g.id)
              .map((t) => ({ id: t.id, name: t.name })),
          })),
      }));
      return reply(env, req, { workspaces: out });
    }

    case 'mcp_list_tabs': {
      const wsid = req.workspaceId as string | undefined;
      let tabs = await db.tabs.orderBy('orderIndex').toArray();
      if (wsid) {
        const groups = await db.tabGroups.where('workspaceId').equals(wsid).toArray();
        const groupIds = new Set(groups.map((g) => g.id));
        tabs = tabs.filter((t) => groupIds.has(t.tabGroupId));
      }
      const graphs = await db.graphs.toArray();
      const counts = new Map(graphs.map((g) => [g.tabId, g.doc.nodes.length] as const));
      return reply(env, req, {
        tabs: tabs.map((t) => ({
          id: t.id,
          name: t.name,
          tabGroupId: t.tabGroupId,
          nodeCount: counts.get(t.id) ?? 0,
        })),
      });
    }

    case 'mcp_get_graph': {
      const t = targetTab(env, req);
      if (!t) return err(env, req, 'no_tab', 'no current tab');
      return reply(env, req, {
        nodes: t.rt.doc.nodes,
        edges: t.rt.doc.edges,
        idCounter: t.rt.doc.idCounter,
      });
    }

    case 'mcp_query_nodes': {
      const t = targetTab(env, req);
      if (!t) return err(env, req, 'no_tab', 'no current tab');
      const selection = req.selection as SelectionV1 | SelectionV2;
      // Default to v2 since MCP is new.
      return reply(env, req, { nodes: queryNodes(t.rt.doc, selection, 2) });
    }

    case 'mcp_add_node': {
      const t = targetTab(env, req);
      if (!t) return err(env, req, 'no_tab', 'no current tab');
      const incoming = req.node as Partial<GNode> & { extra?: NodeExtra };
      const extra: NodeExtra = (incoming?.extra ?? incoming ?? {}) as NodeExtra;
      applyComputedProperties(extra);
      const id = nextId(t.rt.doc);
      const node: GNode = {
        id,
        label: ((extra as Record<string, unknown>).label as string) ?? incoming?.label ?? 'node',
        extra,
      };
      const ops: Op[] = [{ type: 'addNode', data: node }];
      const parentId = req.parent as number | undefined;
      const direction = req.direction as 'e2n' | 'n2e' | undefined;
      const isExistingToNew = direction
        ? direction === 'e2n'
        : env.isExistingToNew();
      if (parentId !== undefined && findNode(t.rt.doc, parentId)) {
        const eid = nextId(t.rt.doc);
        const from = isExistingToNew ? parentId : id;
        const to = isExistingToNew ? id : parentId;
        ops.push({ type: 'addEdge', data: { id: eid, from, to } });
      }
      t.actions.applyTransaction(ops);
      return reply(env, req, { nodeId: id });
    }

    case 'mcp_delete_node': {
      const t = targetTab(env, req);
      if (!t) return err(env, req, 'no_tab', 'no current tab');
      const id = req.id as number;
      const node = findNode(t.rt.doc, id);
      if (!node) return err(env, req, 'no_node', 'node not found');
      const ids = req.subtree ? [...descendants(t.rt.doc, id)] : [id];
      const ops: Op[] = [];
      for (const nid of ids) {
        const n = findNode(t.rt.doc, nid);
        if (!n) continue;
        for (const e of t.rt.doc.edges.filter((ed) => ed.from === nid || ed.to === nid)) {
          ops.push({ type: 'removeEdge', data: e });
        }
        ops.push({ type: 'removeNode', data: n });
      }
      t.actions.applyTransaction(ops);
      return reply(env, req, { deletedIds: ids });
    }

    case 'mcp_add_edge': {
      const t = targetTab(env, req);
      if (!t) return err(env, req, 'no_tab', 'no current tab');
      const id = nextId(t.rt.doc);
      const e: GEdge = {
        id,
        from: req.from as number,
        to: req.to as number,
      };
      if (req.label !== undefined) e.label = req.label as string;
      if (req.style !== undefined) e.style = req.style as GEdge['style'];
      t.actions.apply({ type: 'addEdge', data: e });
      return reply(env, req, { edgeId: id });
    }

    case 'mcp_set_selected': {
      const t = targetTab(env, req);
      if (!t) return err(env, req, 'no_tab', 'no current tab');
      t.actions.select((req.id as number | null) ?? null);
      return reply(env, req, { ok: true });
    }

    case 'mcp_create_workspace': {
      const id = newId();
      await db.workspaces.put({
        id,
        name: (req.name as string) ?? 'Workspace',
        orderIndex: (await db.workspaces.count()),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return reply(env, req, { workspaceId: id });
    }

    default:
      return err(env, req, 'unsupported', `unsupported MCP type: ${req.type}`);
  }
}
