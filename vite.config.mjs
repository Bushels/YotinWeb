import { defineConfig } from 'vite';
import { resolve } from 'node:path';
const here = import.meta.dirname;

// Multi-page static build. Everything in public/ is copied verbatim (assets, robots,
// sitemap, the allow-listed operator routes). Hashed bundles go to /_app/ so the
// existing immutable header rule for /assets/ keeps applying to public assets and a
// second immutable rule covers the hashed bundles.
export default defineConfig({
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: '_app',
    assetsInlineLimit: 0,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(here, 'index.html'),
        privacy: resolve(here, 'privacy.html'),
      },
    },
  },
});
