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
  }));
  await browser.close();
  const worldRequests = requests.filter((u) => WORLD_RE.test(u));
  const worldPreloads = dom.preloads.filter((h) => WORLD_RE.test(h));
  const problems = [];
  if (!dom.stillsOn) problems.push('html.stills-on not set' + (dom.worldOn ? ' (html.world-on is set)' : ''));
  if (worldRequests.length) problems.push(`world bucket requested: ${worldRequests.join(', ')}`);
  if (worldPreloads.length) problems.push(`modulepreload for world bucket in DOM: ${worldPreloads.join(', ')}`);
  console.log(`\n[${label}] ${problems.length ? 'FAIL' : 'PASS'} — ${requests.length} requests, ${dom.preloads.length} modulepreload link(s), stills-on=${dom.stillsOn}, world-on=${dom.worldOn}, tier=${dom.reason}, canvases=${dom.canvases}`);
  for (const p of problems) console.log('  - ' + p);
  if (errors.length) console.log('  page errors: ' + errors.join(' | '));
  return problems.length === 0;
}

const ok1 = await pass('prefers-reduced-motion: reduce', { launchArgs: GL_ARGS, contextOptions: { reducedMotion: 'reduce' } });
const ok2 = await pass('no WebGL (--disable-webgl --disable-webgl2)', { launchArgs: ['--disable-webgl', '--disable-webgl2', '--disable-gpu'], contextOptions: { reducedMotion: 'no-preference' } });

console.log('\nrm-smoke: ' + (ok1 && ok2 ? 'PASS' : 'FAIL') + '\n');
process.exit(ok1 && ok2 ? 0 : 1);
