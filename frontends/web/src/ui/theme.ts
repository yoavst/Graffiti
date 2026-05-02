import { createTheme } from '@mui/material/styles';

// Bridge MUI's palette to the design tokens defined in src/styles.css.
// Dark-only: the app does not support light mode (see state/settings.ts).
// Hex values are duplicated rather than referenced as `var(--color-*)`
// because MUI palette manipulation (alpha, lighten, darken) needs concrete
// colors at theme-init time. Keep these in sync with src/styles.css.
export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'dark',
    primary: { main: '#4cafef' },
    error: { main: '#e57373' },
    success: { main: '#66bb6a' },
    background: { default: '#1e1f22', paper: '#2b2d31' },
    text: { primary: '#e6e6e6', secondary: '#b0b0b0' },
    divider: '#3d3d3d',
  },
  typography: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
  },
  shape: { borderRadius: 4 },
});
