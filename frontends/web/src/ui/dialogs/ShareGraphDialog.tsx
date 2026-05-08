import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { Fragment, startTransition, useCallback, useEffect, useRef, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { activeGraphIdAtom } from '@/state/workspaces';
import { appOverlayAtom } from '@/state/appOverlay';
import { getFlowExportBridge } from '@/flow/flowExportBridge';
import {
  captureViewportToJpegBlob,
  captureViewportToSvgFile,
  downloadJpeg,
  safeExportBasename,
} from '@/flow/exportFlowCapture';
import { graphDocAtomFamily } from '@/state/graphDocAtoms';
import { graphsAtom } from '@/state/workspaces';
import { toMermaid } from '@/graph/mermaidExport';
import { dialogs } from '@/ui/dialogs/Dialogs';
import { isModEnter } from '@/util/keyboard';

const defaultDpi = 600;

export function ShareGraphDialog() {
  const overlay = useAtomValue(appOverlayAtom);
  const setOverlay = useSetAtom(appOverlayAtom);
  const open = overlay === 'shareGraph';
  const store = useStore();
  const [dpiStr, setDpiStr] = useState(String(defaultDpi));
  const [busy, setBusy] = useState(false);
  const [clipboardToast, setClipboardToast] = useState(false);
  const dpiInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) startTransition(() => setClipboardToast(false));
  }, [open]);

  const dpi = (() => {
    const n = Number.parseInt(dpiStr, 10);
    if (!Number.isFinite(n) || n < 72 || n > 2400) return defaultDpi;
    return n;
  })();

  const close = useCallback(() => {
    setOverlay('none');
  }, [setOverlay]);

  const runRasterOrSvg = useCallback(
    async (kind: 'jpeg' | 'svg') => {
      const graphId = store.get(activeGraphIdAtom);
      if (!graphId) {
        await dialogs.alert('No active graph to export.', { title: 'Share graph' });
        return;
      }
      const bridge = getFlowExportBridge(graphId);
      if (!bridge) {
        await dialogs.alert('Could not find the graph canvas for this graph.', { title: 'Share graph' });
        return;
      }
      setBusy(true);
      let restore: () => void = () => { };
      try {
        restore = await bridge.prepareFullGraphSnapshot();
        const el = bridge.getViewportElement();
        if (!el) throw new Error('Viewport not ready');
        const graph = store.get(graphsAtom).find((t) => t.id === graphId);
        const base = safeExportBasename(graph?.name);
        if (kind === 'jpeg') {
          const blob = await captureViewportToJpegBlob(el, dpi);
          downloadJpeg(`${base}.jpg`, blob);
        } else {
          await captureViewportToSvgFile(el, dpi, `${base}.svg`);
        }
      } catch (e) {
        console.error(e);
        await dialogs.alert(
          e instanceof Error ? e.message : 'Export failed. Try again after the layout finishes.',
          { title: 'Share graph' },
        );
      } finally {
        restore();
        setBusy(false);
        close();
      }
    },
    [dpi, store, close],
  );

  const runMermaid = useCallback(async () => {
    const graphId = store.get(activeGraphIdAtom);
    if (!graphId) {
      await dialogs.alert('No active graph to export.', { title: 'Share graph' });
      return;
    }
    const graph = store.get(graphsAtom).find((t) => t.id === graphId);
    const doc = store.get(graphDocAtomFamily(graphId));
    const text = toMermaid(doc, {
      gui: true,
      elkRenderer: graph?.layout === 'elk',
      darkMode: true,
    });
    if (!text.trim()) {
      await dialogs.alert('This graph has no nodes to export.', { title: 'Share graph' });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setClipboardToast(true);
    } catch {
      await dialogs.alert('Could not copy to clipboard.', { title: 'Share graph' });
    }
    close();
  }, [store, close]);

  return (
    <Fragment>
      <Dialog
        open={open}
        onClose={close}
        disableAutoFocus
        disableRestoreFocus
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            onKeyDown: (e: React.KeyboardEvent) => {
              if (!isModEnter(e) || busy) return;
              e.preventDefault();
              void runRasterOrSvg('jpeg');
            },
          },
          transition: {
            onEntered: () => {
              requestAnimationFrame(() => dpiInputRef.current?.focus());
            },
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 700 }}>Share graph</DialogTitle>
        <DialogContent>
          <TextField
            inputRef={dpiInputRef}
            label="dpi"
            type="number"
            fullWidth
            size="small"
            margin="dense"
            value={dpiStr}
            disabled={busy}
            onChange={(e) => setDpiStr(e.target.value)}
            slotProps={{ htmlInput: { min: 72, max: 2400, step: 1 } }}
            helperText="Used for JPEG and SVG raster resolution (72–2400)."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => void runRasterOrSvg('jpeg')}>JPEG</Button>
          <Button onClick={() => void runRasterOrSvg('svg')}>SVG</Button>
          <Button onClick={() => void runMermaid()}>Mermaid</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={clipboardToast}
        onClose={() => setClipboardToast(false)}
        autoHideDuration={2000}
        message="Copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Fragment>
  );
}
