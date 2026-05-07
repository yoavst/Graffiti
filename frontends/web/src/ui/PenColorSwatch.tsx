import { useRef, useState } from 'react';
import { useAtomValue, useStore } from 'jotai';
import Popover from '@mui/material/Popover';
import Tooltip from '@mui/material/Tooltip';
import { THEMES, normalizePendingNodeTheme } from '@/graph/model';
import { patchTabRow, tabsAtom } from '@/state/workspaces';

export function PenColorSwatch({ tabId }: { tabId: string }) {
  const store = useStore();
  const tabs = useAtomValue(tabsAtom);
  const tab = tabs.find((t) => t.id === tabId);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  if (!tab) return null;
  const current = normalizePendingNodeTheme(tab.pendingNodeTheme as unknown);
  const swatchBg = THEMES[current]!.bg;

  function set(themeIndex: number) {
    if (!tab) return;
    const n = normalizePendingNodeTheme(themeIndex);
    patchTabRow(store, tab.id, { pendingNodeTheme: n });
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
        />
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slotProps={{ paper: { sx: { mt: 0.5, p: 1, display: 'flex', gap: 0.5 } } }}
      >
        {THEMES.map((t, i) => (
          <button
            key={t.bg}
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
