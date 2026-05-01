// A simple right-click context menu. Renders into a portal so it can
// escape parent overflow:hidden boxes (like the tab bar).

import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

export interface ContextMenuItem {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
  // Optional submenu: hovering over the parent reveals a fly-out menu.
  submenu?: ContextMenuItem[];
}

export interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export function ContextMenu({
  state,
  onClose,
}: {
  state: ContextMenuState | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [state, onClose]);

  if (!state) return null;

  // Clamp inside viewport.
  const w = 200;
  const x = Math.min(state.x, window.innerWidth - w - 4);
  const y = state.y;

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[60] min-w-48 rounded border border-(--color-border) bg-(--color-bg-2) py-1 text-sm shadow-xl"
      style={{ left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {state.items.map((it, i) => (
        <MenuItem key={i} item={it} onSelected={onClose} />
      ))}
    </div>,
    document.body,
  );
}

function MenuItem({ item, onSelected }: { item: ContextMenuItem; onSelected: () => void }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  function scheduleClose() {
    if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  }
  function cancelClose() {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  if (item.submenu) {
    return (
      <div
        className="relative"
        onMouseEnter={() => {
          cancelClose();
          setOpen(true);
        }}
        onMouseLeave={scheduleClose}
      >
        <div
          className={`flex items-center justify-between cursor-default select-none px-3 py-1 hover:bg-(--color-bg-3) ${item.disabled ? 'opacity-40 pointer-events-none' : ''}`}
        >
          <span>{item.label}</span>
          <span className="opacity-60 ml-2">▸</span>
        </div>
        {open && item.submenu.length > 0 && (
          <div
            className="absolute left-full top-0 -ml-px min-w-48 rounded border border-(--color-border) bg-(--color-bg-2) py-1 shadow-xl z-[61] max-h-[60vh] overflow-y-auto"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            {item.submenu.map((sub, i) => (
              <MenuItem key={i} item={sub} onSelected={onSelected} />
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <button
      className={`block w-full text-left px-3 py-1 hover:bg-(--color-bg-3) ${item.destructive ? 'text-red-400' : ''} ${item.disabled ? 'opacity-40 pointer-events-none' : ''}`}
      onClick={() => {
        if (item.disabled) return;
        item.onSelect();
        onSelected();
      }}
    >
      {item.label}
    </button>
  );
}
