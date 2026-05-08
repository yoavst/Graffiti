import { useAtom, useAtomValue } from 'jotai';
import CloseIcon from '@mui/icons-material/Close';
import { GraphCanvas } from '@/flow/GraphCanvas';
import { GraphHost } from '@/ui/GraphHost';
import {
  activePaneAtom,
  currentGraphIdAtom,
  sidePaneGraphIdAtom,
  graphsAtom,
} from '@/state/workspaces';
import type { GraphRow } from '@/state/workspaceTypes';

function PaneTitle({ graph, label }: { graph: GraphRow | undefined; label: string }) {
  return (
    <div className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-1 rounded bg-(--color-bg-2)/80 px-2 py-0.5 text-xs text-(--color-fg-dim) backdrop-blur">
      <span className="uppercase opacity-70">{label}</span>
      <span className="text-(--color-fg)">{graph?.name ?? '—'}</span>
    </div>
  );
}

export function SplitView() {
  const [primary] = useAtom(currentGraphIdAtom);
  const [side, setSide] = useAtom(sidePaneGraphIdAtom);
  const graphs = useAtomValue(graphsAtom);
  const [activePane, setActivePane] = useAtom(activePaneAtom);

  if (!primary) return <div className="flex-1" />;

  const hasSide = !!(side && graphs.find((g) => g.id === side));
  const primaryGraph = graphs.find((g) => g.id === primary);
  const sideGraph = side ? graphs.find((g) => g.id === side) : undefined;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div
        className={`flex-1 min-h-0 relative ${hasSide && activePane === 'primary' ? 'ring-2 ring-(--color-accent) ring-inset' : ''
          }`}
        onMouseDownCapture={() => setActivePane('primary')}
      >
        {hasSide && <PaneTitle graph={primaryGraph} label="primary" />}
        <GraphHost graphId={primary} pane="primary" />
      </div>
      {hasSide && (
        <div
          className={`flex-1 min-h-0 relative border-t border-(--color-border) ${activePane === 'side' ? 'ring-2 ring-(--color-accent) ring-inset' : ''
            }`}
          onMouseDownCapture={() => setActivePane('side')}
        >
          <PaneTitle graph={sideGraph} label="side" />
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
          <GraphHost graphId={side!} pane="side" />
        </div>
      )}
    </div>
  );
}

void GraphCanvas; // referenced indirectly via GraphHost
