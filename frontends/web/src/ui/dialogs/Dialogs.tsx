// Imperative alert/confirm/prompt replacements that render proper modals
// instead of the browser's built-in dialogs. Backed by a Jotai atom so any
// component can pop a dialog without prop-drilling.

import { atom, useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';

type AlertSpec = {
  kind: 'alert';
  title?: string;
  message: string;
  resolve: () => void;
};

type ConfirmSpec = {
  kind: 'confirm';
  title?: string;
  message: string;
  destructive?: boolean;
  confirmLabel?: string;
  resolve: (ok: boolean) => void;
};

type PromptSpec = {
  kind: 'prompt';
  title?: string;
  message?: string;
  initial?: string;
  placeholder?: string;
  confirmLabel?: string;
  multiline?: boolean;
  resolve: (value: string | null) => void;
};

type DialogSpec = AlertSpec | ConfirmSpec | PromptSpec;

const dialogAtom = atom<DialogSpec | null>(null);

let setterRef: ((spec: DialogSpec | null) => void) | null = null;

function open<T>(make: (resolve: (v: T) => void) => DialogSpec): Promise<T> {
  return new Promise<T>((resolve) => {
    if (!setterRef) {
      // Fallback if the host isn't mounted — should not happen in normal use.
      console.warn('DialogHost not mounted; falling back to console.');
      resolve(undefined as T);
      return;
    }
    setterRef(make(resolve));
  });
}

export const dialogs = {
  alert(message: string, opts?: { title?: string }): Promise<void> {
    return open<void>((resolve) => ({
      kind: 'alert',
      message,
      title: opts?.title,
      resolve: () => resolve(),
    }));
  },
  confirm(
    message: string,
    opts?: { title?: string; destructive?: boolean; confirmLabel?: string },
  ): Promise<boolean> {
    return open<boolean>((resolve) => ({
      kind: 'confirm',
      message,
      title: opts?.title,
      destructive: opts?.destructive,
      confirmLabel: opts?.confirmLabel,
      resolve,
    }));
  },
  prompt(
    message: string,
    opts?: {
      title?: string;
      initial?: string;
      placeholder?: string;
      confirmLabel?: string;
      multiline?: boolean;
    },
  ): Promise<string | null> {
    return open<string | null>((resolve) => ({
      kind: 'prompt',
      message,
      title: opts?.title,
      initial: opts?.initial,
      placeholder: opts?.placeholder,
      confirmLabel: opts?.confirmLabel,
      multiline: opts?.multiline,
      resolve,
    }));
  },
};

export function DialogHost() {
  const [spec, setSpec] = useAtom(dialogAtom);
  useEffect(() => {
    setterRef = setSpec;
    return () => {
      setterRef = null;
    };
  }, [setSpec]);

  if (!spec) return null;

  function close(result: unknown) {
    if (!spec) return;
    setSpec(null);
    if (spec.kind === 'alert') (spec.resolve as () => void)();
    else if (spec.kind === 'confirm') (spec.resolve as (b: boolean) => void)(result as boolean);
    else (spec.resolve as (v: string | null) => void)(result as string | null);
  }

  return <DialogShell spec={spec} onClose={close} />;
}

function DialogShell({
  spec,
  onClose,
}: {
  spec: DialogSpec;
  onClose: (result: unknown) => void;
}) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [value, setValue] = useState(spec.kind === 'prompt' ? (spec.initial ?? '') : '');

  // Focus the input (prompt) or the primary button (alert/confirm) on mount.
  useEffect(() => {
    if (spec.kind === 'prompt') inputRef.current?.focus();
  }, [spec.kind]);

  function cancel() {
    if (spec.kind === 'alert') onClose(undefined);
    else if (spec.kind === 'confirm') onClose(false);
    else onClose(null);
  }

  function confirm() {
    if (spec.kind === 'alert') onClose(undefined);
    else if (spec.kind === 'confirm') onClose(true);
    else onClose(value);
  }

  const confirmLabel =
    spec.kind === 'alert'
      ? 'OK'
      : spec.kind === 'confirm'
        ? (spec.confirmLabel ?? (spec.destructive ? 'Delete' : 'OK'))
        : (spec.confirmLabel ?? 'OK');

  const destructive = spec.kind === 'confirm' && !!spec.destructive;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={cancel}
      onKeyDown={(e) => {
        if (e.key === 'Escape') cancel();
      }}
    >
      <div
        className="w-[28rem] max-w-[90vw] rounded-lg border border-(--color-border) bg-(--color-bg-2) p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {spec.title && <h2 className="mb-2 text-base font-semibold">{spec.title}</h2>}
        {spec.kind === 'prompt' ? (
          <>
            {spec.message && <p className="mb-2 text-sm opacity-80">{spec.message}</p>}
            {spec.multiline ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                className="w-full resize-y rounded border border-(--color-border) bg-(--color-bg-3) px-2 py-1.5 text-sm font-mono min-h-24"
                value={value}
                placeholder={spec.placeholder}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  // Enter without modifier confirms; Shift+Enter inserts a newline.
                  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    confirm();
                  }
                  if (e.key === 'Escape') cancel();
                }}
              />
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                className="w-full rounded border border-(--color-border) bg-(--color-bg-3) px-2 py-1.5 text-sm"
                value={value}
                placeholder={spec.placeholder}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirm();
                  if (e.key === 'Escape') cancel();
                }}
              />
            )}
          </>
        ) : (
          <p className="text-sm whitespace-pre-wrap opacity-90">{spec.message}</p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          {spec.kind !== 'alert' && (
            <button
              className="rounded border border-(--color-border) px-3 py-1.5 text-sm hover:bg-(--color-bg-3)"
              onClick={cancel}
            >
              Cancel
            </button>
          )}
          <button
            className={`rounded px-3 py-1.5 text-sm ${
              destructive
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-(--color-accent) text-black'
            }`}
            onClick={confirm}
            autoFocus={spec.kind !== 'prompt'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
