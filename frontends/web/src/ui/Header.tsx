import { useAtom, useAtomValue, useSetAtom, useStore } from 'jotai';
import { useEffect } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import HelpIcon from '@mui/icons-material/Help';
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
import { getCurrentTab, getTabFull } from '@/state/registry';
import { addCommentAction, addTextNodeAction } from '@/commands/addNodeActions';

export function Header({ onOpenToken, onOpenHelp }: { onOpenToken: () => void; onOpenHelp: () => void }) {
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
    c = connect(u, {
      onStatus: (s) => {
        setStatus(s);
        if (s === 'connected') setLastUrl(u);
      },
      onMessage: (msg) => {
        const store = getStore();
        dispatchInbound(
          {
            store,
            getCurrentTab: () => getCurrentTab(),
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
          onOpenToken();
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

  const statusColor =
    status === 'connected' ? '#22c55e'
      : status === 'connecting' ? '#eab308'
        : status === 'error' ? '#ef4444'
          : '#6b7280';

  return (
    <header className="flex items-center gap-2 border-b border-(--color-border) bg-(--color-bg-2) px-3 py-2">
      <img src="/icon.png" alt="Graffiti" className="h-7 w-7" />
      <h1 className="text-lg font-semibold mr-3">Graffiti</h1>

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

      <div className="flex-1" />

      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={existingToNew}
            onChange={(e) => setExistingToNew(e.target.checked)}
          />
        }
        label="existing→new"
        slotProps={{ typography: { sx: { fontSize: '0.75rem' } } }}
      />
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={newWillBeSelected}
            onChange={(e) => setNewWillBeSelected(e.target.checked)}
          />
        }
        label="focus new"
        slotProps={{ typography: { sx: { fontSize: '0.75rem' } } }}
      />

      <TextField
        type="url"
        size="small"
        variant="outlined"
        sx={{ width: '16rem' }}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={defaultSocketUrl(isDomain)}
      />

      {client ? (
        <Tooltip title={`Disconnect (${status})`}>
          <IconButton
            size="small"
            onClick={disconnect}
            sx={{
              bgcolor: statusColor,
              color: 'white',
              '&:hover': { bgcolor: statusColor, opacity: 0.9 },
            }}
          >
            <PowerSettingsNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title={`Connect (${status})`}>
          <IconButton
            size="small"
            onClick={doConnect}
            sx={{
              bgcolor: statusColor,
              color: 'white',
              '&:hover': { bgcolor: statusColor, opacity: 0.9 },
            }}
          >
            <PlayArrowIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title="Manage token (Ctrl+K)">
        <IconButton size="small" onClick={onOpenToken}>
          <KeyOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Help (?)">
        <IconButton size="small" onClick={onOpenHelp}>
          <HelpIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </header>
  );
}
