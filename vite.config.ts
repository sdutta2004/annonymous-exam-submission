import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        checkin: resolve(__dirname, 'checkin.html'),
        admin: resolve(__dirname, 'admin.html'),
        inspector: resolve(__dirname, 'inspector.html'),
        explorer: resolve(__dirname, 'explorer.html'),
      },
    },
  },
});
