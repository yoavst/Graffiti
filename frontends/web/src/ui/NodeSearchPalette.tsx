import { Command } from 'cmdk';
import { useEffect, useMemo, useState } from 'react';
import { useAtom, useAtomValue, useStore } from 'jotai';
import { useHotkeys } from 'react-hotkeys-hook';
import { THEMES } from '@/graph/model';
import { openNodeSearchInAllTabs, openNodeSearchInCurrentTab } from '@/commands/commands';
import { loadNavNodeHits, orderedWorkspaceTabs, type NavNodeHit } from '@/navigation/collectNavItems';
import { jumpToNodeInWorkspace } from '@/navigation/jumpToNode';
import { nodeSearchPaletteOpenAtom, nodeSearchScopeAtom } from '@/state/quickOpenPalettes';
import { tabTickAtom } from '@/state/graph';
import {
  activePaneAtom,
  activeTabIdAtom,
  currentTabIdAtom,
  currentWorkspaceIdAtom,
  sidePaneTabIdAtom,
  tabGroupsAtom,
  tabsAtom,
} from '@/state/workspaces';

function ThemeDot({ theme, flavor }: { theme?: number; flavor: NavNodeHit['flavor'] }) {
  const idx = theme != null && THEMES[theme] != null ? theme : 0;
  const bg = THEMES[idx]?.bg ?? '#66bb6a';
  const ring = flavor === 'comment' ? 'ring-1 ring-(--color-border)' : '';
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${ring}`} style={{ background: bg }} />;
}

export function NodeSearchPalette() {
  const [open, setOpen] = useAtom(nodeSearchPaletteOpenAtom);
  const scope = useAtomValue(nodeSearchScopeAtom);
  const [nodeHits, setNodeHits] = useState<NavNodeHit[]>([]);
  const [loading, setLoading] = useState(false);
  const store = useStore();

  const primary = useAtomValue(currentTabIdAtom);
  const side = useAtomValue(sidePaneTabIdAtom);
  const activeTabId = useAtomValue(activeTabIdAtom);
  const wsId = useAtomValue(currentWorkspaceIdAtom);
  const groups = useAtomValue(tabGroupsAtom);
  const tabs = useAtomValue(tabsAtom);
  const tickActive = useAtomValue(tabTickAtom(activeTabId ?? ''));
  const tickPrimary = useAtomValue(tabTickAtom(primary ?? ''));
  const tickSide = useAtomValue(tabTickAtom(side ?? ''));

  const workspaceTabsKey = useMemo(() => orderedWorkspaceTabs(store).map((t) => t.id).join(','), [store, wsId, groups, tabs]);

  useHotkeys(
    'mod+f',
    (e) => {
      e.preventDefault();
      openNodeSearchInCurrentTab(store);
    },
    [store],
  );
  useHotkeys(
    'mod+shift+f',
    (e) => {
      e.preventDefault();
      openNodeSearchInAllTabs(store);
    },
    [store],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const hits = await loadNavNodeHits(store, scope);
      if (!cancelled) {
        setNodeHits(hits);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, scope, activeTabId, tickActive, tickPrimary, tickSide, workspaceTabsKey, store]);

  const paneHint = (tabId: string) => {
    if (tabId === primary && tabId === side) return store.get(activePaneAtom) === 'side' ? 'side' : 'primary';
    if (tabId === primary) return 'primary';
    if (tabId === side) return 'side';
    return null;
  };

  if (!open) return null;

  const placeholder =
    scope === 'currentTab'
      ? 'Search nodes in focused graph…'
      : 'Search nodes in all tabs — opens on primary when you pick…';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-24">
      <Command key={scope} className="w-[36rem] rounded-lg border border-(--color-border) bg-(--color-bg-2) p-2 shadow-xl">
        <Command.Input
          autoFocus
          placeholder={placeholder}
          className="w-full rounded border border-(--color-border) bg-(--color-bg-3) px-2 py-1 text-sm outline-none"
        />
        <Command.List className="mt-2 max-h-96 overflow-auto">
          <Command.Empty className="px-2 py-4 text-sm opacity-60">{loading ? 'Loading…' : 'No matching nodes.'}</Command.Empty>
          <Command.Group className="px-2 text-xs opacity-60">
            {nodeHits.map((h) => {
              let tabSubtitle: string | null = null;
              if (scope === 'allTabs') {
                const hint = paneHint(h.tabId);
                const prefix =
                  hint != null ? (hint === 'primary' ? 'Primary · ' : 'Side · ') : 'Opens on primary · ';
                tabSubtitle = `${prefix}${h.tabName}`;
              }
              return (
                <Command.Item
                  key={`${h.tabId}:${h.nodeId}`}
                  value={h.searchValue}
                  onSelect={() => {
                    jumpToNodeInWorkspace(h.tabId, h.nodeId, store, { openOnPrimary: scope === 'allTabs' });
                    queueMicrotask(() => setOpen(false));
                  }}
                  className="flex items-start gap-2 rounded px-2 py-1 text-sm aria-selected:bg-(--color-bg-3)"
                >
                  <ThemeDot theme={h.theme} flavor={h.flavor} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-xs leading-snug">{h.displayLabel}</span>
                    {tabSubtitle != null ? (
                      <span className="block truncate text-xs opacity-50">{tabSubtitle}</span>
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
