// Reduced-motion / no-WebGL smoke (spec §6, §7): under prefers-reduced-motion and under no-WebGL the
// page must ship the stills path (html.stills-on) and make ZERO requests for the world bucket —
// the /_app/boot*.js chunk in a build (or /src/boot.js, /src/world/*, three in dev) — and inject no
// <link rel="modulepreload"> pointing at it. Exits non-zero on any failure.
//
//   npx vite --port 5176 --strictPort &
//   node scripts/rm-smoke.mjs [--url http://localhost:5176/]
import { chromium } from 'playwright';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true] : []).filter(Boolean));
const url = typeof args.url === 'string' ? args.url : 'http://localhost:5174/';
if (/[?&]world=1/.test(url)) console.warn('rm-smoke: url carries ?world=1, which forces the world past the gate — pass the plain URL');

// World-bucket URL shapes: built chunk, dev-server source modules, three itself.
// (src/world/layout.js is a constants module shared with the rail — it lives in `ui`, so it is excluded.)
const WORLD_RE = /\/_app\/boot[^/]*\.js|\/src\/boot\.js|\/src\/world\/(?!layout\.js)|\/src\/cameraRig\.js|\/src\/conductor\.js|\/node_modules\/(?:\.vite\/deps\/)?three(?:[./]|$)/;
const GL_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

async function pass(label, { launchArgs, contextOptions }) {
  const browser = await chromium.launch({ args: launchArgs });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, ...contextOptions });
  const page = await ctx.newPage();
  const requests = [];
  page.on('request', (r) => requests.push(r.url()));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);
  const dom = await page.evaluate(() => ({
    stillsOn: document.documentElement.classList.contains('stills-on'),
    worldOn: document.documentElement.classList.contains('world-on'),
    reason: document.documentElement.dataset.worldTier,
    preloads: Array.from(document.querySelectorAll('link[rel="modulepreload"]')).map((l) => l.getAttribute('href') || ''),
    canvases: document.querySelectorAll('canvas').length,
    // the rail is part of the complete page (spec §4/§7): present, seven anchors, one aria-current
    railShown: (() => { const r = document.getElementById('rail'); return Boolean(r) && getComputedStyle(r).display !== 'none'; })(),
    railAnchors: document.querySelectorAll('#rail .rail-chapters a').length,
    railCurrent: Array.from(document.querySelectorAll('#rail .rail-chapters a[aria-current="true"]')).map((a) => a.dataset.railChapter),
    // typographic truth (round 9): mA is milliamps, MA is megaamps. The unit-casing correction used to be
    // scoped to html.world-on, so this path printed "4-20 MA" and "KPA" — case-sensitive here on purpose.
    chipOut: (document.querySelector('.readout .chip-out') || {}).textContent || '',
    readoutUnits: Array.from(document.querySelectorAll('.readout-list b')).map((b) => b.textContent).join(' | '),
  }));
  // scroll to the second chapter and confirm aria-current follows on the stills path
  await page.evaluate(() => { const el = document.querySelector('[data-chapter="descent"]'); if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - innerHeight * 0.3); });
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => Array.from(document.querySelectorAll('#rail .rail-chapters a[aria-current="true"]')).map((a) => a.dataset.railChapter));
  await browser.close();
  const worldRequests = requests.filter((u) => WORLD_RE.test(u));
  const worldPreloads = dom.preloads.filter((h) => WORLD_RE.test(h));
  const problems = [];
  if (!dom.stillsOn) problems.push('html.stills-on not set' + (dom.worldOn ? ' (html.world-on is set)' : ''));
  if (worldRequests.length) problems.push(`world bucket requested: ${worldRequests.join(', ')}`);
  if (worldPreloads.length) problems.push(`modulepreload for world bucket in DOM: ${worldPreloads.join(', ')}`);
  { // 1366×768 context: the rail is shown ≥ 1101 px
    if (!dom.railShown) problems.push('rail hidden on the stills path (spec §4: the rail exists from first paint)');
    if (dom.railAnchors !== 7) problems.push(`rail has ${dom.railAnchors} chapter anchors, expected 7`);
    if (dom.railCurrent.join() !== 'surface') problems.push(`rail aria-current at top = [${dom.railCurrent}] (expected surface)`);
    if (after.join() !== 'descent') problems.push(`rail aria-current after scrolling to descent = [${after}] (expected descent)`);
  }
  { // units keep their casing on this path too (spec §0: the instrumentation strings are the truth surface)
    if (!dom.chipOut.includes('4-20 mA')) problems.push(`output chip reads "${dom.chipOut.trim()}" (expected "4-20 mA")`);
    for (const u of ['kPa', 'mm/s RMS']) if (!dom.readoutUnits.includes(u)) problems.push(`readout units "${dom.readoutUnits}" missing "${u}"`);
  }
  console.log(`\n[${label}] ${problems.length ? 'FAIL' : 'PASS'} — ${requests.length} requests, ${dom.preloads.length} modulepreload link(s), stills-on=${dom.stillsOn}, world-on=${dom.worldOn}, tier=${dom.reason}, canvases=${dom.canvases}`);
  for (const p of problems) console.log('  - ' + p);
  if (errors.length) console.log('  page errors: ' + errors.join(' | '));
  return problems.length === 0;
}

const ok1 = await pass('prefers-reduced-motion: reduce', { launchArgs: GL_ARGS, contextOptions: { reducedMotion: 'reduce' } });
const ok2 = await pass('no WebGL (--disable-webgl --disable-webgl2)', { launchArgs: ['--disable-webgl', '--disable-webgl2', '--disable-gpu'], contextOptions: { reducedMotion: 'no-preference' } });

console.log('\nrm-smoke: ' + (ok1 && ok2 ? 'PASS' : 'FAIL') + '\n');
process.exit(ok1 && ok2 ? 0 : 1);
