import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const VERSION = '2.0';

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
    fs: {
      // When `fs.allow` is set, Vite no longer implicitly allows the project root.
      // Include the web root so `/index.html` can be served, plus the repo-level docs.
      allow: [path.resolve(__dirname), path.resolve(__dirname, '..', '..', 'docs')],
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
  },
});
