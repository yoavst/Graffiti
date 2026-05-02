import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteIcon from '@mui/icons-material/Delete';
import { inspectorVisibleAtom } from '@/state/settings';
import { activeTabAtom, loadAll, tabsAtom } from '@/state/workspaces';
import { tabRuntimeAtom, tabTickAtom } from '@/state/graph';
import { db } from '@/persistence/db';
import { EDGE_COLORS, THEMES, type ArrowKind } from '@/graph/model';
import { getTabFull } from '@/state/registry';
import { wsClientAtom } from '@/state/wsClient';
import { jumpToPayload } from '@/network/protocol/legacy';

export function Inspector() {
  const [visible, setVisible] = useAtom(inspectorVisibleAtom);
  const tab = useAtomValue(activeTabAtom);
  const ws = useAtomValue(wsClientAtom);
  const rt = useAtomValue(tabRuntimeAtom(tab?.id ?? ''));
  const tick = useAtomValue(tabTickAtom(tab?.id ?? ''));
  void tick;

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

  const selectedNode =
    rt.selectedNodeId != null ? rt.doc.nodes.find((n) => n.id === rt.selectedNodeId) : null;
  const selectedEdge =
    rt.selectedEdgeId != null ? rt.doc.edges.find((e) => e.id === rt.selectedEdgeId) : null;
  const hasSelection = !!(selectedNode ?? selectedEdge);
  const [sheet, setSheet] = useState<'selection' | 'notes'>('selection');
  useEffect(() => {
    if (hasSelection) setSheet('selection');
  }, [hasSelection, selectedNode?.id, selectedEdge?.id]);

  const headerLabel =
    !hasSelection || sheet === 'notes' ? 'Tab notes' : selectedNode ? 'Node' : 'Edge';

  return (
    <aside className="flex w-72 flex-col border-l border-(--color-border) bg-(--color-bg-2) text-base">
      <div className="flex items-center justify-between border-b border-(--color-border) px-3 py-2">
        <span className="text-sm font-semibold uppercase text-(--color-fg-dim)">{headerLabel}</span>
        <button
          onClick={() => setVisible(false)}
          title="Hide inspector"
          className="flex items-center rounded px-2 py-1 hover:bg-(--color-bg-3)"
        >
          <ChevronRightIcon fontSize="small" />
        </button>
      </div>
      {hasSelection ? (
        <div className="flex gap-2 border-b border-(--color-border) px-3 py-1.5 text-xs">
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
      <div className="flex-1 min-h-0 overflow-auto p-3">
        {!hasSelection || sheet === 'notes' ? (
          <NotesEditor key={tab.id} tabId={tab.id} initial={tab.notes ?? ''} />
        ) : selectedNode ? (
          <NodeInspector key={`${tab.id}-${selectedNode.id}`} tabId={tab.id} />
        ) : selectedEdge ? (
          <EdgeInspector key={`${tab.id}-${selectedEdge.id}`} tabId={tab.id} />
        ) : null}
      </div>
      {sheet === 'selection' && ((selectedNode?.extra.address && ws) || selectedEdge) ? (
        <div className="border-t border-(--color-border) p-3">
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
                const tabFull = getTabFull(tab.id);
                if (tabFull) tabFull.actions.apply({ type: 'removeEdge', data: selectedEdge });
              }}
            >
              Remove edge
            </Button>
          )}
        </div>
      ) : null}
    </aside>
  );
}

function NodeInspector({ tabId }: { tabId: string }) {
  const t = getTabFull(tabId);
  const rt = useAtomValue(tabRuntimeAtom(tabId));
  const tick = useAtomValue(tabTickAtom(tabId));
  void tick;
  if (!t || rt.selectedNodeId == null) return null;
  const node = rt.doc.nodes.find((n) => n.id === rt.selectedNodeId);
  if (!node) return null;
  const actions = t.actions;

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
          <button
            className={`h-7 w-7 rounded-full text-xs ${
              node.theme === undefined
                ? 'ring-2 ring-(--color-accent)'
                : 'border border-(--color-border)'
            }`}
            onClick={() =>
              actions.apply({
                type: 'setNodeTheme',
                id: node.id,
                oldTheme: node.theme,
                newTheme: undefined,
              })
            }
          >
            A
          </button>
          {THEMES.map((th, i) => (
            <button
              key={i}
              className={`h-7 w-7 rounded-full ${
                node.theme === i
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
          // `label` has its own editor above; editing it here would be
          // overwritten by computedProperties recompute. Hide it.
          .filter(([k]) => k !== 'label')
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
        <NewPropertyRow key={`new::${node.id}`} onAdd={(k, v) => setKey(k, v)} />
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

function EdgeInspector({ tabId }: { tabId: string }) {
  const t = getTabFull(tabId);
  const rt = useAtomValue(tabRuntimeAtom(tabId));
  const tick = useAtomValue(tabTickAtom(tabId));
  void tick;
  if (!t || rt.selectedEdgeId == null) return null;
  const edge = rt.doc.edges.find((e) => e.id === rt.selectedEdgeId);
  if (!edge) return null;
  const actions = t.actions;
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
    <div className="flex flex-col gap-2">
      <div className="text-xs opacity-60">id: {edge.id}</div>
      <label className="text-xs">
        Label
        <input
          className="mt-1 w-full rounded border border-(--color-border) bg-(--color-bg-3) px-1 py-0.5 text-xs"
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
        <label className="text-xs opacity-60">Arrow</label>
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
          sx={{ mt: 0.5 }}
        >
          <MenuItem value="normal">normal (--&gt;)</MenuItem>
          <MenuItem value="dotted">dotted (-.-&gt;)</MenuItem>
          <MenuItem value="cross">cross (--x)</MenuItem>
          <MenuItem value="none">none (---)</MenuItem>
        </Select>
      </div>
      <div>
        <label className="text-xs opacity-60">Color</label>
        <div className="mt-1 flex flex-wrap gap-1">
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
