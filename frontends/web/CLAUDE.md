# Graffiti web frontend

Browser app at graffiti.quest. Renders the call graph and talks to the IDE backends through the Graffiti server. This directory is the in-progress React rewrite — the legacy mermaid+ELK app is being replaced.

## Stack

- **React 18** + **TypeScript** (strict, `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`)
- **Vite 6** with the `@/*` → `src/*` path alias (`vite.config.ts`, `tsconfig.app.json`)
- **Jotai** for state. A single shared store from [src/state/store.ts](src/state/store.ts) so non-React code (the WS dispatcher, command palette) can read/write atoms.
- **React Flow** ([@xyflow/react](https://reactflow.dev)) for the canvas
- **Dexie** (IndexedDB) for persistence
- **Tailwind CSS 4** via PostCSS — owns layout (flex, spacing, sizing) and the design-token color palette in [src/styles.css](src/styles.css)
- **MUI v9** (`@mui/material`, `@mui/icons-material`, `@emotion/react`/`styled`) for UI primitives — buttons, dialogs, menus, text fields, tooltips, icons. Theme bridge in [src/ui/theme.ts](src/ui/theme.ts) maps MUI's palette to the literal hex values from [src/styles.css](src/styles.css). `<ThemeProvider>` wraps the app in [src/App.tsx](src/App.tsx); **no `<CssBaseline />`** — Tailwind preflight stays in charge of resets. Dark-only (light mode is intentionally unsupported).
- **Zod** for validating inbound WS messages
- **cmdk** for the command palette ([src/ui/CommandPalette.tsx](src/ui/CommandPalette.tsx)) — kept over MUI `Autocomplete` because it has grouped sections + fuzzy match out of the box
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
  - [connection.ts](src/state/connection.ts), [wsClient.ts](src/state/wsClient.ts), [settings.ts](src/state/settings.ts), [appOverlay.ts](src/state/appOverlay.ts) (`appOverlayAtom` — mutually exclusive command palette / tab jump / node search / share / token / help).
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
- [src/persistence/](src/persistence/) — [Dexie schema](src/persistence/db.ts) (`workspaces`/`tabGroups`/`tabs`/`graphs`), [legacy localStorage migration](src/persistence/migrations.ts), [import/export](src/persistence/importExport.ts), [tar packing](src/persistence/tar.ts).
- [src/ui/](src/ui/) — [Header](src/ui/Header.tsx), [Sidebar](src/ui/sidebar/Sidebar.tsx), [SplitView](src/ui/SplitView.tsx), [Inspector](src/ui/Inspector.tsx), [TabHost](src/ui/TabHost.tsx), [CommandPalette](src/ui/CommandPalette.tsx) (cmdk), [ContextMenu](src/ui/ContextMenu.tsx), [PenColorSwatch](src/ui/PenColorSwatch.tsx), [theme.ts](src/ui/theme.ts) (MUI theme bridge), [dialogs/](src/ui/dialogs/).
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

## UI conventions

- **Tailwind owns layout, MUI owns primitives.** Use Tailwind utilities (flex, gap, sizing, spacing) for the structural shell; reach for MUI for `Button`, `IconButton`, `TextField`, `Select`, `Tooltip`, `Dialog`, `Menu`, `Popover`. Don't replace Tailwind layout with `Box sx={...}` — that's double-styling for no payoff.
- **Don't add `<CssBaseline />`.** Tailwind 4's preflight is the one source of reset rules; MUI's would fight it.
- **Theme tokens.** Add new design tokens as `--color-*` CSS variables in [src/styles.css](src/styles.css), then mirror the hex into [src/ui/theme.ts](src/ui/theme.ts) so MUI components pick them up. Hex values are duplicated (not `var(--color-*)`) because MUI's palette manipulation (alpha/lighten/darken) needs concrete colors at theme-init time.
- **Icons:** import per-icon paths (`import KeyOutlined from '@mui/icons-material/KeyOutlined'`). The barrel import (`import { KeyOutlined } from '@mui/icons-material'`) kills tree-shaking and adds ~1 MB. The codebase favors filled variants over outlined.
- **Context menus:** use [src/ui/ContextMenu.tsx](src/ui/ContextMenu.tsx) — `<ContextMenu items={items}>{trigger}</ContextMenu>`. The wrapper uses `display: contents` and the MUI `<Menu>` is rendered inside, so a contextmenu on the (portaled) backdrop bubbles back via React's portal-aware events to close the menu instead of leaking through to the native browser menu. Repeated right-clicks on the backdrop close the open menu rather than re-positioning (matches the [MUI docs example](https://mui.com/material-ui/react-menu/#context-menu)).
- **Imperative dialogs:** use `dialogs.alert/confirm/prompt` from [src/ui/dialogs/Dialogs.tsx](src/ui/dialogs/Dialogs.tsx). They render a MUI `Dialog` whose `Paper` is a `<form>` so Enter submits and Shift+Enter inserts a newline in multiline mode.

## Coding notes

- Path alias `@/...` resolves to `src/...` (Vite + tsconfig).
- TypeScript is strict; index access is `T | undefined` — handle it.
- Tests live next to the code (`*.test.ts`). Vitest runs in jsdom (`vite.config.ts`).
- Tailwind 4 with PostCSS; design tokens are CSS custom properties (e.g. `bg-(--color-accent)`).
- Don't add comments that restate code. Reducer ops, protocol shapes, and the in-place mutation pattern have non-obvious "why" — those *do* deserve comments.
