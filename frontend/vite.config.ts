import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Force a single Leaflet instance so leaflet.heat mutates the same L
    // that components import. Without dedupe, Vite can hand out a copy
    // when the plugin's `require('leaflet')` resolves through node_modules.
    dedupe: ['leaflet'],
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
});
