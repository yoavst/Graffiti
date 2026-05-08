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
import { graphDocAtomFamily } from '@/state/graphDocAtoms';
import {
  workspaceBundleAtomFamily,
  workspaceIdsAtom,
} from '@/state/workspaces';
import type { GraphRow, WorkspaceBundle } from '@/state/workspaceTypes';
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

function targetGraph(env: DispatchEnv, req: Req) {
  const graphId = req.graphId as string | undefined;
  if (graphId) return env.getGraph(graphId);
  return env.getCurrentGraph();
}

export async function handleMcp(env: DispatchEnv, req: Req) {
  const store = env.store;
  switch (req.type) {
    case 'mcp_list_workspaces': {
      const ids = store.get(workspaceIdsAtom);
      const out = ids.map((wid) => {
        const b = store.get(workspaceBundleAtomFamily(wid));
        const groups = [...b.groups].sort((a, c) => a.orderIndex - c.orderIndex);
        return {
          id: wid,
          name: b.workspace.name,
          tabGroups: groups.map((g) => ({
            id: g.id,
            name: g.name,
            color: g.color,
            graphs: b.graphs
              .filter((t) => t.graphGroupId === g.id)
              .sort((a, c) => a.orderIndex - c.orderIndex)
              .map((t) => ({ id: t.id, name: t.name })),
          })),
        };
      });
      return reply(env, req, { workspaces: out });
    }

    case 'mcp_list_graphs': {
      const wsid = req.workspaceId as string | undefined;
      const wids = store.get(workspaceIdsAtom);
      const graphRows: GraphRow[] = [];
      for (const wid of wids) {
        if (wsid !== undefined && wid !== wsid) continue;
        const b = store.get(workspaceBundleAtomFamily(wid));
        graphRows.push(...b.graphs);
      }
      graphRows.sort((a, b) =>
        a.orderIndex !== b.orderIndex ? a.orderIndex - b.orderIndex : a.id.localeCompare(b.id),
      );
      return reply(env, req, {
        graphs: graphRows.map((g) => ({
          id: g.id,
          name: g.name,
          graphGroupId: g.graphGroupId,
          nodeCount: store.get(graphDocAtomFamily(g.id)).nodes.length,
        })),
      });
    }

    case 'mcp_get_graph': {
      const t = targetGraph(env, req);
      if (!t) return err(env, req, 'no_graph', 'no current graph');
      return reply(env, req, {
        nodes: t.rt.doc.nodes,
        edges: t.rt.doc.edges,
        idCounter: t.rt.doc.idCounter,
      });
    }

    case 'mcp_query_nodes': {
      const t = targetGraph(env, req);
      if (!t) return err(env, req, 'no_graph', 'no current graph');
      const selection = req.selection as SelectionV1 | SelectionV2;
      // Default to v2 since MCP is new.
      return reply(env, req, { nodes: queryNodes(t.rt.doc, selection, 2) });
    }

    case 'mcp_add_node': {
      const t = targetGraph(env, req);
      if (!t) return err(env, req, 'no_graph', 'no current graph');
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
      const t = targetGraph(env, req);
      if (!t) return err(env, req, 'no_graph', 'no current graph');
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
      const t = targetGraph(env, req);
      if (!t) return err(env, req, 'no_graph', 'no current graph');
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
      const t = targetGraph(env, req);
      if (!t) return err(env, req, 'no_graph', 'no current graph');
      t.actions.select((req.id as number | null) ?? null);
      return reply(env, req, { ok: true });
    }

    case 'mcp_create_workspace': {
      const id = newId();
      const now = Date.now();
      const bundle: WorkspaceBundle = {
        workspace: {
          id,
          name: (req.name as string) ?? 'Workspace',
          orderIndex: store.get(workspaceIdsAtom).length,
          createdAt: now,
          updatedAt: now,
        },
        groups: [],
        graphs: [],
      };
      store.set(workspaceIdsAtom, [...store.get(workspaceIdsAtom), id]);
      store.set(workspaceBundleAtomFamily(id), bundle);
      return reply(env, req, { workspaceId: id });
    }

    default:
      return err(env, req, 'unsupported', `unsupported MCP type: ${req.type}`);
  }
}
