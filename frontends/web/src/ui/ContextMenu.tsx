import { useRef, useState, type ReactNode } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export interface ContextMenuItem {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
  // Optional submenu: hovering over the parent reveals a fly-out menu.
  submenu?: ContextMenuItem[];
}

// Wrapping component pattern from MUI's docs example. The <Menu> is a
// React child of the wrapper div, so a contextmenu fired on the (portaled)
// Modal backdrop bubbles back up through React's portal-aware event system
// to handleContextMenu — that's how a second right-click while the menu is
// open closes it instead of leaking through to the native browser menu.
export function ContextMenu({
  items,
  children,
}: {
  items: ContextMenuItem[];
  children: ReactNode;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    // Repeated contextmenu while open closes the menu rather than
    // re-positioning it (matches MUI docs pattern).
    setPos(pos === null ? { x: e.clientX, y: e.clientY } : null);
  }

  const close = () => setPos(null);

  return (
    <div onContextMenu={handleContextMenu} style={{ display: 'contents' }}>
      {children}
      <Menu
        open={pos !== null}
        onClose={close}
        anchorReference="anchorPosition"
        anchorPosition={pos !== null ? { top: pos.y, left: pos.x } : undefined}
        slotProps={{ list: { dense: true } }}
      >
        {pos !== null &&
          items.map((it, i) => <Item key={i} item={it} onSelected={close} />)}
      </Menu>
    </div>
  );
}

function Item({ item, onSelected }: { item: ContextMenuItem; onSelected: () => void }) {
  const anchorRef = useRef<HTMLLIElement | null>(null);
  const [subOpen, setSubOpen] = useState(false);

  if (item.submenu && item.submenu.length > 0) {
    const submenu = item.submenu;
    return (
      <>
        <MenuItem
          ref={anchorRef}
          disabled={item.disabled}
          onMouseEnter={() => setSubOpen(true)}
          onMouseLeave={() => setSubOpen(false)}
          sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}
        >
          <span>{item.label}</span>
          <ChevronRightIcon fontSize="small" sx={{ opacity: 0.6 }} />
        </MenuItem>
        <Menu
          open={subOpen}
          anchorEl={anchorRef.current}
          onClose={() => setSubOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          disableAutoFocus
          disableEnforceFocus
          disableRestoreFocus
          slotProps={{
            list: {
              dense: true,
              onMouseEnter: () => setSubOpen(true),
              onMouseLeave: () => setSubOpen(false),
              sx: { pointerEvents: 'auto' },
            },
            root: { sx: { pointerEvents: 'none' } },
          }}
        >
          {submenu.map((sub, i) => (
            <Item key={i} item={sub} onSelected={onSelected} />
          ))}
        </Menu>
      </>
    );
  }

  return (
    <MenuItem
      disabled={item.disabled}
      onClick={() => {
        item.onSelect();
        onSelected();
      }}
      sx={item.destructive ? { color: 'error.main' } : undefined}
    >
      {item.label}
    </MenuItem>
  );
}
