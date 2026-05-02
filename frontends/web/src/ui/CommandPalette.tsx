import { Command } from 'cmdk';
import { useEffect, useState } from 'react';
import { useStore } from 'jotai';
import { useHotkeys } from 'react-hotkeys-hook';
import { buildCommands } from '@/commands/commands';

export function CommandPalette({
  onOpenHelp,
  onOpenToken,
}: {
  onOpenHelp: () => void;
  onOpenToken: () => void;
}) {
  const [open, setOpen] = useState(false);
  const store = useStore();

  useHotkeys('mod+shift+p', (e) => {
    e.preventDefault();
    setOpen((o) => !o);
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  if (!open) return null;
  const cmds = buildCommands(store, onOpenHelp, onOpenToken);
  const groups = new Map<string, typeof cmds>();
  for (const c of cmds) {
    const k = c.section ?? 'Other';
    const arr = groups.get(k) ?? [];
    arr.push(c);
    groups.set(k, arr);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-24">
      <Command className="w-[36rem] rounded-lg border border-(--color-border) bg-(--color-bg-2) p-2 shadow-xl">
        <Command.Input
          autoFocus
          placeholder="Run command…"
          className="w-full rounded border border-(--color-border) bg-(--color-bg-3) px-2 py-1 text-sm outline-none"
        />
        <Command.List className="mt-2 max-h-96 overflow-auto">
          <Command.Empty className="px-2 py-4 text-sm opacity-60">No matches.</Command.Empty>
          {[...groups.entries()].map(([section, list]) => (
            <Command.Group key={section} heading={section} className="text-xs opacity-60 px-2 mt-2">
              {list.map((c) => (
                <Command.Item
                  key={c.id}
                  value={[c.title, c.hint, c.hotkey].filter(Boolean).join(' ')}
                  onSelect={() => {
                    setOpen(false);
                    void c.run();
                  }}
                  className="flex items-center justify-between rounded px-2 py-1 text-sm aria-selected:bg-(--color-bg-3)"
                >
                  <span>{c.title}</span>
                  {c.hotkey && <span className="text-xs opacity-60">{c.hotkey}</span>}
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
