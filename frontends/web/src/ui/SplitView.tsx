import { useAtom, useAtomValue } from 'jotai';
import { Suspense } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { GraphCanvas } from '@/flow/GraphCanvas';
import { TabHost } from '@/ui/TabHost';
import {
  activePaneAtom,
  currentTabIdAtom,
  sidePaneTabIdAtom,
  tabsAtom,
} from '@/state/workspaces';
import type { TabRow } from '@/persistence/db';

function PaneTitle({ tab, label }: { tab: TabRow | undefined; label: string }) {
  return (
    <div className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-1 rounded bg-(--color-bg-2)/80 px-2 py-0.5 text-xs text-(--color-fg-dim) backdrop-blur">
      <span className="uppercase opacity-70">{label}</span>
      <span className="text-(--color-fg)">{tab?.name ?? '—'}</span>
    </div>
  );
}

export function SplitView() {
  const [primary] = useAtom(currentTabIdAtom);
  const [side, setSide] = useAtom(sidePaneTabIdAtom);
  const tabs = useAtomValue(tabsAtom);
  const [activePane, setActivePane] = useAtom(activePaneAtom);

  if (!primary) return <div className="flex-1" />;

  const hasSide = !!(side && tabs.find((t) => t.id === side));
  const primaryTab = tabs.find((t) => t.id === primary);
  const sideTab = side ? tabs.find((t) => t.id === side) : undefined;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div
        className={`flex-1 min-h-0 relative ${
          hasSide && activePane === 'primary' ? 'ring-2 ring-(--color-accent) ring-inset' : ''
        }`}
        onMouseDownCapture={() => setActivePane('primary')}
      >
        {hasSide && <PaneTitle tab={primaryTab} label="primary" />}
        <Suspense fallback={null}>
          <TabHost tabId={primary} onActivate={() => setActivePane('primary')} />
        </Suspense>
      </div>
      {hasSide && (
        <div
          className={`flex-1 min-h-0 relative border-t border-(--color-border) ${
            activePane === 'side' ? 'ring-2 ring-(--color-accent) ring-inset' : ''
          }`}
          onMouseDownCapture={() => setActivePane('side')}
        >
          <PaneTitle tab={sideTab} label="side" />
          <div className="absolute right-2 top-2 z-20 flex items-center gap-1">
            <button
              className="flex items-center rounded bg-(--color-bg-2) px-2 py-0.5 hover:bg-(--color-bg-3)"
              onClick={() => {
                setSide(null);
                setActivePane('primary');
              }}
              title="Close side pane"
            >
              <CloseIcon fontSize="small" />
            </button>
          </div>
          <Suspense fallback={null}>
            <TabHost tabId={side!} onActivate={() => setActivePane('side')} />
          </Suspense>
        </div>
      )}
    </div>
  );
}

void GraphCanvas; // referenced indirectly via TabHost
