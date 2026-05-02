import { Command } from 'cmdk';
import { useMemo } from 'react';
import { useAtom, useAtomValue, useSetAtom, useStore } from 'jotai';
import { useHotkeys } from 'react-hotkeys-hook';
import { orderedWorkspaceTabs } from '@/navigation/collectNavItems';
import { nodeSearchPaletteOpenAtom, tabJumpPaletteOpenAtom } from '@/state/quickOpenPalettes';
import {
  activePaneAtom,
  currentTabIdAtom,
  currentWorkspaceIdAtom,
  tabGroupsAtom,
  tabsAtom,
} from '@/state/workspaces';

export function TabJumpPalette() {
  const [open, setOpen] = useAtom(tabJumpPaletteOpenAtom);
  const store = useStore();
  const wsId = useAtomValue(currentWorkspaceIdAtom);
  const groups = useAtomValue(tabGroupsAtom);
  const tabs = useAtomValue(tabsAtom);
  const setCurrentTabId = useSetAtom(currentTabIdAtom);
  const setActivePane = useSetAtom(activePaneAtom);
  const setNodeSearchOpen = useSetAtom(nodeSearchPaletteOpenAtom);
  const workspaceTabs = useMemo(() => orderedWorkspaceTabs(store), [store, wsId, groups, tabs]);

  useHotkeys(
    'mod+p',
    (e) => {
      e.preventDefault();
      setOpen(true);
    },
    [setNodeSearchOpen, setOpen],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-24">
      <Command className="w-[36rem] rounded-lg border border-(--color-border) bg-(--color-bg-2) p-2 shadow-xl" onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
        }
      }}>
        <Command.Input
          autoFocus
          placeholder="Open tab…"
          className="w-full rounded border border-(--color-border) bg-(--color-bg-3) px-2 py-1 text-sm outline-none"
        />
        <Command.List className="mt-2 max-h-96 overflow-auto">
          <Command.Empty className="px-2 py-4 text-sm opacity-60">No matching tab.</Command.Empty>
          <Command.Group className="px-2 text-xs opacity-60">
            {workspaceTabs.map((t) => (
              <Command.Item
                key={t.id}
                value={t.name}
                onSelect={() => {
                  setCurrentTabId(t.id);
                  setActivePane('primary');
                  setOpen(false);
                }}
                className="rounded px-2 py-1 text-sm aria-selected:bg-(--color-bg-3)"
              >
                {t.name}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div >
  );
}
