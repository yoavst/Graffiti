import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const VERSION = '_VERSION_';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  define: {
    __GRAFFITI_VERSION__: JSON.stringify(VERSION),
  },
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 5173,
    open: true,
  },
  test: {
    environment: 'jsdom',
    globals: false,
  },
});
