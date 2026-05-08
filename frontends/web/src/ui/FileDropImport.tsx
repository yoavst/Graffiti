import { useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { importUserPickedFiles } from '@/persistence/tabImport';
import { currentGraphIdAtom } from '@/state/workspaces';

export function FileDropImport() {
  const setCurrentGraphId = useSetAtom(currentGraphIdAtom);

  // Capture-phase listeners on `window` win against React Flow's own drag
  // handling on the canvas. We always preventDefault on dragenter/dragover
  // (otherwise the browser refuses the drop) and surface a banner so the
  // user can see something is happening.
  const [dragHover, setDragHover] = useState(false);
  useEffect(() => {
    function isFileDrag(e: DragEvent): boolean {
      const types = e.dataTransfer?.types;
      if (!types) return false;
      for (let i = 0; i < types.length; i++) {
        if (types[i] === 'Files') return true;
      }
      return false;
    }
    function onDragEnter(e: DragEvent) {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      setDragHover(true);
    }
    function onDragOver(e: DragEvent) {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    }
    function onDragLeave(e: DragEvent) {
      // Only clear when leaving the window
      if ((e as DragEvent & { relatedTarget?: EventTarget | null }).relatedTarget == null) {
        setDragHover(false);
      }
    }
    async function onDrop(e: DragEvent) {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      e.stopPropagation();
      setDragHover(false);

      const files = e.dataTransfer ? Array.from(e.dataTransfer.files) : [];
      if (files.length === 0) return;

      const { firstTabId: firstImportedTabId, targetMissing } = await importUserPickedFiles(files);
      if (targetMissing) {
        console.warn('drop: no target tab group');
        return;
      }

      if (firstImportedTabId) setCurrentGraphId(firstImportedTabId);
    }

    window.addEventListener('dragenter', onDragEnter, true);
    window.addEventListener('dragover', onDragOver, true);
    window.addEventListener('dragleave', onDragLeave, true);
    window.addEventListener('drop', onDrop, true);
    return () => {
      window.removeEventListener('dragenter', onDragEnter, true);
      window.removeEventListener('dragover', onDragOver, true);
      window.removeEventListener('dragleave', onDragLeave, true);
      window.removeEventListener('drop', onDrop, true);
    };
  }, [setCurrentGraphId]);

  if (!dragHover) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-(--color-accent)/20 text-2xl font-semibold text-(--color-accent) ring-4 ring-(--color-accent) ring-inset">
      Drop to import
    </div>
  );
}
