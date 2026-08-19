// Asset manifest (spec §6): every emitted URL in dist/ is assigned to exactly one bucket, with
// deterministic raw + gzip(-9) sizes. Consumed by scripts/budget.mjs and the Vite plugin in
// vite.config.mjs (which writes dist/asset-manifest.json after each build).
//
//   critical  index.html, privacy.html, CSS, fonts (public/fonts/**), the chapter-0 poster/still,
//             the WellFi wordmark, the Yotin icon
//   ui        every /_app/*.js except the world chunk
//   world     the /_app/boot*.js chunk (three + world/field/conductor modules)
//   still     /assets/stills/ch1..6.*
//   lazy      everything else
import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

export const BUCKETS = ['critical', 'ui', 'world', 'still', 'lazy'];

const CRITICAL_URLS = new Set([
  '/index.html',
  '/privacy.html',
  '/assets/wellfi-logo.webp',
  '/assets/yotin-icon.png',
]);

/** Map an emitted URL (leading slash, forward slashes) to its bucket. Order = precedence. */
export function bucketFor(url) {
  if (CRITICAL_URLS.has(url)) return 'critical';
  if (/^\/_app\/.*\.css$/.test(url)) return 'critical';
  if (/^\/assets\/fonts\//.test(url) || /^\/fonts\//.test(url)) return 'critical';
  if (/^\/assets\/stills\/ch0\.[a-z0-9]+$/i.test(url)) return 'critical';
  if (/^\/assets\/stills\/ch[1-6]\.[a-z0-9]+$/i.test(url)) return 'still';
  if (/^\/_app\/boot[^/]*\.js$/.test(url)) return 'world';
  if (/^\/_app\/[^/]*\.js$/.test(url)) return 'ui';
  return 'lazy';
}

/** Coarse kind used by the sub-caps in budget.mjs. */
export function kindFor(url) {
  if (/\.html?$/i.test(url)) return 'html';
  if (/\.css$/i.test(url)) return 'css';
  if (/\.(woff2?|ttf|otf)$/i.test(url)) return 'font';
  if (/\.m?js$/i.test(url)) return 'js';
  if (/\.(webp|png|jpe?g|avif|gif|svg)$/i.test(url)) return 'image';
  if (/\.(mp4|webm)$/i.test(url)) return 'video';
  return 'other';
}

function walk(dir, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, out);
    else if (entry.isFile()) out.push('/' + path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

/** Walk a built dist/ directory and return the manifest object (sorted, one entry per URL). */
export function buildManifest(distDir) {
  const urls = walk(distDir).filter((u) => u !== '/asset-manifest.json').sort();
  const assets = urls.map((url) => {
    const buf = fs.readFileSync(path.join(distDir, url));
    return {
      url,
      bucket: bucketFor(url),
      kind: kindFor(url),
      bytes: buf.length,
      gzipBytes: gzipSync(buf, { level: 9 }).length,
    };
  });
  const seen = new Set();
  for (const a of assets) {
    if (seen.has(a.url)) throw new Error('duplicate manifest URL ' + a.url);
    seen.add(a.url);
  }
  const totals = Object.fromEntries(BUCKETS.map((b) => [b, { bytes: 0, gzipBytes: 0, count: 0 }]));
  for (const a of assets) { const t = totals[a.bucket]; t.bytes += a.bytes; t.gzipBytes += a.gzipBytes; t.count += 1; }
  return { generatedAt: new Date().toISOString(), distDir: path.basename(distDir), gzip: 'node:zlib level 9', assets, totals };
}

export function writeManifest(distDir) {
  const manifest = buildManifest(distDir);
  fs.writeFileSync(path.join(distDir, 'asset-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

/** Vite plugin: writes dist/asset-manifest.json once the bundle (and public/ copies) are on disk. */
export function assetManifestPlugin() {
  let outDir = 'dist';
  return {
    name: 'yotin-asset-manifest',
    apply: 'build',
    configResolved(config) { outDir = path.resolve(config.root, config.build.outDir); },
    closeBundle() {
      const m = writeManifest(outDir);
      const kb = (n) => (n / 1024).toFixed(1).padStart(7) + ' KB';
      const line = BUCKETS.map((b) => `${b} ${kb(m.totals[b].gzipBytes)} gz (${m.totals[b].count})`).join(' · ');
      console.log('\nasset-manifest.json: ' + line + '\n');
    },
  };
}

// CLI: node scripts/manifest.mjs [dist]
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dist = path.resolve(process.argv[2] || 'dist');
  const m = writeManifest(dist);
  console.log(`wrote ${path.join(dist, 'asset-manifest.json')} (${m.assets.length} assets)`);
}
