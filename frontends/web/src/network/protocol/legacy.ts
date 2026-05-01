// Legacy backend → frontend message handlers.
//
// They translate `addData`, `addDataBulk`, `updateNodes` into reducer ops
// against a target tab.

import { applyComputedProperties } from '@/graph/computedProperties';
import {
  type GEdge,
  type GNode,
  type NodeExtra,
} from '@/graph/model';
import {
  type Op,
  findNodeByExtra,
  nextId,
  queryNodes,
} from '@/graph/reducer';
import type { TabRuntime } from '@/state/graph';
import type { TabActions } from '@/state/graph';
import type { AddData, AddDataBulk, IncomingEdge, IncomingNode, UpdateNodes } from './types';
import type { SelectionV1, SelectionV2 } from './selection';

interface AddCtx {
  rt: TabRuntime;
  actions: TabActions;
  /** True = arrow goes from the currently-selected node to the new node. */
  isExistingToNew: boolean;
  /** True = the newly-added node becomes selected after the call. */
  isNewWillBeSelected: boolean;
}

function nodeFromIncoming(idCounter: number, incoming: IncomingNode): GNode {
  const extra: NodeExtra = { ...incoming } as NodeExtra;
  applyComputedProperties(extra);
  const label = (extra as { label?: string }).label ?? incoming.label ?? '(unnamed)';
  return { id: idCounter, label, extra };
}

function edgeFromIncoming(
  edgeId: number,
  from: number,
  to: number,
  incoming: IncomingEdge,
): GEdge {
  const e: GEdge = { id: edgeId, from, to };
  if (incoming?.label !== undefined) e.label = incoming.label as string;
  return e;
}

/**
 * Add a node + edge against the currently-selected node, mirroring legacy
 * NetworkController.addNodeAndEdge. Returns the id of the (new or existing)
 * destination node.
 */
function addNodeAndEdge(
  ctx: AddCtx,
  msgNode: IncomingNode,
  msgEdge: IncomingEdge,
  shouldAddUndoMarker: boolean,
): { destId: number; ops: Op[] } {
  const { rt } = ctx;
  // edge.isExistingToNew override
  const isExistingToNew =
    msgEdge && 'isExistingToNew' in msgEdge && typeof msgEdge.isExistingToNew === 'boolean'
      ? (msgEdge.isExistingToNew as boolean)
      : ctx.isExistingToNew;

  const selectedId = rt.selectedNodeId;
  const selected = selectedId != null ? rt.doc.nodes.find((n) => n.id === selectedId) ?? null : null;

  // 1. If the incoming node carries an `address`, dedupe against existing.
  const existing =
    msgNode.address !== undefined
      ? findNodeByExtra(rt.doc, 'address', msgNode.address)
      : undefined;

  const ops: Op[] = [];
  if (existing) {
    if (selected) {
      const eid = nextId(rt.doc);
      const from = isExistingToNew ? selected.id : existing.id;
      const to = isExistingToNew ? existing.id : selected.id;
      ops.push({ type: 'addEdge', data: edgeFromIncoming(eid, from, to, msgEdge) });
    }
    return { destId: existing.id, ops };
  }

  // 2. Create the new node.
  const newNodeId = nextId(rt.doc);
  const newNode = nodeFromIncoming(newNodeId, msgNode);
  ops.push({ type: 'addNode', data: newNode });

  if (selected) {
    const eid = nextId(rt.doc);
    const from = isExistingToNew ? selected.id : newNode.id;
    const to = isExistingToNew ? newNode.id : selected.id;
    ops.push({ type: 'addEdge', data: edgeFromIncoming(eid, from, to, msgEdge) });
  }

  void shouldAddUndoMarker;
  return { destId: newNode.id, ops };
}

export function handleAddData(ctx: AddCtx, msg: AddData) {
  const { destId, ops } = addNodeAndEdge(ctx, msg.node, msg.edge, true);
  ctx.actions.applyTransaction(ops);
  if (ctx.isNewWillBeSelected) ctx.actions.select(destId);
}

export function handleAddDataBulk(ctx: AddCtx, msg: AddDataBulk) {
  const isExistingToNew = msg.direction
    ? msg.direction === 'e2n'
    : ctx.isExistingToNew;
  const childCtx: AddCtx = { ...ctx, isExistingToNew };

  const allOps: Op[] = [];
  for (const node of msg.nodes) {
    const { ops } = addNodeAndEdge(childCtx, node, msg.edge, false);
    allOps.push(...ops);
  }
  ctx.actions.applyTransaction(allOps);
}

/**
 * Live rename: find nodes whose `extra` matches `selection` and merge `update`
 * into their extras. Recompute computed properties (e.g. `label`).
 */
export function handleUpdateNodes(rt: TabRuntime, actions: TabActions, msg: UpdateNodes) {
  const version = (msg.version ?? 1) as 1 | 2;
  const selection = msg.selection as SelectionV1 | SelectionV2;
  const matched = queryNodes(rt.doc, selection, version);
  if (matched.length === 0) return;

  const ops: Op[] = [];
  for (const node of matched) {
    for (const [key, value] of Object.entries(msg.update)) {
      const old = (node.extra as Record<string, unknown>)[key];
      if (old !== value) {
        ops.push({ type: 'setExtra', id: node.id, key, oldValue: old, newValue: value });
      }
    }
  }
  if (ops.length === 0) return;
  actions.applyTransaction(ops);
}

/**
 * Build the frontend → backend "jump-to" payload for a code node.
 * Wire format matches the legacy version-2 spec exactly.
 */
export function jumpToPayload(node: GNode): Record<string, unknown> | null {
  if (!('address' in node.extra)) return null;
  return {
    version: 2,
    address: node.extra.address,
    project: node.extra.project,
    line: node.extra.line,
  };
}
