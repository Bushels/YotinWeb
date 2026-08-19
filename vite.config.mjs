import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { assetManifestPlugin } from './scripts/manifest.mjs';
const here = import.meta.dirname;

// Multi-page static build. Everything in public/ is copied verbatim (assets, robots,
// sitemap, the allow-listed operator routes). Hashed bundles go to /_app/ so the
// existing immutable header rule for /assets/ keeps applying to public assets and a
// second immutable rule covers the hashed bundles.
export default defineConfig({
  publicDir: 'public',
  plugins: [assetManifestPlugin()],
  build: {
    outDir: 'dist',
    assetsDir: '_app',
    assetsInlineLimit: 0,
    sourcemap: false,
    rollupOptions: {
      output: {
        // One world chunk (spec §6): three.js and every src/world module except the pure-data layout.js that the
        // rail's formation legend imports on the stills path. The chunk keeps the name "boot" so the resource
        // contract (scripts/manifest.mjs: /_app/boot*.js = world bucket) and the reduced-motion smoke hold.
        manualChunks(id) {
          const n = id.split(String.fromCharCode(92)).join('/');
          if (n.includes('/node_modules/three/')) return 'boot';
          if (n.includes('/src/world/') && !n.endsWith('/layout.js')) return 'boot';
          if (n.endsWith('/src/boot.js') || n.endsWith('/src/interactions.js') || n.endsWith('/src/cameraRig.js') || n.endsWith('/src/conductor.js')) return 'boot';
          return undefined;
        },
      },
      input: {
        main: resolve(here, 'index.html'),
        privacy: resolve(here, 'privacy.html'),
      },
    },
  },
});
