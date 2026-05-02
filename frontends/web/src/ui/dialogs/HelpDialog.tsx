import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { isModEnter } from '@/util/keyboard';

export function HelpDialog({ onClose }: { onClose: () => void }) {
  const version =
    (globalThis as { __GRAFFITI_VERSION__?: string }).__GRAFFITI_VERSION__ ?? 'dev';
  return (
    <Dialog
      open
      onClose={onClose}
      disableRestoreFocus
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          onKeyDown: (e: React.KeyboardEvent) => {
            if (!isModEnter(e)) return;
            e.preventDefault();
            onClose();
          },
        },
      }}
    >
      <DialogTitle>Graffiti v{version}</DialogTitle>
      <DialogContent>
        <p className="text-sm opacity-80">
          Create customized callgraphs from your favorite editor. Connect a backend (IDA, IntelliJ,
          VSCode, ...) and use Ctrl+Shift+A in the IDE to add nodes.
        </p>
        <ul className="mt-3 list-disc pl-5 text-sm">
          <li>Ctrl+Shift+P — Command palette</li>
          <li>Ctrl+P — Go to tab</li>
          <li>Ctrl+F — Search nodes in the focused graph (primary or side) and jump</li>
          <li>Ctrl+Shift+F — Search all tabs; picking a result opens that graph on primary and jumps</li>
          <li>Ctrl+Z / Ctrl+Y — Undo / Redo</li>
          <li>Esc — Clear node/edge selection (clicking the empty canvas only moves pane focus)</li>
          <li>
            Home / canvas fit-view — With a selected node, center and zoom to it; otherwise fit the
            whole graph in the focused pane
          </li>
          <li>Ctrl+Q / Ctrl+Shift+Q — Add comment / text node</li>
          <li>Ctrl+I / Ctrl+Alt+Shift+I — Swap arrow / focus target</li>
          <li>Ctrl+. — Toggle inspector panel</li>
          <li>Ctrl+\ — Open current tab in side pane</li>
        </ul>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose} autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
