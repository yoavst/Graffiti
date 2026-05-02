// Single shared websocket connection. The dispatcher inside `protocol/dispatch`
// drives state from inbound messages.

import { type ConnectionStatus } from '@/state/connection';

export interface WSEvents {
  onStatus: (s: ConnectionStatus) => void;
  onMessage: (msg: unknown) => void;
  onAuthRequired: () => string | null; // returns token or null to abort
}

export interface WSClient {
  url: string;
  send: (data: unknown) => void;
  close: () => void;
}

export function connect(url: string, events: WSEvents): WSClient {
  events.onStatus('connecting');
  const ws = new WebSocket(url);
  // Browsers fire `error` then `close` for failed handshakes; only `close` should
  // update status so we surface `error` instead of overwriting with `closed`.
  let failed = false;
  let suppressCloseStatus = false;

  ws.onopen = () => {
    events.onStatus('connected');
    document.dispatchEvent(
      new CustomEvent('graffiti_connect', {
        detail: { hostname: new URL(url).hostname, protocol: new URL(url).protocol },
      }),
    );
  };

  ws.onclose = () => {
    if (suppressCloseStatus) {
      suppressCloseStatus = false;
      return;
    }
    events.onStatus(failed ? 'error' : 'closed');
  };
  ws.onerror = () => {
    failed = true;
  };

  ws.onmessage = (e) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(typeof e.data === 'string' ? e.data : '{}');
    } catch {
      return;
    }
    if (
      parsed &&
      typeof parsed === 'object' &&
      (parsed as { type?: string }).type === 'auth_req_v1'
    ) {
      const token = events.onAuthRequired();
      if (token == null) {
        events.onStatus('auth_required');
        suppressCloseStatus = true;
        ws.close();
      } else {
        ws.send(JSON.stringify({ type: 'auth_resp_v1', token }));
      }
      return;
    }
    events.onMessage(parsed);
  };

  return {
    url,
    send: (data) => {
      if (ws.readyState !== ws.OPEN) return;
      ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    },
    close: () => ws.close(),
  };
}
