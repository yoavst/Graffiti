// Zod schemas for inbound websocket messages.
// Legacy + MCP — both validated at the dispatch boundary so unknown fields
// are tolerated but bad shapes are surfaced.

import { z } from 'zod';

// --- Legacy ---------------------------------------------------------------

export const computedPropertySchema = z.object({
  name: z.string(),
  format: z.string(),
  replacements: z.array(z.string()),
});

// Node payload from backends — `extra` shape is open-ended, so we keep
// the schema permissive and rely on TS for the well-known fields.
export const incomingNodeSchema = z
  .object({
    label: z.string().optional(),
    project: z.string().optional(),
    address: z.string().optional(),
    baseAddress: z.string().optional(),
    baseName: z.string().optional(),
    line: z.string().optional(),
    seg: z.string().optional(),
    isMarkdown: z.boolean().optional(),
    isComment: z.boolean().optional(),
    isUnclickable: z.boolean().optional(),
    hover: z.array(z.string()).optional(),
    hoverCT: z.enum(['markdown', 'html']).optional(),
    detail: z.string().optional(),
    computedProperties: z.array(computedPropertySchema).optional(),
  })
  .passthrough();

export const incomingEdgeSchema = z
  .object({
    label: z.string().optional(),
    isExistingToNew: z.boolean().optional(),
  })
  .passthrough()
  .optional();

export const authReqSchema = z.object({
  type: z.literal('auth_req_v1'),
});

export const addDataSchema = z.object({
  type: z.literal('addData'),
  node: incomingNodeSchema,
  edge: incomingEdgeSchema,
});

export const addDataBulkSchema = z.object({
  type: z.literal('addDataBulk'),
  nodes: z.array(incomingNodeSchema),
  edge: incomingEdgeSchema,
  direction: z.enum(['e2n', 'n2e']).optional(),
});

export const updateNodesSchema = z.object({
  type: z.literal('updateNodes'),
  selection: z.array(z.any()),
  update: z.record(z.string(), z.any()),
  version: z.number().optional(),
});

// --- MCP ------------------------------------------------------------------

export const mcpRequestSchema = z
  .object({
    type: z.string().regex(/^mcp_/),
    requestId: z.string().optional(),
  })
  .passthrough();

// --- Union ----------------------------------------------------------------

export const inboundMessageSchema = z.union([
  authReqSchema,
  addDataSchema,
  addDataBulkSchema,
  updateNodesSchema,
  mcpRequestSchema,
  // catch-all so unknown messages still parse and we just log + ignore.
  z.object({ type: z.string() }).passthrough(),
]);

export type IncomingNode = z.infer<typeof incomingNodeSchema>;
export type IncomingEdge = z.infer<typeof incomingEdgeSchema>;
export type AddData = z.infer<typeof addDataSchema>;
export type AddDataBulk = z.infer<typeof addDataBulkSchema>;
export type UpdateNodes = z.infer<typeof updateNodesSchema>;
export type McpRequest = z.infer<typeof mcpRequestSchema>;
