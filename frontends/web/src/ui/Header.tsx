import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
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
    status === 'connected' ? 'bg-green-500'
    : status === 'connecting' ? 'bg-yellow-500'
    : status === 'error' ? 'bg-red-500'
    : 'bg-gray-500';

  return (
    <header className="flex items-center gap-2 border-b border-(--color-border) bg-(--color-bg-2) px-3 py-2">
      <img src="/icon.png" alt="Graffiti" className="h-7 w-7" />
      <h1 className="text-lg font-semibold mr-3">Graffiti</h1>

      <div className="flex-1" />

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={existingToNew}
          onChange={(e) => setExistingToNew(e.target.checked)}
        />
        <span>existing→new</span>
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={newWillBeSelected}
          onChange={(e) => setNewWillBeSelected(e.target.checked)}
        />
        <span>focus new</span>
      </label>

      <input
        type="url"
        className="rounded border border-(--color-border) bg-(--color-bg-3) px-2 py-1 text-xs w-64"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={defaultSocketUrl(isDomain)}
      />

      {client ? (
        <button
          className={`rounded px-2 py-1 text-xs text-white ${statusColor}`}
          onClick={disconnect}
          title={`Disconnect (${status})`}
        >
          ⏻
        </button>
      ) : (
        <button
          className={`rounded px-2 py-1 text-xs text-white ${statusColor}`}
          onClick={doConnect}
          title={`Connect (${status})`}
        >
          ▶
        </button>
      )}

      <button
        className="rounded border border-(--color-border) px-2 py-1 text-xs"
        onClick={onOpenToken}
        title="Manage token (Ctrl+K)"
      >
        🔑
      </button>
      <button
        className="rounded border border-(--color-border) px-2 py-1 text-xs"
        onClick={onOpenHelp}
        title="Help (?)"
      >
        ?
      </button>
    </header>
  );
}
