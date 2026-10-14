import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// En GitHub Pages el sitio vive en /relevo-web/; en local, en la raíz.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/relevo-web/' : '/',
  server: { host: '127.0.0.1', port: 5173, open: false },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        inicio: resolve(__dirname, 'index.html'),
        bitacora: resolve(__dirname, 'bitacora.html'),
        juego: resolve(__dirname, 'juego.html'),
        historia: resolve(__dirname, 'historia.html'),
        comunidad: resolve(__dirname, 'comunidad.html'),
      },
    },
  },
}));
