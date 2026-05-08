import { Command } from 'cmdk';
import { startTransition, useEffect, useMemo, useState } from 'react';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { THEMES } from '@/graph/model';
import { loadNavNodeHits, orderedWorkspaceGraphs, type NavNodeHit } from '@/navigation/collectNavItems';
import { jumpToNodeInWorkspace } from '@/navigation/jumpToNode';
import { appOverlayAtom } from '@/state/appOverlay';
import { nodeSearchScopeAtom } from '@/state/quickOpenPalettes';
import { graphTickAtom } from '@/state/graph';
import {
  activePaneAtom,
  activeGraphIdAtom,
  currentGraphIdAtom,
  currentWorkspaceIdAtom,
  sidePaneGraphIdAtom,
  tabGroupsAtom,
  graphsAtom,
} from '@/state/workspaces';

function ThemeDot({ theme, flavor }: { theme?: number; flavor: NavNodeHit['flavor'] }) {
  const idx = theme != null && THEMES[theme] != null ? theme : 0;
  const bg = THEMES[idx]?.bg ?? '#66bb6a';
  const ring = flavor === 'comment' ? 'ring-1 ring-(--color-border)' : '';
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${ring}`} style={{ background: bg }} />;
}

export function NodeSearchPalette() {
  const overlay = useAtomValue(appOverlayAtom);
  const setOverlay = useSetAtom(appOverlayAtom);
  const open = overlay === 'nodeSearch';
  const scope = useAtomValue(nodeSearchScopeAtom);
  const [nodeHits, setNodeHits] = useState<NavNodeHit[]>([]);
  const [loading, setLoading] = useState(false);
  const store = useStore();

  const primary = useAtomValue(currentGraphIdAtom);
  const side = useAtomValue(sidePaneGraphIdAtom);
  const activeGraphId = useAtomValue(activeGraphIdAtom);
  const wsId = useAtomValue(currentWorkspaceIdAtom);
  const groups = useAtomValue(tabGroupsAtom);
  const graphs = useAtomValue(graphsAtom);
  const tickActive = useAtomValue(graphTickAtom(activeGraphId ?? ''));
  const tickPrimary = useAtomValue(graphTickAtom(primary ?? ''));
  const tickSide = useAtomValue(graphTickAtom(side ?? ''));

  // Store identity is stable; include workspace snapshots so the memo invalidates when tabs change.
  // eslint-disable-next-line @eslint-react/exhaustive-deps -- wsId/groups/tabs intentionally bust the cache
  const workspaceGraphsKey = useMemo(
    () => orderedWorkspaceGraphs(store).map((g) => g.id).join(','),
    [store, wsId, groups, graphs],
  );

  useEffect(() => {
    if (!open) return;
    startTransition(() => setLoading(true));
    const hits = loadNavNodeHits(store, scope);
    startTransition(() => {
      setNodeHits(hits);
      setLoading(false);
    });
  }, [open, scope, activeGraphId, tickActive, tickPrimary, tickSide, workspaceGraphsKey, store]);

  const paneHint = (graphId: string) => {
    if (graphId === primary && graphId === side) return store.get(activePaneAtom) === 'side' ? 'side' : 'primary';
    if (graphId === primary) return 'primary';
    if (graphId === side) return 'side';
    return null;
  };

  if (!open) return null;

  const placeholder =
    scope === 'currentTab'
      ? 'Search nodes in focused graph…'
      : 'Search nodes in all graphs — opens on primary when you pick…';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-24">
      <Command
        key={scope}
        className="w-[36rem] rounded-lg border border-(--color-border) bg-(--color-bg-2) p-2 shadow-xl"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            setOverlay('none');
          }
        }}
      >
        <Command.Input
          autoFocus
          placeholder={placeholder}
          className="w-full rounded border border-(--color-border) bg-(--color-bg-3) px-2 py-1 text-sm outline-none"
        />
        <Command.List className="mt-2 max-h-96 overflow-auto">
          <Command.Empty className="px-2 py-4 text-sm opacity-60">{loading ? 'Loading…' : 'No matching nodes.'}</Command.Empty>
          <Command.Group className="px-2 text-xs opacity-60">
            {nodeHits.map((h) => {
              let graphSubtitle: string | null = null;
              if (scope === 'allTabs') {
                const hint = paneHint(h.graphId);
                const prefix =
                  hint != null ? (hint === 'primary' ? 'Primary · ' : 'Side · ') : 'Opens on primary · ';
                graphSubtitle = `${prefix}${h.graphName}`;
              }
              return (
                <Command.Item
                  key={`${h.graphId}:${h.nodeId}`}
                  value={h.searchValue}
                  onSelect={() => {
                    jumpToNodeInWorkspace(h.graphId, h.nodeId, store, { openOnPrimary: scope === 'allTabs' });
                    queueMicrotask(() => setOverlay('none'));
                  }}
                  className="flex items-start gap-2 rounded px-2 py-1 text-sm aria-selected:bg-(--color-bg-3)"
                >
                  <ThemeDot theme={h.theme} flavor={h.flavor} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-xs leading-snug">{h.displayLabel}</span>
                    {graphSubtitle != null ? (
                      <span className="block truncate text-xs opacity-50">{graphSubtitle}</span>
                    ) : null}
                  </span>
                </Command.Item>
              );
            })}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
