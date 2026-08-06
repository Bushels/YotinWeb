import { readFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { brotliCompressSync, constants } from 'node:zlib';

// This is a deliberately conservative *estimate* of the resources a fresh
// Chromium/Skwasm visitor needs after the Flutter route starts. It is not a
// substitute for Vercel browser-transfer measurements: CDN compression,
// headers, connection reuse, and the cross-origin R3F scene are measured
// separately at the release gate.
//
// The list was captured from a fresh 390 px browser load on 2026-08-06. Keep
// it explicit: a new startup resource must be reviewed before it silently
// joins the first-visit cost.
const firstVisitFiles = [
  'index.html',
  'flutter_bootstrap.js',
  'main.dart.mjs',
  'main.dart.wasm',
  'canvaskit/skwasm.js',
  'canvaskit/skwasm.wasm',
  'favicon.png',
  'assets/FontManifest.json',
  'assets/AssetManifest.bin.json',
  'assets/fonts/MaterialIcons-Regular.otf',
  'assets/packages/cupertino_icons/assets/CupertinoIcons.ttf',
  'assets/assets/yotin-icon.png',
  'assets/assets/wellfi-logo.webp',
  'assets/assets/wellfi-island-r3f-poster.webp',
  'assets/assets/wellfi-internal-ghost.webp',
  'assets/assets/drill-formation.webp',
  'assets/assets/drill-casing.webp',
  'assets/assets/fonts/Roboto-Regular.woff2',
  'assets/assets/fonts/SpaceGrotesk-Bold.ttf',
  'assets/assets/fonts/Archivo-Bold.ttf',
  'assets/assets/fonts/IBMPlexSans-Regular.ttf',
  'assets/assets/fonts/IBMPlexMono-Medium.ttf',
];

const defaultBudgetBytes = 2_621_440; // 2.5 MiB, deliberately app-route only.
const inputPath = process.argv[2];
const budgetInput = process.env.YOTIN_FIELD_REVIEW_MAX_BROTLI_BYTES;
const buildPath = resolve(inputPath ?? 'build/field-review');
const budgetBytes =
  budgetInput === undefined ? defaultBudgetBytes : Number.parseInt(budgetInput, 10);

if (!Number.isSafeInteger(budgetBytes) || budgetBytes <= 0) {
  throw new Error(
    'YOTIN_FIELD_REVIEW_MAX_BROTLI_BYTES must be a positive integer byte count.',
  );
}

try {
  if (!statSync(buildPath).isDirectory()) {
    throw new Error('not a directory');
  }
} catch {
  throw new Error('Flutter payload build directory is missing: ' + buildPath);
}

const rows = firstVisitFiles.map((relativePath) => {
  const absolutePath = join(buildPath, ...relativePath.split('/'));
  let contents;
  try {
    contents = readFileSync(absolutePath);
  } catch {
    throw new Error(
      'Flutter first-visit payload resource is missing: ' + relativePath,
    );
  }

  return {
    relativePath,
    rawBytes: contents.length,
    brotliBytes: brotliCompressSync(contents, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 11,
      },
    }).length,
  };
});

const rawBytes = rows.reduce((total, row) => total + row.rawBytes, 0);
const brotliBytes = rows.reduce((total, row) => total + row.brotliBytes, 0);
const headroomBytes = budgetBytes - brotliBytes;
const formatBytes = (value) => (value / 1024 / 1024).toFixed(2) + ' MiB';

console.log(
  [
    'Field Review Chromium/Skwasm first-visit estimate:',
    formatBytes(brotliBytes) + ' Brotli',
    '(' + formatBytes(rawBytes) + ' raw)',
    'against ' + formatBytes(budgetBytes) + ' budget.',
  ].join(' '),
);
console.log(
  'Estimated budget headroom: ' +
    headroomBytes.toLocaleString('en-CA') +
    ' bytes.',
);

if (brotliBytes > budgetBytes) {
  console.error(
    [
      'Field Review estimated Chromium/Skwasm first-visit payload exceeds its app-route budget.',
      brotliBytes.toLocaleString('en-CA') +
        ' > ' +
        budgetBytes.toLocaleString('en-CA') +
        ' bytes.',
      'Remove or defer a proven startup resource, or make a separately reviewed budget decision.',
    ].join(' '),
  );
  process.exitCode = 1;
}
