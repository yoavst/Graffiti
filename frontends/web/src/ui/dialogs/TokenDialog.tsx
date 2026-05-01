import { useState } from 'react';
import { useAtom } from 'jotai';
import { authTokenAtom } from '@/state/connection';
import { generateAuthToken, isValidUuidV4 } from '@/util/ids';

export function TokenDialog({ onClose }: { onClose: () => void }) {
  const [token, setToken] = useAtom(authTokenAtom);
  const [v, setV] = useState(token ?? '');
  const valid = isValidUuidV4(v.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[36rem] rounded-lg border border-(--color-border) bg-(--color-bg-2) p-4 shadow-xl">
        <h2 className="mb-2 text-lg font-semibold">Multi-User Token</h2>
        <p className="mb-3 text-sm opacity-80">
          Graffiti uses a token to authenticate you with a multi-user server. The token is a UUID v4
          shared between the frontend and the backend. Backends cache it under
          <code className="mx-1">~/.graffiti/token</code>.
        </p>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded border border-(--color-border) bg-(--color-bg-3) px-2 py-1"
            value={v}
            onChange={(e) => setV(e.target.value)}
            placeholder="UUID v4"
          />
          <button
            className="rounded border border-(--color-border) px-2 py-1 text-xs"
            onClick={() => setV(generateAuthToken())}
          >
            Generate
          </button>
        </div>
        <div className="mt-1 text-xs opacity-60">
          {v.trim() && !valid ? 'Invalid UUID v4' : ' '}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded border border-(--color-border) px-3 py-1 text-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="rounded bg-(--color-accent) px-3 py-1 text-sm text-black disabled:opacity-50"
            disabled={!valid}
            onClick={() => {
              setToken(v.trim());
              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
