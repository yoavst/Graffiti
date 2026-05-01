import { useEffect, useRef, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { db } from '@/persistence/db';
import { THEMES } from '@/graph/model';
import { loadAll, tabsAtom } from '@/state/workspaces';

export function PenColorSwatch({ tabId }: { tabId: string }) {
  const tabs = useAtomValue(tabsAtom);
  const tab = tabs.find((t) => t.id === tabId);
  const setTabs = useSetAtom(tabsAtom);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  if (!tab) return null;
  const current = tab.pendingNodeTheme;
  const swatchBg =
    current === undefined || current === 'auto'
      ? 'transparent'
      : THEMES[current as number]?.bg ?? 'transparent';

  async function set(theme: number | 'auto') {
    if (!tab) return;
    await db.tabs.update(tab.id, { pendingNodeTheme: theme });
    // Reload the tabs atom so the swatch (and the dispatcher that reads
    // pendingNodeTheme to color new WS-created nodes) sees the new value.
    const all = await loadAll();
    setTabs(all.tabs);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/70 shadow"
        style={{ background: swatchBg }}
        title="Default color for new nodes"
        onClick={() => setOpen(!open)}
      >
        {(current === undefined || current === 'auto') && (
          <span className="text-xs">A</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 flex gap-1 rounded border border-(--color-border) bg-(--color-bg-2) p-2 shadow-xl">
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs"
            onClick={() => set('auto')}
            title="Auto"
          >
            A
          </button>
          {THEMES.map((t, i) => (
            <button
              key={i}
              className="h-7 w-7 rounded-full border border-(--color-border)"
              style={{ background: t.bg }}
              title={`Theme ${i + 1}`}
              onClick={() => set(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
