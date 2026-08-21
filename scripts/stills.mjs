// Reduced-motion stills (spec §6, §7): capture the world at each of the seven chapter anchors from a running dev
// server and encode WebP under the caps (ch0 = the chapter-0 poster ≤ 60 KB; ch1–6 ≤ 22 KB each), min width 1600.
//
//   npx vite --port 5175 --strictPort            (background)
//   node scripts/stills.mjs --url http://localhost:5175/?world=1 [--w 1600 --h 900] [--out public/assets/stills] [--keep-png]
//
// The DOM is hidden with html.stills-capture (src/styles/stills.css) — visibility, not display, so the conductor's
// anchors keep their document positions — and only the canvas region is screenshotted.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true] : []).filter(Boolean));
const url = args.url || 'http://localhost:5174/?world=1';
const out = args.out || 'public/assets/stills';
const W = Number(args.w || 1600), H = Number(args.h || 900);
const MIN_W = 1600;
const CAPS = [60, 22, 22, 22, 22, 22, 22].map((kb) => kb * 1024);
const SETTLE = Number(args.settle || 900);
if (W < MIN_W) { console.error(`--w must be ≥ ${MIN_W}`); process.exit(2); }
fs.mkdirSync(out, { recursive: true });

let sharp = null;
try { sharp = (await import('sharp')).default; } catch (e) { console.warn('sharp not installed (npm i -D sharp) — leaving PNGs only'); }

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
const worldOn = await page.evaluate(() => document.documentElement.classList.contains('world-on'));
if (!worldOn) { console.error('world is not on at ' + url + ' — use ?world=1 and a WebGL-capable Chromium'); await browser.close(); process.exit(1); }
await page.waitForFunction(() => document.documentElement.classList.contains('world-live'), null, { timeout: 60000 });
// Let the reveal fade and any pending textures settle before the first capture.
await page.waitForTimeout(1200);

// A dev server may full-reload the page mid-run (HMR while files change): re-wait for the world before each
// chapter and re-read the anchors, which move with the DOM.
async function ensureLive() {
  await page.waitForFunction(() => window.__yotinWorld && document.documentElement.classList.contains('world-live'), null, { timeout: 60000 });
  const a = await page.evaluate(() => window.__yotinWorld.conductor.anchors);
  if (a.length !== 7) throw new Error(`expected 7 chapter anchors, got ${a.length}`);
  return a;
}
let anchors = await ensureLive();

// Freeze world time at one canonical phase for every capture (round 13): with the clock running, the
// ambient cycle / wind / field phase drifted seconds between runs and across the seven captures, and the
// ch3 webp — which rides its 22 KB cap at q20 — flipped over/under the cap depending on the phase it
// happened to catch. Paused, the world still re-renders on demand (scroll/jumpTo), so poses are unaffected;
// the stills just all share the boot-time phase and encode to repeatable bytes.
await page.evaluate(() => window.__yotinWorld.pause());

const report = { url, viewport: [W, H], stills: [], logs };
for (let i = 0; i < anchors.length; i++) {
  anchors = await ensureLive();
  await page.evaluate(() => document.documentElement.classList.remove('stills-capture'));
  await page.evaluate((y) => { window.scrollTo({ top: y, behavior: 'instant' }); window.__yotinWorld.conductor.jumpTo(); window.__yotinWorld.requestRender(); }, anchors[i]);
  await page.waitForTimeout(SETTLE);
  await page.evaluate(() => { document.documentElement.classList.add('stills-capture'); window.__yotinWorld.requestRender(); });
  await page.waitForTimeout(120);
  const box = await page.evaluate(() => { const r = document.querySelector('#world canvas').getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; });
  const png = path.join(out, `ch${i}.png`);
  // The last chapter renders the most and the software renderer is slow: the default 30 s screenshot timeout was
  // silently leaving ch6 stale (the colour gate caught it — round 5).
  await page.screenshot({ path: png, clip: box, omitBackground: false, timeout: 120000, animations: 'allow' });
  const info = await page.evaluate(() => { const w = window.__yotinWorld; return { chapter: document.documentElement.dataset.chapter, exact: w.state.exact, smooth: w.state.smooth }; });
  const entry = { i, y: anchors[i], png, ...info };
  if (sharp) {
    const webp = path.join(out, `ch${i}.webp`);
    const res = await encodeUnderCap(png, webp, CAPS[i]);
    Object.assign(entry, res);
    if (!args['keep-png']) fs.unlinkSync(png);
  }
  report.stills.push(entry);
}
await page.evaluate(() => document.documentElement.classList.remove('stills-capture'));
await browser.close();
console.log(JSON.stringify(report, null, 1));
const over = report.stills.filter((s) => s.bytes && s.bytes > CAPS[s.i]);
if (over.length) { console.error('over cap: ' + over.map((s) => `ch${s.i} ${s.bytes}B`).join(', ')); process.exit(1); }

// Quality search: start at q=80 and step down until the encoded WebP fits the cap; never below MIN_W wide.
async function encodeUnderCap(pngPath, webpPath, cap) {
  const src = sharp(pngPath);
  const meta = await src.metadata();
  const width = Math.max(MIN_W, Math.min(meta.width, W));
  let q = 80, buf = null, bytes = Infinity, tried = [];
  for (; q >= 20; q -= 5) {
    buf = await sharp(pngPath).resize({ width, withoutEnlargement: true }).webp({ quality: q, effort: 6, smartSubsample: true }).toBuffer();
    bytes = buf.length; tried.push([q, bytes]);
    if (bytes <= cap) break;
  }
  fs.writeFileSync(webpPath, buf);
  return { webp: webpPath, quality: q < 20 ? 20 : q, bytes, cap, width, tried };
}
