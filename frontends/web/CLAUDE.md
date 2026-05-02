# Graffiti web frontend

Browser app at graffiti.quest. Renders the call graph and talks to the IDE backends through the Graffiti server. This directory is the in-progress React rewrite — the legacy mermaid+ELK app is being replaced.

## Stack

- **React 18** + **TypeScript** (strict, `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`)
- **Vite 6** with the `@/*` → `src/*` path alias (`vite.config.ts`, `tsconfig.app.json`)
- **Jotai** for state. A single shared store from [src/state/store.ts](src/state/store.ts) so non-React code (the WS dispatcher, command palette) can read/write atoms.
- **React Flow** ([@xyflow/react](https://reactflow.dev)) for the canvas
- **Dexie** (IndexedDB) for persistence
- **Tailwind CSS 4** via PostCSS
- **Zod** for validating inbound WS messages
- **Vitest** + jsdom for tests
- ELK and Dagre for layout

## Scripts

- `npm run dev` — Vite dev server on port 5173
- `npm run build` — `tsc -b && vite build`
- `npm run typecheck` — `tsc -b --noEmit`
- `npm run test` / `npm run test:watch` — Vitest

## Layout

- [src/App.tsx](src/App.tsx) — boot (legacy migration → ensure default workspace → load atoms), URL state sync, drag-and-drop import, top-level shell (`Header` / `Sidebar` / `SplitView` / `Inspector`).
- [src/main.tsx](src/main.tsx) — entry point.
- [src/state/](src/state/) — Jotai atoms.
  - [store.ts](src/state/store.ts) — the singleton Jotai store. Always go through `getStore()` outside React.
  - [workspaces.ts](src/state/workspaces.ts) — workspaces / tab groups / tabs atoms, derived selectors, CRUD that writes through to Dexie. `activeTabIdAtom` resolves to whichever pane (`primary`/`side`) the user last clicked.
  - [graph.ts](src/state/graph.ts) — per-tab `TabRuntime` via `atomFamily`. Doc/history are mutated in place; a `tabTickAtom` is bumped to drive React re-renders. Persistence is debounced (`PERSIST_DEBOUNCE_MS = 250`).
  - [registry.ts](src/state/registry.ts) — `tabId → { runtime, actions }` map for the WS dispatcher / palette to reach tabs without React.
  - [connection.ts](src/state/connection.ts), [wsClient.ts](src/state/wsClient.ts), [settings.ts](src/state/settings.ts).
- [src/graph/](src/graph/) — pure graph layer.
  - [model.ts](src/graph/model.ts) — `GNode`/`GEdge`/`GraphDoc`/`NodeExtra`. **Field names match the legacy on-disk JSON** so old `.json` exports still import; don't rename them.
  - [reducer.ts](src/graph/reducer.ts) — tagged-union `Op` + `applyOp` returning inverse ops. Multi-op transactions use `HISTORY_MARKER`.
  - [computedProperties.ts](src/graph/computedProperties.ts), [mermaidExport.ts](src/graph/mermaidExport.ts), [layout/](src/graph/layout/) (`elk`, `dagre`).
- [src/flow/](src/flow/) — React Flow node/edge components ([CodeNode](src/flow/nodes/CodeNode.tsx), [CommentNode](src/flow/nodes/CommentNode.tsx), [MarkdownNode](src/flow/nodes/MarkdownNode.tsx), [LabeledEdge](src/flow/edges/LabeledEdge.tsx), [GraphCanvas](src/flow/GraphCanvas.tsx)).
- [src/network/](src/network/) — websocket transport.
  - [websocket.ts](src/network/websocket.ts) — single connection, surfaces `auth_req_v1`, fires a `graffiti_connect` DOM event.
  - [protocol/dispatch.ts](src/network/protocol/dispatch.ts) — Zod-validates inbound messages and routes legacy vs. MCP. Unknown messages are logged and dropped (forward-compat).
  - [protocol/legacy.ts](src/network/protocol/legacy.ts) — `addData` / `addDataBulk` / `updateNodes` translated into reducer ops.
  - [protocol/mcp.ts](src/network/protocol/mcp.ts), [protocol/types.ts](src/network/protocol/types.ts), [protocol/selection.ts](src/network/protocol/selection.ts).
- [src/persistence/](src/persistence/) — [Dexie schema](src/persistence/db.ts) (`workspaces`/`tabGroups`/`tabs`/`graphs`/`settings`), [legacy localStorage migration](src/persistence/migrations.ts), [import/export](src/persistence/importExport.ts), [tar packing](src/persistence/tar.ts).
- [src/ui/](src/ui/) — [Header](src/ui/Header.tsx), [Sidebar](src/ui/sidebar/Sidebar.tsx), [SplitView](src/ui/SplitView.tsx), [Inspector](src/ui/Inspector.tsx), [TabHost](src/ui/TabHost.tsx), [CommandPalette](src/ui/CommandPalette.tsx) (cmdk), [ContextMenu](src/ui/ContextMenu.tsx), [PenColorSwatch](src/ui/PenColorSwatch.tsx), [dialogs/](src/ui/dialogs/).
- [src/commands/](src/commands/) — command registry + react-hotkeys-hook bindings.
- [src/routing/url.ts](src/routing/url.ts) — workspace/tab/pane2 ↔ URL.
- [src/util/](src/util/) — `ids.ts`, `escape.ts`.

## Protocol invariants (do not break)

The web frontend talks to the legacy IDE backends through the server, which is a dumb pipe. The protocol shapes are fixed:

- **Inbound (backend → frontend):** `addData`, `addDataBulk`, `updateNodes`, `auth_req_v1` — preserve byte-for-byte.
- **Auth:** server sends `auth_req_v1`; reply with `auth_resp_v1` carrying the token.
- **Outbound jump-to:** `{ version: 2, address, project, line }` — **no `type` field**.
- **MCP messages** (`mcp_*`) are additive only — new request/response messages are fine, but don't repurpose existing ones.
- Server is a dumb pipe — never put protocol logic there.

When adding fields, prefer extending `extra` on nodes (`NodeExtra` is open-ended via `passthrough()` in Zod) rather than introducing new top-level fields.

## State conventions

- **Atom mutations are in-place.** `TabRuntime.doc` and `TabRuntime.history` are mutated directly for performance; `tabTickAtom` is bumped to trigger re-renders. Don't `.map`/spread the doc.
- **Reducer ops are JSON-safe** and return their inverse — that's what powers undo. Group multi-op edits with `HISTORY_MARKER`.
- **Use `getStore()`** in non-React modules (dispatcher, registry, command palette). Never instantiate a second Jotai store.
- **Active vs. current tab:** `currentTabIdAtom` is the primary pane; `activeTabIdAtom` resolves to whichever pane the user last clicked. WS dispatch / hotkeys / inspector should target `activeTabIdAtom`.
- **Persistence debounce** is 250ms; call `actions.flush()` if you need a synchronous write (e.g. before export).
- **StrictMode safety:** `ensureDefaultWorkspace` memoizes its promise to defeat double-invoke in dev. Follow the same pattern for any other "create on first boot" effects.

## Coding notes

- Path alias `@/...` resolves to `src/...` (Vite + tsconfig).
- TypeScript is strict; index access is `T | undefined` — handle it.
- Tests live next to the code (`*.test.ts`). Vitest runs in jsdom (`vite.config.ts`).
- Tailwind 4 with PostCSS; design tokens are CSS custom properties (e.g. `bg-(--color-accent)`).
- Don't add comments that restate code. Reducer ops, protocol shapes, and the in-place mutation pattern have non-obvious "why" — those *do* deserve comments.
