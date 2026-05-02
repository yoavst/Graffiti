import { useRef, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import Popover from '@mui/material/Popover';
import Tooltip from '@mui/material/Tooltip';
import { db } from '@/persistence/db';
import { THEMES } from '@/graph/model';
import { loadAll, tabsAtom } from '@/state/workspaces';

export function PenColorSwatch({ tabId }: { tabId: string }) {
  const tabs = useAtomValue(tabsAtom);
  const tab = tabs.find((t) => t.id === tabId);
  const setTabs = useSetAtom(tabsAtom);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  if (!tab) return null;
  const current = tab.pendingNodeTheme;
  const isAuto = current === undefined || current === 'auto';
  const swatchBg = isAuto ? 'transparent' : THEMES[current as number]?.bg ?? 'transparent';

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
    <>
      <Tooltip title="Default color for new nodes">
        <button
          ref={anchorRef}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/70 shadow"
          style={{ background: swatchBg }}
          onClick={() => setOpen(true)}
        >
          {isAuto && <span className="text-xs">A</span>}
        </button>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 0.5, p: 1, display: 'flex', gap: 0.5 } } }}
      >
        <button
          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
            isAuto ? 'ring-2 ring-(--color-accent)' : 'border-2 border-white'
          }`}
          onClick={() => set('auto')}
          title="Auto"
        >
          A
        </button>
        {THEMES.map((t, i) => (
          <button
            key={i}
            className={`h-7 w-7 rounded-full ${
              current === i ? 'ring-2 ring-(--color-accent)' : 'border border-(--color-border)'
            }`}
            style={{ background: t.bg }}
            title={`Theme ${i + 1}`}
            onClick={() => set(i)}
          />
        ))}
      </Popover>
    </>
  );
}
