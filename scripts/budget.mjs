// Resource budget (spec §6). Reads dist/asset-manifest.json (written by the Vite plugin in
// scripts/manifest.mjs), prints every asset / bucket / raw / gzip, per-bucket totals vs caps, the
// reduced-motion arithmetic, and exits non-zero on any cap breach.
//
//   npm run build && node scripts/budget.mjs [dist/asset-manifest.json] [--strict]
//
// Known debts (spec §10: "icon re-encoded · OG PNG re-encoded"; the ch-0 poster is replaced by the
// ≤ 60 KB chapter-0 still in Gate 2) are reported as WARN, not FAIL, until they are cleared;
// --strict promotes every WARN to FAIL.
import fs from 'node:fs';
import path from 'node:path';

const KB = 1024;
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const manifestPath = path.resolve(args.find((a) => !a.startsWith('--')) || 'dist/asset-manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error(`budget: ${manifestPath} not found — run "npm run build" first`);
  process.exit(2);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const assets = manifest.assets;

// ---- caps (gzip bytes) --------------------------------------------------------------------------
const CAPS = {
  critical: 290 * KB,
  criticalHtml: 45 * KB,
  criticalCss: 22 * KB,
  criticalFonts: 110 * KB,
  posterOrCh0Still: 60 * KB,   // per URL (spec: one URL — poster = ch-0 still)
  wordmark: 23 * KB,
  icon: 8 * KB,
  ui: 60 * KB,
  world: 215 * KB, // measured 2026-08-19: three (tree-shaken, shadows+sprites+instancing+PMREM) ≈ 165 KB + 15 world modules ≈ 45 KB — see spec §6
  stillEach: 22 * KB,
  rmFirstPaint: 127 * KB,      // html + css + ch0 still
  rmFirstPaintAllIn: 330 * KB, // + fonts + wordmark + icon + ui
  rmFullScroll: 259 * KB,      // first paint + 6 stills
  rmFullScrollAllIn: 470 * KB,
};

// Debts allowed to WARN instead of FAIL (cleared as the spec §10 debt list is worked off).
const KNOWN_DEBT = [
  { match: (a) => a.url === '/assets/yotin-icon.png', note: 'icon re-encode pending (spec §10)' },
  { match: (a) => a.url === '/assets/yotin-wellfi-og-2026.png', note: 'OG PNG re-encode pending (spec §10)' },
  { match: (a) => a.url === '/assets/wellfi-island-r3f-poster.webp', note: 'poster to be replaced by the <= 60 KB chapter-0 still (Gate 2)' },
];

const sum = (list) => list.reduce((n, a) => n + a.gzipBytes, 0);
const by = (pred) => assets.filter(pred);
const isFont = (a) => a.kind === 'font';
const isPosterOrCh0 = (a) => a.url === '/assets/wellfi-island-r3f-poster.webp' || /^\/assets\/stills\/ch0\./.test(a.url);
const isWordmark = (a) => a.url === '/assets/wellfi-logo.webp';
const isIcon = (a) => a.url === '/assets/yotin-icon.png';

const critical = by((a) => a.bucket === 'critical');
const ui = by((a) => a.bucket === 'ui');
const world = by((a) => a.bucket === 'world');
const stills = by((a) => a.bucket === 'still');
const lazy = by((a) => a.bucket === 'lazy');

const html = sum(critical.filter((a) => a.kind === 'html'));
const css = sum(critical.filter((a) => a.kind === 'css'));
const fonts = sum(critical.filter(isFont));
const wordmark = sum(critical.filter(isWordmark));
const icon = sum(critical.filter(isIcon));
const posterAssets = critical.filter(isPosterOrCh0);
// Chapter-0 still for the reduced-motion arithmetic: the /assets/stills/ch0.* URL when it exists, else today's poster.
const ch0 = posterAssets.find((a) => /\/stills\/ch0\./.test(a.url)) || posterAssets.find((a) => /poster/.test(a.url));
const ch0Bytes = ch0 ? ch0.gzipBytes : 0;
const stillsBytes = sum(stills);

// ---- report -------------------------------------------------------------------------------------
const kb = (n) => (n / KB).toFixed(1).padStart(8) + ' KB';
const pad = (s, n) => String(s).padEnd(n);
const rows = [];
const fails = [];
const warns = [];
function check(label, value, cap, { asset = null } = {}) {
  const ok = value <= cap;
  let status = ok ? 'PASS' : 'FAIL';
  let note = '';
  if (!ok && asset) {
    const debt = KNOWN_DEBT.find((d) => d.match(asset));
    if (debt && !strict) { status = 'WARN'; note = debt.note; }
  }
  rows.push({ label, value, cap, status, note });
  if (status === 'FAIL') fails.push(`${label}: ${(value / KB).toFixed(1)} KB > ${(cap / KB).toFixed(1)} KB${note ? ' — ' + note : ''}`);
  if (status === 'WARN') warns.push(`${label}: ${(value / KB).toFixed(1)} KB > ${(cap / KB).toFixed(1)} KB — ${note}`);
  return ok;
}

console.log(`\nResource budget — ${path.relative(process.cwd(), manifestPath)} (${assets.length} assets, gzip = ${manifest.gzip})\n`);
console.log(pad('bucket', 9) + pad('kind', 7) + pad('raw', 12) + pad('gzip', 12) + 'asset');
console.log('-'.repeat(96));
for (const a of [...critical, ...ui, ...world, ...stills, ...lazy]) {
  console.log(pad(a.bucket, 9) + pad(a.kind, 7) + kb(a.bytes) + ' ' + kb(a.gzipBytes) + '  ' + a.url);
}
console.log('-'.repeat(96));

// Bucket caps
check('critical total', sum(critical), CAPS.critical);
check('critical · html', html, CAPS.criticalHtml);
check('critical · css', css, CAPS.criticalCss);
check('critical · fonts', fonts, CAPS.criticalFonts);
for (const a of posterAssets) check(`critical · poster/ch0 still ${a.url}`, a.gzipBytes, CAPS.posterOrCh0Still, { asset: a });
if (posterAssets.length > 1) warns.push(`poster/ch0: ${posterAssets.length} URLs (${posterAssets.map((a) => a.url).join(', ')}) — spec wants one URL`);
for (const a of critical.filter(isWordmark)) check('critical · wordmark', a.gzipBytes, CAPS.wordmark, { asset: a });
for (const a of critical.filter(isIcon)) check('critical · icon', a.gzipBytes, CAPS.icon, { asset: a });
check('ui total', sum(ui), CAPS.ui);
check('world total (three + world/field/conductor, one chunk)', sum(world), CAPS.world);
if (world.length !== 1) fails.push(`world bucket must be exactly one chunk, found ${world.length}: ${world.map((a) => a.url).join(', ') || '(none)'}`);
for (const a of stills) check(`still ${a.url}`, a.gzipBytes, CAPS.stillEach, { asset: a });
if (stills.length && stills.length !== 6) warns.push(`still bucket has ${stills.length} URLs, expected 6 (ch1..6)`);
if (!stills.length) warns.push('still bucket empty — chapter stills not built yet (scripts/stills.mjs)');
// Lazy: known debts only warn
for (const a of lazy) { const debt = KNOWN_DEBT.find((d) => d.match(a)); if (debt) warns.push(`lazy ${a.url}: ${(a.gzipBytes / KB).toFixed(1)} KB — ${debt.note}`); }

// Reduced-motion arithmetic
const rmFirst = html + css + ch0Bytes;
const rmFirstAllIn = rmFirst + fonts + wordmark + icon + sum(ui);
const rmFull = rmFirst + stillsBytes;
const rmFullAllIn = rmFirstAllIn + stillsBytes;
check('reduced-motion first paint (html + css + ch0 still)', rmFirst, CAPS.rmFirstPaint);
check('reduced-motion first paint all-in (+ fonts + wordmark + icon + ui)', rmFirstAllIn, CAPS.rmFirstPaintAllIn);
check('reduced-motion full scroll (first paint + 6 stills)', rmFull, CAPS.rmFullScroll);
check('reduced-motion full scroll all-in', rmFullAllIn, CAPS.rmFullScrollAllIn);

console.log('\n' + pad('status', 7) + pad('gzip', 12) + pad('cap', 12) + 'gate');
console.log('-'.repeat(96));
for (const r of rows) console.log(pad(r.status, 7) + kb(r.value) + ' ' + kb(r.cap) + '  ' + r.label + (r.note ? '  [' + r.note + ']' : ''));
console.log('-'.repeat(96));
console.log(`totals (gzip): critical ${(sum(critical) / KB).toFixed(1)} · ui ${(sum(ui) / KB).toFixed(1)} · world ${(sum(world) / KB).toFixed(1)} · still ${(stillsBytes / KB).toFixed(1)} · lazy ${(sum(lazy) / KB).toFixed(1)} KB`);
console.log(`reduced-motion: first paint ${(rmFirst / KB).toFixed(1)} / ${CAPS.rmFirstPaint / KB} KB (all-in ${(rmFirstAllIn / KB).toFixed(1)} / ${CAPS.rmFirstPaintAllIn / KB}) · full scroll ${(rmFull / KB).toFixed(1)} / ${CAPS.rmFullScroll / KB} KB (all-in ${(rmFullAllIn / KB).toFixed(1)} / ${CAPS.rmFullScrollAllIn / KB})`);
if (ch0 && !/\/stills\/ch0\./.test(ch0.url)) console.log('note: chapter-0 still not built yet — arithmetic uses the poster as the ch0 still');
if (warns.length) { console.log('\nWARN (known debt, not failing' + (strict ? '' : '; --strict to fail') + '):'); for (const w of warns) console.log('  - ' + w); }
if (fails.length) { console.log('\nFAIL:'); for (const f of fails) console.log('  - ' + f); console.log(''); process.exit(1); }
console.log('\nbudget: PASS' + (warns.length ? ` (${warns.length} warn)` : '') + '\n');
