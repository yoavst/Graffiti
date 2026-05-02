import { useState } from 'react';
import { useAtom } from 'jotai';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { authTokenAtom } from '@/state/connection';
import { generateAuthToken, isValidUuidV4 } from '@/util/ids';

export function TokenDialog({ onClose }: { onClose: () => void }) {
  const [token, setToken] = useAtom(authTokenAtom);
  const [v, setV] = useState(token ?? '');
  const trimmed = v.trim();
  const valid = isValidUuidV4(trimmed);
  const showError = trimmed !== '' && !valid;

  function save() {
    if (!valid) return;
    setToken(trimmed);
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: (e: React.FormEvent) => {
            e.preventDefault();
            save();
          },
        },
      }}
    >
      <DialogTitle>Multi-User Token</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Graffiti uses a token to authenticate you with a multi-user server. The token is a UUID v4
          shared between the frontend and the backend. Backends cache it under{' '}
          <code>~/.graffiti/token</code>.
        </DialogContentText>
        <div className="flex items-start gap-2">
          <TextField
            autoFocus
            fullWidth
            size="small"
            value={v}
            onChange={(e) => setV(e.target.value)}
            placeholder="UUID v4"
            error={showError}
            helperText={showError ? 'Invalid UUID v4' : ' '}
          />
          <Button
            variant="outlined"
            onClick={() => setV(generateAuthToken())}
            sx={{ flexShrink: 0 }}
          >
            Generate
          </Button>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!valid}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
