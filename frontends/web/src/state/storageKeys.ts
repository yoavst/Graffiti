/** localStorage key roots — IDs appended for per-entity blobs. */
export const STORAGE_WORKSPACE_IDS = 'graffiti.workspaceIds.v2';
export const workspaceStorageKey = (workspaceId: string) => `graffiti.workspace.v2.${workspaceId}`;
export const graphStorageKey = (graphId: string) => `graffiti.graph.v2.${graphId}`;
