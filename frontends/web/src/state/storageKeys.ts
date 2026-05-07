/** localStorage key roots — IDs appended for per-entity blobs. */
export const STORAGE_WORKSPACE_IDS = 'graffiti.workspaceIds.v1';
export const workspaceStorageKey = (workspaceId: string) => `graffiti.workspace.v1.${workspaceId}`;
export const graphStorageKey = (tabId: string) => `graffiti.graph.v1.${tabId}`;
