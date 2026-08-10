import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Fixed port so the web server always runs on localhost:3000.
      // Android connects via: adb reverse tcp:3000 tcp:3000 → http://127.0.0.1:3000/
      port: 3000,
      // Bind to all interfaces so adb reverse tunnelling works correctly.
      host: '0.0.0.0',
      // Allow requests from 127.0.0.1 (ADB reverse) and localhost.
      allowedHosts: ['localhost', '127.0.0.1', 'all'],
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
