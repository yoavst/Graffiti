import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { db } from '@/persistence/db';
import { THEMES } from '@/graph/model';
import { currentTabAtom } from '@/state/workspaces';

export function PenColorSwatch() {
  const tab = useAtomValue(currentTabAtom);
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
  const swatchBg = current === undefined || current === 'auto'
    ? 'transparent'
    : THEMES[current as number]?.bg ?? 'transparent';

  async function set(theme: number | 'auto') {
    if (!tab) return;
    await db.tabs.update(tab.id, { pendingNodeTheme: theme });
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        className="h-6 w-6 rounded-full border-2 border-white"
        style={{ background: swatchBg }}
        title="Pen color"
        onClick={() => setOpen(!open)}
      >
        {(current === undefined || current === 'auto') && (
          <span className="text-[10px]">A</span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-8 z-10 flex gap-1 rounded border border-(--color-border) bg-(--color-bg-2) p-2 shadow">
          <button
            className="h-6 w-6 rounded-full border-2 border-white text-[10px]"
            onClick={() => set('auto')}
            title="Auto"
          >
            A
          </button>
          {THEMES.map((t, i) => (
            <button
              key={i}
              className="h-6 w-6 rounded-full border border-(--color-border)"
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
