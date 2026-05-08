// Imperative alert/confirm/prompt replacements that render proper modals
// instead of the browser's built-in dialogs. Backed by a Jotai atom so any
// component can pop a dialog without prop-drilling.

import { atom, useAtom } from 'jotai';
import { useRef, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { isModEnter } from '@/util/keyboard';
import { getStore } from '@/state/store';

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


function open<T>(make: (resolve: (v: T) => void) => DialogSpec): Promise<T> {
  return new Promise<T>((resolve) => {
    getStore().set(dialogAtom, make(resolve));
  });
}

export const dialogs = {
  alert(message: string, opts?: { title?: string }): Promise<void> {
    return open<void>((resolve) => ({
      kind: 'alert',
      message,
      title: opts?.title,
      resolve,
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
  if (!spec) return null;

  function close(result: unknown) {
    if (!spec) return;
    setSpec(null);
    if (spec.kind === 'alert') spec.resolve();
    else if (spec.kind === 'confirm') spec.resolve(result as boolean);
    else spec.resolve(result as string | null);
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
  const [value, setValue] = useState(spec.kind === 'prompt' ? (spec.initial ?? '') : '');

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

  const promptInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);

  // Fade keeps content visibility:hidden until enter completes; autoFocus can
  // run too early. Focus after the transition (MUI transition slot onEntered).
  function focusPrimaryControlAfterEnter() {
    requestAnimationFrame(() => {
      if (spec.kind === 'prompt') {
        promptInputRef.current?.focus();
      } else {
        submitButtonRef.current?.focus();
      }
    });
  }

  // Rendering Paper as a <form> gives us free Enter-to-submit (browsers
  // submit on Enter inside the form, including from a single-line TextField).
  // Shift+Enter still inserts a newline in multiline mode, matching the old
  // textarea behavior.
  return (
    <Dialog
      open
      onClose={cancel}
      disableAutoFocus
      disableRestoreFocus
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: (e: React.FormEvent) => {
            e.preventDefault();
            confirm();
          },
          onKeyDown: (e: React.KeyboardEvent) => {
            if (!isModEnter(e)) return;
            e.preventDefault();
            confirm();
          },
        },
        transition: {
          onEntered: focusPrimaryControlAfterEnter,
        },
      }}
    >
      {spec.title && <DialogTitle>{spec.title}</DialogTitle>}
      <DialogContent>
        {spec.kind === 'prompt' ? (
          <>
            {spec.message && (
              <DialogContentText sx={{ mb: 2 }}>{spec.message}</DialogContentText>
            )}
            <TextField
              inputRef={promptInputRef}
              fullWidth
              size="small"
              variant="outlined"
              value={value}
              placeholder={spec.placeholder}
              onChange={(e) => setValue(e.target.value)}
              multiline={spec.multiline}
              minRows={spec.multiline ? 4 : undefined}
              slotProps={
                spec.multiline
                  ? { input: { sx: { fontFamily: 'monospace', fontSize: '0.875rem' } } }
                  : undefined
              }
            />
          </>
        ) : (
          <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>
            {spec.message}
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        {spec.kind !== 'alert' && (
          <Button onClick={cancel} color="inherit">
            Cancel
          </Button>
        )}
        <Button
          ref={submitButtonRef}
          type="submit"
          variant="contained"
          color={destructive ? 'error' : 'primary'}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
