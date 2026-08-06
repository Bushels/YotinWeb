import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const outputPath = resolve(process.argv[2] ?? 'build/public-home');

function requireDirectory(path) {
  if (!existsSync(path) || !statSync(path).isDirectory()) {
    throw new Error('Public-home candidate directory is missing: ' + path);
  }
}

function requireFile(relativePath) {
  const fullPath = join(outputPath, ...relativePath.split('/'));
  if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
    throw new Error('Public-home candidate is missing: ' + relativePath);
  }
  return fullPath;
}

function forbidFile(relativePath) {
  const fullPath = join(outputPath, ...relativePath.split('/'));
  if (existsSync(fullPath)) {
    throw new Error('Public-home candidate retains a field-only artifact: ' + relativePath);
  }
}

function requireText(text, fragment, label) {
  if (!text.includes(fragment)) {
    throw new Error(label + ' is missing: ' + fragment);
  }
}

requireDirectory(outputPath);
const index = readFileSync(requireFile('index.html'), 'utf8');

for (const fragment of [
  '<base href="/">',
  'data-yotin-surface="public-home"',
  '<meta name="robots" content="index,follow">',
  '<link rel="canonical" href="https://yotinenergy.com/">',
  '<title>Yotin Energy &mdash; Indigenous Energy Services &amp; WellFi Telemetry</title>',
  '"@type": "Organization"',
  '"@type": "Product"',
  '"@type": "FAQPage"',
  'id="public-shell"',
  'id="fallback-main"',
  'id="fallback-wellfi"',
  'id="fallback-benefits"',
  'id="fallback-insight"',
  'id="fallback-company"',
  'id="fallback-contact"',
  'id="skip-to-content"',
  'assets/assets/yotin-icon.png',
  'assets/assets/wellfi-logo.webp',
  'assets/assets/wellfi-island-r3f-poster.webp',
  'assets/yotin-icon.png',
  'assets/yotin-wellfi-og-2026.png',
]) {
  requireText(index, fragment, 'Public-home index');
}

for (const forbidden of [
  'noindex,nofollow,noarchive',
  'https://yotinenergy.com/field-review/',
  '<link rel="manifest" href="manifest.json">',
]) {
  if (index.includes(forbidden)) {
    throw new Error('Public-home index retained a Field Review contract: ' + forbidden);
  }
}

for (const path of [
  'main.dart.wasm',
  'flutter_bootstrap.js',
  'canvaskit/skwasm.wasm',
  'assets/yotin-icon.png',
  'assets/yotin-wellfi-og-2026.png',
  'robots.txt',
  'sitemap.xml',
]) {
  requireFile(path);
}

forbidFile('field_review_service_worker.js');
forbidFile('manifest.json');

const robots = readFileSync(requireFile('robots.txt'), 'utf8');
requireText(robots, 'Allow: /', 'Public-home robots');
requireText(robots, 'Disallow: /s/', 'Public-home robots');
requireText(robots, 'Sitemap: https://yotinenergy.com/sitemap.xml', 'Public-home robots');

const sitemap = readFileSync(requireFile('sitemap.xml'), 'utf8');
requireText(sitemap, '<loc>https://yotinenergy.com/</loc>', 'Public-home sitemap');

console.log('Public-home candidate verified: ' + outputPath);
