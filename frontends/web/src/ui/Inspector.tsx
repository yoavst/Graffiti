import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useState } from 'react';
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
          className="rounded px-1.5 py-0.5 text-base"
          onClick={() => setVisible(true)}
          title="Show inspector"
        >
          ◂
        </button>
      </div>
    );
  }

  const selectedNode =
    rt.selectedNodeId != null ? rt.doc.nodes.find((n) => n.id === rt.selectedNodeId) : null;
  const selectedEdge =
    rt.selectedEdgeId != null ? rt.doc.edges.find((e) => e.id === rt.selectedEdgeId) : null;

  return (
    <aside className="flex w-72 flex-col border-l border-(--color-border) bg-(--color-bg-2) text-base">
      <div className="flex items-center justify-between border-b border-(--color-border) px-3 py-2">
        <span className="text-sm font-semibold uppercase text-(--color-fg-dim)">
          {selectedNode ? 'Node' : selectedEdge ? 'Edge' : 'Tab notes'}
        </span>
        <button
          onClick={() => setVisible(false)}
          title="Hide inspector"
          className="rounded px-2 py-1 text-base hover:bg-(--color-bg-3)"
        >
          ▸
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {selectedNode ? (
          <NodeInspector key={`${tab.id}-${selectedNode.id}`} tabId={tab.id} />
        ) : selectedEdge ? (
          <EdgeInspector key={`${tab.id}-${selectedEdge.id}`} tabId={tab.id} />
        ) : (
          <NotesEditor key={tab.id} tabId={tab.id} initial={tab.notes ?? ''} />
        )}
      </div>
      {selectedNode && selectedNode.extra.address && ws && (
        <button
          className="m-3 rounded bg-(--color-accent) px-3 py-1.5 text-sm font-medium text-black hover:opacity-90"
          onClick={() => {
            const payload = jumpToPayload(selectedNode);
            if (payload) ws.send(payload);
          }}
        >
          Jump to IDE
        </button>
      )}
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
            className="h-7 w-7 rounded-full border border-(--color-border) text-xs"
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
              className="h-7 w-7 rounded-full border border-(--color-border)"
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
      <button onClick={onRemove} title="Remove" className="opacity-60 hover:opacity-100">
        🗑
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
        <select
          className="mt-1 w-full rounded border border-(--color-border) bg-(--color-bg-3) px-1 py-0.5 text-xs"
          value={edge.arrow ?? 'normal'}
          onChange={(e) =>
            actions.apply({
              type: 'setEdgeArrow',
              id: edge.id,
              oldArrow: edge.arrow,
              newArrow: e.target.value as ArrowKind,
            })
          }
        >
          <option value="normal">normal (--&gt;)</option>
          <option value="dotted">dotted (-.-&gt;)</option>
          <option value="cross">cross (--x)</option>
          <option value="none">none (---)</option>
        </select>
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
      <button
        className="mt-2 rounded border border-red-700/40 bg-red-700/20 px-2 py-1 text-xs text-red-300 hover:bg-red-700/30"
        onClick={() => actions.apply({ type: 'removeEdge', data: edge })}
      >
        Remove edge
      </button>
    </div>
  );
}

function NotesEditor({ tabId, initial }: { tabId: string; initial: string }) {
  const [v, setV] = useState(initial);
  const setTabs = useSetAtom(tabsAtom);
  async function save() {
    await db.tabs.update(tabId, { notes: v });
    // Refresh the tabs atom so the 📝 indicator (and anything else watching
    // the tab row) updates immediately.
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
