export function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[40rem] max-h-[80vh] overflow-auto rounded-lg border border-(--color-border) bg-(--color-bg-2) p-4 shadow-xl">
        <h2 className="mb-2 text-lg font-semibold">
          Graffiti v{(globalThis as { __GRAFFITI_VERSION__?: string }).__GRAFFITI_VERSION__ ?? 'dev'}
        </h2>
        <p className="text-sm opacity-80">
          Create customized callgraphs from your favorite editor. Connect a backend (IDA, IntelliJ,
          VSCode, ...) and use Ctrl+Shift+A in the IDE to add nodes.
        </p>
        <ul className="mt-3 list-disc pl-5 text-sm">
          <li>Ctrl+Shift+P — Command palette</li>
          <li>Ctrl+F / Ctrl+Shift+F — Search current / all tabs</li>
          <li>Ctrl+Z / Ctrl+Y — Undo / Redo</li>
          <li>Home / Ctrl+Home — Focus selected / Reset zoom</li>
          <li>Ctrl+Q / Ctrl+Shift+Q — Add comment / text node</li>
          <li>Ctrl+I / Ctrl+Alt+Shift+I — Swap arrow / focus target</li>
          <li>Ctrl+E — Override label of selected node</li>
          <li>Ctrl+. — Toggle inspector panel</li>
          <li>Ctrl+\\ — Open current tab in side pane</li>
        </ul>
        <div className="mt-4 flex justify-end">
          <button className="rounded bg-(--color-accent) px-3 py-1 text-sm text-black" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
