import { useAtom, useAtomValue } from 'jotai';
import { Suspense } from 'react';
import { GraphCanvas } from '@/flow/GraphCanvas';
import { TabHost } from '@/ui/TabHost';
import {
  activePaneAtom,
  currentTabIdAtom,
  sidePaneTabIdAtom,
  tabsAtom,
} from '@/state/workspaces';

export function SplitView() {
  const [primary] = useAtom(currentTabIdAtom);
  const [side, setSide] = useAtom(sidePaneTabIdAtom);
  const tabs = useAtomValue(tabsAtom);
  const [activePane, setActivePane] = useAtom(activePaneAtom);

  if (!primary) return <div className="flex-1" />;

  const hasSide = !!(side && tabs.find((t) => t.id === side));

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div
        className={`flex-1 min-h-0 relative ${
          hasSide && activePane === 'primary' ? 'ring-2 ring-(--color-accent) ring-inset' : ''
        }`}
        onMouseDownCapture={() => setActivePane('primary')}
      >
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
          <button
            className="absolute right-1 top-1 z-20 rounded bg-(--color-bg-2) px-1 text-xs"
            onClick={() => {
              setSide(null);
              setActivePane('primary');
            }}
            title="Close side pane"
          >
            ×
          </button>
          <Suspense fallback={null}>
            <TabHost tabId={side!} onActivate={() => setActivePane('side')} />
          </Suspense>
        </div>
      )}
    </div>
  );
}

void GraphCanvas; // referenced indirectly via TabHost
