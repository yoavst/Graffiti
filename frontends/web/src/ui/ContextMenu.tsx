// Right-click context menu, positioned at the cursor and dismissed via
// @floating-ui/react's useDismiss (handles outside-press + escape correctly,
// including not closing on the same event that opened the menu).

import {
  FloatingPortal,
  flip,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react';
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
  const open = state != null;

  const { refs, floatingStyles, context, isPositioned } = useFloating({
    open,
    onOpenChange: (next) => {
      if (!next) onClose();
    },
    placement: 'bottom-start',
    middleware: [flip(), shift({ padding: 4 })],
  });

  // Virtual reference at the cursor position.
  useEffect(() => {
    if (!state) return;
    refs.setPositionReference({
      getBoundingClientRect: () => ({
        x: state.x,
        y: state.y,
        top: state.y,
        left: state.x,
        right: state.x,
        bottom: state.y,
        width: 0,
        height: 0,
      }),
    });
  }, [state, refs]);

  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  if (!open) return null;

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={{ ...floatingStyles, visibility: isPositioned ? 'visible' : 'hidden' }}
        {...getFloatingProps({
          className:
            'z-[60] min-w-48 rounded border border-(--color-border) bg-(--color-bg-2) py-1 text-sm shadow-xl',
          onContextMenu: (e) => e.preventDefault(),
        })}
      >
        {state!.items.map((it, i) => (
          <MenuItem key={i} item={it} onSelected={onClose} />
        ))}
      </div>
    </FloatingPortal>
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
