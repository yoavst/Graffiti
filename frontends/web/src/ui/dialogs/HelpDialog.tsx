import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { isModEnter } from '@/util/keyboard';
import { getHelpPlatforms, type HelpPlatformId } from './helpPlatforms';
import { useMemo, useState } from 'react';

export function HelpDialog({ onClose }: { onClose: () => void }) {
  const version =
    (globalThis as { __GRAFFITI_VERSION__?: string }).__GRAFFITI_VERSION__ ?? 'dev';
  const platforms = useMemo(() => getHelpPlatforms(version), [version]);
  const [selected, setSelected] = useState<HelpPlatformId | null>(null);

  const selectedPlatform = selected ? platforms.find((p) => p.id === selected) : null;
  return (
    <Dialog
      open
      onClose={onClose}
      disableRestoreFocus
      fullWidth
      maxWidth="md"
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
      <DialogTitle className="flex items-center gap-2">
        {selectedPlatform ?
          <IconButton size="small" onClick={() => setSelected(null)} aria-label="Back">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          : null}
        <span className="truncate">
          {selectedPlatform ? selectedPlatform.title : `Graffiti v${version}`}
        </span>
      </DialogTitle>

      <DialogContent>
        {selectedPlatform ?
          <div className="text-sm">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => <h2 className="mt-4 text-base font-semibold">{children}</h2>,
                h3: ({ children }) => <h3 className="mt-3 text-sm font-semibold">{children}</h3>,
                p: ({ children }) => <p className="mt-2 opacity-90">{children}</p>,
                ul: ({ children }) => <ul className="mt-2 list-disc pl-5">{children}</ul>,
                ol: ({ children }) => <ol className="mt-2 list-decimal pl-5">{children}</ol>,
                li: ({ children }) => <li className="mt-1">{children}</li>,
                code: ({ children }) => (
                  <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[12px]">{children}</code>
                ),
                pre: ({ children }) => (
                  <pre className="mt-2 overflow-auto rounded bg-white/10 p-2 text-[12px]">{children}</pre>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-(--color-accent) underline underline-offset-2"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {selectedPlatform.markdown}
            </ReactMarkdown>
          </div>
          : <div className="space-y-5">
            <div className="mt-1 text-sm opacity-80 italic">
              Create customized callgraph directly from your favorite editor.
            </div>
            <div className="mt-3 text-sm opacity-80">
              To run graffiti, you have to run the python server, and activate the graffiti plugin on
              your IDE. If you use a multi-user server, you can get the auth token from the key button
              on the top right of the screen. The key is cached for the backends at <code>~/.graffiti/token</code>.
            </div>

            <div className="space-y-2">
              {platforms.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded border border-(--color-border) bg-(--color-bg-2) px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img src={p.iconSrc} alt="" className="h-8 w-8 shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{p.title}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button variant="contained" size="small" onClick={() => setSelected(p.id)}>
                      Docs
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      color="primary"
                      component="a"
                      href={p.downloadFilename ? `/out/${p.downloadFilename}` : undefined}
                      disabled={!p.downloadFilename}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          onClick={() => {
            if (selectedPlatform) {
              setSelected(null);
            } else {
              onClose();
            }
          }}
          autoFocus
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
