import { useAtom, useAtomValue, useSetAtom, useStore } from 'jotai';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteIcon from '@mui/icons-material/Delete';
import { inspectorVisibleAtom } from '@/state/settings';
import { activeTabAtom, loadAll, tabsAtom } from '@/state/workspaces';
import { makeTabActions, tabRuntimeAtom, tabTickAtom, type TabActions, type TabRuntime } from '@/state/graph';
import { db, type TabRow } from '@/persistence/db';
import {
  EDGE_COLORS,
  NODE_EXTRA_INSPECTOR_HIDDEN_KEYS,
  THEMES,
  type ArrowKind,
  type GNode,
  type GraphConfig,
} from '@/graph/model';
import { useSubscribeTabDocMutations } from '@/hooks/useSubscribeTabDocMutations';
import type { WSClient } from '@/network/websocket';
import { wsClientAtom } from '@/state/wsClient';
import { jumpToPayload } from '@/network/protocol/legacy';

function InspectorEditorColumn({
  tab,
  ws,
  rt,
  actions,
  onHide,
}: {
  tab: TabRow;
  ws: WSClient | null;
  rt: TabRuntime;
  actions: TabActions;
  onHide: () => void;
}) {
  const selectedNode =
    rt.selectedNodeId != null ? rt.doc.nodes.find((n) => n.id === rt.selectedNodeId) ?? null : null;
  const selectedEdge =
    rt.selectedEdgeId != null ? rt.doc.edges.find((e) => e.id === rt.selectedEdgeId) ?? null : null;
  const hasSelection = !!(selectedNode ?? selectedEdge);
  const [sheet, setSheet] = useState<'selection' | 'notes'>('selection');
  const headerLabel =
    !hasSelection || sheet === 'notes' ? 'Tab notes' : selectedNode ? 'Node' : 'Edge';

  return (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-(--color-border) px-3 py-2">
        <span className="text-sm font-semibold uppercase text-(--color-fg-dim)">{headerLabel}</span>
        <button
          onClick={onHide}
          title="Hide inspector"
          className="flex items-center rounded px-2 py-1 hover:bg-(--color-bg-3)"
        >
          <ChevronRightIcon fontSize="small" />
        </button>
      </div>
      {hasSelection ? (
        <div className="flex shrink-0 gap-2 border-b border-(--color-border) px-3 py-1.5 text-xs">
          <button
            type="button"
            className={`rounded px-2 py-0.5 ${sheet === 'selection' ? 'bg-(--color-bg-3) font-medium' : 'opacity-70 hover:bg-(--color-bg-3)/60'}`}
            onClick={() => setSheet('selection')}
          >
            Selection
          </button>
          <button
            type="button"
            className={`rounded px-2 py-0.5 ${sheet === 'notes' ? 'bg-(--color-bg-3) font-medium' : 'opacity-70 hover:bg-(--color-bg-3)/60'}`}
            onClick={() => setSheet('notes')}
          >
            Tab notes
          </button>
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-b border-(--color-border)">
          <div className="min-h-0 flex-1 overflow-auto p-3">
            {!hasSelection || sheet === 'notes' ? (
              <NotesEditor key={tab.id} tabId={tab.id} initial={tab.notes ?? ''} />
            ) : selectedNode ? (
              <NodeInspector key={`${tab.id}-${selectedNode.id}`} tabId={tab.id} actions={actions} />
            ) : selectedEdge ? (
              <EdgeInspector key={`${tab.id}-${selectedEdge.id}`} tabId={tab.id} actions={actions} />
            ) : null}
          </div>
          {sheet === 'selection' && ((selectedNode?.extra.address && ws) || selectedEdge) ? (
            <div className="shrink-0 border-t border-(--color-border) p-3">
              {selectedNode?.extra.address && ws && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    const payload = jumpToPayload(selectedNode);
                    if (payload) ws.send(payload);
                  }}
                >
                  Jump to IDE
                </Button>
              )}
              {selectedEdge && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => {
                    actions.apply({ type: 'removeEdge', data: selectedEdge });
                  }}
                >
                  Remove edge
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

export function Inspector() {
  const [visible, setVisible] = useAtom(inspectorVisibleAtom);
  const tab = useAtomValue(activeTabAtom);
  const ws = useAtomValue(wsClientAtom);
  const store = useStore();
  const tabId = tab?.id ?? '';
  useSubscribeTabDocMutations(tabId);
  const rt = useAtomValue(tabRuntimeAtom(tabId));
  const actions = useMemo(
    () =>
      tabId
        ? makeTabActions(
            tabId,
            () => store.get(tabRuntimeAtom(tabId)),
            () => store.set(tabTickAtom(tabId), (n) => n + 1),
          )
        : null,
    [tabId, store],
  );

  if (!tab || !visible) {
    return (
      <div className="flex w-9 flex-col items-center border-l border-(--color-border) bg-(--color-bg-2) p-1">
        <button
          className="flex items-center rounded px-1.5 py-0.5"
          onClick={() => setVisible(true)}
          title="Show inspector"
        >
          <ChevronLeftIcon fontSize="small" />
        </button>
      </div>
    );
  }

  if (!actions) {
    return null;
  }

  const selectionRemountKey = `${rt.selectedNodeId ?? ''}:${rt.selectedEdgeId ?? ''}`;

  return (
    <aside className="flex h-full min-h-0 w-72 flex-col border-l border-(--color-border) bg-(--color-bg-2) text-base">
      <div className="flex min-h-0 flex-1 flex-col">
        <div key={selectionRemountKey} className="flex min-h-0 flex-1 flex-col">
          <InspectorEditorColumn
            tab={tab}
            ws={ws}
            rt={rt}
            actions={actions}
            onHide={() => setVisible(false)}
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-(--color-border) px-3 py-1.5 text-xs font-semibold uppercase text-(--color-fg-dim)">
            Color legend
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-2">
            <ColorLegendPanel tabId={tab.id} />
          </div>
        </div>
      </div>
    </aside>
  );
}

function ColorLegendPanel({ tabId }: { tabId: string }) {
  const store = useStore();
  useSubscribeTabDocMutations(tabId);
  const rt = useAtomValue(tabRuntimeAtom(tabId));

  const actions = useMemo(
    () =>
      makeTabActions(
        tabId,
        () => store.get(tabRuntimeAtom(tabId)),
        () => store.set(tabTickAtom(tabId), (n) => n + 1),
      ),
    [tabId, store],
  );

  function commitLegendText(colorId: (typeof EDGE_COLORS)[number]['id'], text: string) {
    const doc = store.get(tabRuntimeAtom(tabId)).doc;
    const oldConfig = doc.config;
    const merged: GraphConfig = { ...(oldConfig ?? {}) };
    const nextLegend = { ...(merged.colorLegend ?? {}) };
    if (text.trim() === '') delete nextLegend[colorId];
    else nextLegend[colorId] = text;
    if (Object.keys(nextLegend).length === 0) delete merged.colorLegend;
    else merged.colorLegend = nextLegend;
    const newConfig = Object.keys(merged).length > 0 ? merged : undefined;
    actions.apply({ type: 'setConfig', oldConfig, newConfig });
  }

  return (
    <div className="flex flex-col gap-2">
      {EDGE_COLORS.filter((c) => c.id !== 'auto').map((c) => {
        const desc = rt.doc.config?.colorLegend?.[c.id] ?? '';
        return (
          <div key={c.id} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-(--color-border) text-[10px]`}
              style={{ background: c.value }}
              title={c.label}
            />
            <LegendDescriptionField
              key={`${tabId}::${c.id}::${desc}`}
              colorId={c.id}
              committed={desc}
              placeholder={c.label}
              onCommit={(text) => commitLegendText(c.id, text)}
            />
          </div>
        );
      })}
    </div>
  );
}

function LegendDescriptionField({
  colorId,
  committed,
  placeholder,
  onCommit,
}: {
  colorId: string;
  committed: string;
  placeholder: string;
  onCommit: (text: string) => void;
}) {
  const [local, setLocal] = useState(committed);
  const localRef = useRef(local);
  const committedRef = useRef(committed);
  const onCommitRef = useRef(onCommit);
  localRef.current = local;
  committedRef.current = committed;
  onCommitRef.current = onCommit;

  function flushIfDirty() {
    const l = localRef.current;
    const c = committedRef.current;
    if (l === c) return;
    onCommitRef.current(l);
    committedRef.current = l;
  }

  useLayoutEffect(() => {
    return () => flushIfDirty();
  }, [colorId]);

  return (
    <TextField
      size="small"
      fullWidth
      placeholder={placeholder}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => flushIfDirty()}
      variant="outlined"
      sx={{
        '& .MuiInputBase-root': { fontSize: '0.75rem' },
      }}
    />
  );
}

function nodeThemeSwatchActive(node: GNode, i: number): boolean {
  if (node.extra.isMarkdown && !node.extra.isComment) {
    return node.theme === i;
  }
  if (node.extra.isComment) {
    if (node.theme === undefined || node.theme === 4) return false;
    return node.theme === i;
  }
  return (node.theme ?? 0) === i;
}

function NodeInspector({ tabId, actions }: { tabId: string; actions: TabActions }) {
  useSubscribeTabDocMutations(tabId);
  const rt = useAtomValue(tabRuntimeAtom(tabId));
  if (rt.selectedNodeId == null) return null;
  const node = rt.doc.nodes.find((n) => n.id === rt.selectedNodeId);
  if (!node) return null;

  function setKey(key: string, value: unknown) {
    if (!node) return;
    const old = (node.extra as Record<string, unknown>)[key];
    actions.apply({ type: 'setExtra', id: node.id, key, oldValue: old, newValue: value });
  }

  function removeKey(key: string) {
    if (!node) return;
    const old = (node.extra as Record<string, unknown>)[key];
    actions.apply({ type: 'removeExtra', id: node.id, key, oldValue: old });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm opacity-60">id: {node.id}</div>

      <div>
        <label className="text-sm opacity-70">Theme</label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {THEMES.map((th, i) => (
            <button
              key={th.bg}
              className={`h-7 w-7 rounded-full ${nodeThemeSwatchActive(node, i)
                ? 'ring-2 ring-(--color-accent)'
                : 'border border-(--color-border)'
                }`}
              style={{ background: th.bg }}
              onClick={() =>
                actions.apply({
                  type: 'setNodeTheme',
                  id: node.id,
                  oldTheme: node.theme,
                  newTheme: i,
                })
              }
            />
          ))}
        </div>
      </div>

      <div>
        {node.extra.computedProperties ? (
          <>
            <label className="text-sm opacity-70 flex items-center justify-between">
              <span>Override label</span>
              {node.overrideLabel !== undefined && (
                <button
                  className="text-xs underline opacity-70 hover:opacity-100"
                  onClick={() =>
                    actions.apply({
                      type: 'setOverrideLabel',
                      id: node.id,
                      oldLabel: node.overrideLabel,
                      newLabel: undefined,
                    })
                  }
                >
                  reset
                </button>
              )}
            </label>
            <textarea
              className="w-full rounded border border-(--color-border) bg-(--color-bg-3) p-2 text-sm"
              // Pre-fill with the actual label when no override is set, so
              // the user can edit just a small part. Setting it to the same
              // value as the underlying label clears the override.
              value={node.overrideLabel ?? node.label}
              onChange={(e) => {
                const v = e.target.value;
                const newOverride = v === '' || v === node.label ? undefined : v;
                actions.apply({
                  type: 'setOverrideLabel',
                  id: node.id,
                  oldLabel: node.overrideLabel,
                  newLabel: newOverride,
                });
              }}
              rows={2}
            />
            <div className="text-xs opacity-50 mt-1">
              The original label is computed from properties; an override sticks until reset.
            </div>
          </>
        ) : (
          <>
            <label className="text-sm opacity-70">Label</label>
            <textarea
              className="w-full rounded border border-(--color-border) bg-(--color-bg-3) p-2 text-sm"
              value={node.label}
              onChange={(e) =>
                actions.apply({
                  type: 'setNodeLabel',
                  id: node.id,
                  oldLabel: node.label,
                  newLabel: e.target.value,
                })
              }
              rows={2}
            />
          </>
        )}
      </div>

      <div className="border-t border-(--color-border) pt-2">
        <div className="text-sm opacity-70 mb-1.5">Properties</div>
        {Object.entries(node.extra)
          .filter(([k]) => !NODE_EXTRA_INSPECTOR_HIDDEN_KEYS.has(k))
          .map(([k, v]) => (
            <PropertyRow
              // Include node id so a different selection forces a fresh row
              // (otherwise PropertyRow's useState would carry the previous
              // node's value over).
              key={`${node.id}::${k}`}
              kKey={k}
              value={v}
              onChange={(v2) => setKey(k, v2)}
              onRemove={() => removeKey(k)}
            />
          ))}
        <NewPropertyRow
          key={`new::${node.id}`}
          onAdd={(k, v) => {
            if (NODE_EXTRA_INSPECTOR_HIDDEN_KEYS.has(k)) return;
            setKey(k, v);
          }}
        />
      </div>
    </div>
  );
}

function PropertyRow({
  kKey,
  value,
  onChange,
  onRemove,
}: {
  kKey: string;
  value: unknown;
  onChange: (v: unknown) => void;
  onRemove: () => void;
}) {
  const [v, setV] = useState(typeof value === 'string' ? value : JSON.stringify(value));
  return (
    <div className="mb-1 flex items-center gap-1 text-xs">
      <span className="w-24 truncate opacity-70" title={kKey}>
        {kKey}
      </span>
      <input
        className="flex-1 rounded border border-(--color-border) bg-(--color-bg-3) px-1 py-0.5"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          try {
            // Try JSON parse for numbers/booleans/objects, else keep string.
            onChange(JSON.parse(v));
          } catch {
            onChange(v);
          }
        }}
      />
      <button
        onClick={onRemove}
        title="Remove"
        className="flex items-center opacity-60 hover:opacity-100"
      >
        <DeleteIcon fontSize="small" />
      </button>
    </div>
  );
}

function NewPropertyRow({ onAdd }: { onAdd: (k: string, v: unknown) => void }) {
  const [k, setK] = useState('');
  const [v, setV] = useState('');
  return (
    <div className="mt-2 flex items-center gap-1 text-xs">
      <input
        className="w-24 rounded border border-(--color-border) bg-(--color-bg-3) px-1 py-0.5"
        placeholder="key"
        value={k}
        onChange={(e) => setK(e.target.value)}
      />
      <input
        className="flex-1 rounded border border-(--color-border) bg-(--color-bg-3) px-1 py-0.5"
        placeholder="value"
        value={v}
        onChange={(e) => setV(e.target.value)}
      />
      <button
        className="rounded border border-(--color-border) px-1"
        onClick={() => {
          if (!k.trim()) return;
          let parsed: unknown = v;
          try {
            parsed = JSON.parse(v);
          } catch {
            /* keep string */
          }
          onAdd(k.trim(), parsed);
          setK('');
          setV('');
        }}
      >
        +
      </button>
    </div>
  );
}

function EdgeInspector({ tabId, actions }: { tabId: string; actions: TabActions }) {
  useSubscribeTabDocMutations(tabId);
  const rt = useAtomValue(tabRuntimeAtom(tabId));
  if (rt.selectedEdgeId == null) return null;
  const edge = rt.doc.edges.find((e) => e.id === rt.selectedEdgeId);
  if (!edge) return null;
  const targetNode = rt.doc.nodes.find((n) => n.id === edge.to);
  const targetIsComment = targetNode?.extra.isComment === true;
  const arrowValue = edge.arrow ?? (targetIsComment ? 'none' : 'normal');

  function setColor(color: string | undefined) {
    if (!edge) return;
    const newStyle = { ...(edge.style ?? {}), color };
    if (color === undefined) delete newStyle.color;
    actions.apply({
      type: 'setEdgeStyle',
      id: edge.id,
      oldStyle: edge.style,
      newStyle: Object.keys(newStyle).length === 0 ? undefined : newStyle,
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm opacity-60">id: {edge.id}</div>
      <label className="text-sm opacity-70">
        Label
        <input
          className="mt-1 w-full rounded border border-(--color-border) bg-(--color-bg-3) px-2 py-0.5 text-sm"
          value={edge.label ?? ''}
          onChange={(e) =>
            actions.apply({
              type: 'setEdgeLabel',
              id: edge.id,
              oldLabel: edge.label,
              newLabel: e.target.value || undefined,
            })
          }
        />
      </label>
      <div>
        <label className="text-sm opacity-70">Arrow</label>
        <Select
          fullWidth
          size="small"
          value={arrowValue}
          onChange={(e) =>
            actions.apply({
              type: 'setEdgeArrow',
              id: edge.id,
              oldArrow: edge.arrow,
              newArrow: e.target.value as ArrowKind,
            })
          }
          sx={{
            mt: 0.5,
            '& .MuiInputBase-root': { fontSize: '0.875rem' },
          }}
        >
          <MenuItem value="normal">normal (--&gt;)</MenuItem>
          <MenuItem value="dotted">dotted (-.-&gt;)</MenuItem>
          <MenuItem value="cross">cross (--x)</MenuItem>
          <MenuItem value="none">none (---)</MenuItem>
        </Select>
      </div>
      <div>
        <label className="text-sm opacity-70">Color</label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {EDGE_COLORS.map((c) => {
            const active = (edge.style?.color ?? undefined) === c.value;
            return (
              <button
                key={c.id}
                title={c.label}
                onClick={() => setColor(c.value)}
                className={`h-5 w-5 rounded-full border ${active ? 'ring-2 ring-(--color-accent)' : 'border-(--color-border)'
                  } ${c.value === undefined ? 'text-[8px]' : ''}`}
                style={{ background: c.value ?? 'transparent' }}
              >
                {c.value === undefined ? 'A' : ''}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NotesEditor({ tabId, initial }: { tabId: string; initial: string }) {
  const [v, setV] = useState(initial);
  const vRef = useRef(v);
  vRef.current = v;
  const setTabs = useSetAtom(tabsAtom);

  useEffect(() => {
    const id = tabId;
    return () => {
      const notes = vRef.current;
      void (async () => {
        await db.tabs.update(id, { notes });
        const all = await loadAll();
        setTabs(all.tabs);
      })();
    };
  }, [tabId, setTabs]);

  async function save() {
    await db.tabs.update(tabId, { notes: v });
    const all = await loadAll();
    setTabs(all.tabs);
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs opacity-60">Per-graph notes</div>
      <textarea
        className="min-h-64 flex-1 rounded border border-(--color-border) bg-(--color-bg-3) p-2 text-xs"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => void save()}
      />
      <div className="text-[10px] opacity-50">Notes save when you click outside the box.</div>
    </div>
  );
}
