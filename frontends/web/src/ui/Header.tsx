import { useAtom, useAtomValue, useSetAtom, useStore } from 'jotai';
import { appOverlayAtom } from '@/state/appOverlay';
import { useEffect, useRef, type ChangeEvent } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import HelpIcon from '@mui/icons-material/Help';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import UndoOutlinedIcon from '@mui/icons-material/UndoOutlined';
import RedoOutlinedIcon from '@mui/icons-material/RedoOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import {
  authTokenAtom,
  connectionStatusAtom,
  connectionUrlAtom,
  defaultSocketUrl,
  lastConnectedUrlAtom,
} from '@/state/connection';
import {
  isDomainModeAtom,
  isExistingToNewAtom,
  isNewWillBeSelectedAtom,
} from '@/state/settings';
import { connect } from '@/network/websocket';
import { wsClientAtom } from '@/state/wsClient';
import { dispatchInbound } from '@/network/protocol/dispatch';
import { getStore } from '@/state/store';
import { getActiveTabFromStore, getTabFull } from '@/state/registry';
import { addCommentAction, addTextNodeAction } from '@/commands/addNodeActions';
import { openNodeSearchInCurrentTab, runExportCurrentTabJson } from '@/commands/commands';
import { importUserPickedFiles } from '@/persistence/tabImport';
import { exportAllTabsToTar } from '@/persistence/importExport';
import { activeTabIdAtom, currentTabIdAtom } from '@/state/workspaces';
import { dialogs } from '@/ui/dialogs/Dialogs';
import { ShareGraphDialog } from '@/ui/dialogs/ShareGraphDialog';

export function Header() {
  const [url, setUrl] = useAtom(connectionUrlAtom);
  const status = useAtomValue(connectionStatusAtom);
  const setStatus = useSetAtom(connectionStatusAtom);
  const isDomain = useAtomValue(isDomainModeAtom);
  const lastUrl = useAtomValue(lastConnectedUrlAtom);
  const setLastUrl = useSetAtom(lastConnectedUrlAtom);
  const token = useAtomValue(authTokenAtom);
  const [existingToNew, setExistingToNew] = useAtom(isExistingToNewAtom);
  const [newWillBeSelected, setNewWillBeSelected] = useAtom(isNewWillBeSelectedAtom);
  const [client, setClient] = useAtom(wsClientAtom);
  const store = useStore();
  const setCurrentTabId = useSetAtom(currentTabIdAtom);
  const activeTabId = useAtomValue(activeTabIdAtom);
  const setOverlay = useSetAtom(appOverlayAtom);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Initial url
  useEffect(() => {
    if (!url) setUrl(lastUrl || defaultSocketUrl(isDomain));
  }, [url, lastUrl, isDomain, setUrl]);

  function doConnect() {
    if (client) client.close();
    const u = url.trim() || defaultSocketUrl(isDomain);
    // We resolve `c` lazily inside the message handler so that handlers like
    // MCP can send replies (env.ws). The toggle reads also go through the
    // store rather than React-captured locals so the latest values are used
    // even if the user flips a checkbox after connecting.
    let c: ReturnType<typeof connect> | null = null;
    setLastUrl(u);
    c = connect(u, {
      onStatus: (s) => {
        setStatus(s);
      },
      onMessage: (msg) => {
        const store = getStore();
        dispatchInbound(
          {
            store,
            getCurrentTab: () => getActiveTabFromStore(store),
            getTab: getTabFull,
            ws: c,
            isExistingToNew: () => store.get(isExistingToNewAtom),
            isNewWillBeSelected: () => store.get(isNewWillBeSelectedAtom),
          },
          msg,
        );
      },
      onAuthRequired: () => {
        if (!token) {
          setOverlay('token');
          return null;
        }
        return token;
      },
    });
    setClient(c);
  }

  function disconnect() {
    if (client) client.close();
    setClient(null);
  }

  async function onImportFilesChosen(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const list = input.files;
    input.value = '';
    if (!list?.length) return;
    const { firstTabId, targetMissing } = await importUserPickedFiles(Array.from(list));
    if (targetMissing) {
      await dialogs.alert('No tab group to import into. Open a workspace with at least one tab first.', {
        title: 'Import',
      });
      return;
    }
    if (firstTabId) setCurrentTabId(firstTabId);
  }

  const statusColor =
    status === 'connected' ? '#22c55e'
      : status === 'connecting' ? '#eab308'
        : status === 'error' ? '#ef4444'
          : '#6b7280';

  return (
    <header className="flex items-center gap-2 border-b border-(--color-border) bg-(--color-bg-2) px-3 py-2">
      <input
        ref={importInputRef}
        type="file"
        className="sr-only"
        accept=".json,.tar,application/json,application/x-tar"
        multiple
        onChange={(e) => void onImportFilesChosen(e)}
      />
      <img src="/icon.png" alt="Graffiti" className="h-7 w-7" />
      <h1 className="text-lg font-semibold mr-3">Graffiti</h1>

      <div className="flex-1" />

      <div className="flex shrink-0 items-center gap-1">
        <Tooltip title="Import JSON or TAR…">
          <IconButton size="small" onClick={() => importInputRef.current?.click()}>
            <UploadOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip
          title={`Export current tab as JSON (click or Mod+S)\nExport all tabs as TAR (right-click or Ctrl+Alt+S)`}
          slotProps={{ tooltip: { sx: { whiteSpace: 'pre-line' } } }}
        >
          <IconButton
            size="small"
            onClick={() => void runExportCurrentTabJson(store)}
            onContextMenu={(e) => {
              e.preventDefault();
              void exportAllTabsToTar(store);
            }}
          >
            <DownloadOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Share graph (JPEG, SVG, Mermaid)…">
          <IconButton size="small" onClick={() => setOverlay('shareGraph')}>
            <ShareOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Add text node (Ctrl+Shift+Q)">
          <IconButton size="small" onClick={() => void addTextNodeAction(store)}>
            <NoteAddOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Add comment to selected node (Ctrl+Q)">
          <IconButton size="small" onClick={() => void addCommentAction(store)}>
            <ChatBubbleOutlineOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Undo (Ctrl+Z)">
          <IconButton
            size="small"
            onClick={() => {
              if (!activeTabId) return;
              getTabFull(activeTabId)?.actions.undo();
            }}
          >
            <UndoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Redo (Ctrl+Y / Ctrl+Shift+Z)">
          <IconButton
            size="small"
            onClick={() => {
              if (!activeTabId) return;
              getTabFull(activeTabId)?.actions.redo();
            }}
          >
            <RedoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Search nodes in the focused graph (Ctrl+F)">
          <IconButton size="small" onClick={() => openNodeSearchInCurrentTab(store)}>
            <SearchOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip
          title={`Arrow direction (Ctrl+I)\nFocus target (Ctrl+Alt+Shift+I)`}
          slotProps={{ tooltip: { sx: { whiteSpace: 'pre-line' } } }}
        >
          <button
            type="button"
            className="header-arrow-toggle focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--color-accent) focus-visible:outline-offset-2"
            aria-label="Edge direction and default selection after add from backend"
            onClick={() => setExistingToNew(!existingToNew)}
            onContextMenu={(e) => {
              e.preventDefault();
              setNewWillBeSelected(!newWillBeSelected);
            }}
          >
            <span className="header-arrow-toggle__row">
              <span
                className={`header-arrow-toggle__text ${newWillBeSelected ? '' : 'header-arrow-toggle__text--bold'}`}
                data-content="Existing"
              >
                Existing
              </span>
              <span className="header-arrow-toggle__track" aria-hidden>
                <span className="header-arrow-toggle__line" />
                <span
                  className={`header-arrow-toggle__head ${existingToNew ? 'header-arrow-toggle__head--e2n' : ''}`}
                />
              </span>
              <span
                className={`header-arrow-toggle__text ${newWillBeSelected ? 'header-arrow-toggle__text--bold' : ''}`}
                data-content="New"
              >
                New
              </span>
            </span>
          </button>
        </Tooltip>
      </div>

      <TextField
        type="url"
        size="small"
        variant="outlined"
        sx={{ width: '16rem' }}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={defaultSocketUrl(isDomain)}
      />


      <Tooltip title={`${!client ? 'Disconnect' : 'Connect'} (${status})`}>
        <IconButton
          size="small"
          onClick={client ? disconnect : doConnect}
          sx={{
            bgcolor: statusColor,
            '&:hover': { bgcolor: statusColor, opacity: 0.9 },
          }}
        >
          {client ? <PowerSettingsNewIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
        </IconButton>
      </Tooltip>

      <Tooltip title="Manage token (Ctrl+K)">
        <IconButton size="small" onClick={() => setOverlay('token')}>
          <KeyOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Help (?)">
        <IconButton size="small" onClick={() => setOverlay('help')}>
          <HelpIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <ShareGraphDialog />
    </header>
  );
}
