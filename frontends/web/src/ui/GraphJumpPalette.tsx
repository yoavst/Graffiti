import { Command } from 'cmdk';
import { useMemo } from 'react';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { orderedWorkspaceGraphs } from '@/navigation/collectNavItems';
import { appOverlayAtom } from '@/state/appOverlay';
import {
  activePaneAtom,
  currentGraphIdAtom,
  currentWorkspaceIdAtom,
  graphGroupsAtom,
  graphsAtom,
} from '@/state/workspaces';

export function GraphJumpPalette() {
  const overlay = useAtomValue(appOverlayAtom);
  const setOverlay = useSetAtom(appOverlayAtom);
  const open = overlay === 'graphJump';
  const store = useStore();
  const wsId = useAtomValue(currentWorkspaceIdAtom);
  const groups = useAtomValue(graphGroupsAtom);
  const graphs = useAtomValue(graphsAtom);
  const setCurrentGraphId = useSetAtom(currentGraphIdAtom);
  const setActivePane = useSetAtom(activePaneAtom);
  // Store identity is stable; include workspace snapshots so the memo invalidates when graphs change.
  // eslint-disable-next-line @eslint-react/exhaustive-deps -- wsId/groups/graphs intentionally bust the cache
  const workspaceGraphs = useMemo(() => orderedWorkspaceGraphs(store), [store, wsId, groups, graphs]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-24">
      <Command
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
          placeholder="Open graph…"
          className="w-full rounded border border-(--color-border) bg-(--color-bg-3) px-2 py-1 text-sm outline-none"
        />
        <Command.List className="mt-2 max-h-96 overflow-auto">
          <Command.Empty className="px-2 py-4 text-sm opacity-60">No matching graph.</Command.Empty>
          <Command.Group className="px-2 text-xs opacity-60">
            {workspaceGraphs.map((g) => (
              <Command.Item
                key={g.id}
                value={g.name}
                onSelect={() => {
                  setCurrentGraphId(g.id);
                  setActivePane('primary');
                  setOverlay('none');
                }}
                className="rounded px-2 py-1 text-sm aria-selected:bg-(--color-bg-3)"
              >
                {g.name}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}

