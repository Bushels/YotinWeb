// Frame capture for the world (spec §6, §11): screenshots each chapter anchor at a given viewport, reports
// renderer.info, console errors, scroll length ratio, and (with --stills) writes the reduced-motion stills.
//   node scripts/frames.mjs --url http://localhost:5174/?world=1 --out scratch/frames --w 1440 --h 900
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true] : []).filter(Boolean));
const url = args.url || 'http://localhost:5174/?world=1';
const out = args.out || 'scratch/frames';
const W = Number(args.w || 1440), H = Number(args.h || 900);
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, reducedMotion: args.reduced ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
const worldOn = await page.evaluate(() => document.documentElement.classList.contains('world-on'));
const report = { url, viewport: [W, H], worldOn, frames: [], logs };
if (worldOn) {
  await page.waitForFunction(() => document.documentElement.classList.contains('world-live'), null, { timeout: 45000 });
  const anchors = await page.evaluate(() => window.__yotinWorld.conductor.anchors);
  const ids = await page.evaluate(() => window.__yotinWorld.conductor.getState().anchors.map((_, i) => i));
  for (let i = 0; i < anchors.length; i++) {
    await page.evaluate((y) => { window.scrollTo({ top: y, behavior: 'instant' }); window.__yotinWorld.conductor.jumpTo(); }, anchors[i]);
    await page.waitForTimeout(args.settle ? Number(args.settle) : 900);
    const info = await page.evaluate(() => { const w = window.__yotinWorld; const r = w.renderer.info.render; return { calls: r.calls, tris: r.triangles, chapter: document.documentElement.dataset.chapter, exact: w.state.exact, smooth: w.state.smooth }; });
    const file = path.join(out, `ch${i}-${W}x${H}.png`);
    await page.screenshot({ path: file });
    report.frames.push({ i, y: anchors[i], file, ...info });
  }
} else {
  await page.screenshot({ path: path.join(out, `stills-${W}x${H}.png`) });
}
report.scrollRatio = await page.evaluate(() => document.documentElement.scrollHeight / window.innerHeight);
report.tier = await page.evaluate(() => document.documentElement.dataset.worldTier);
if (!args.quiet) console.log(JSON.stringify(report, null, 1));
await browser.close();

// Runtime budget (spec §6, re-baselined 2026-08-19 after round 1 with the shadow pass counted): renderer.info at
// every chapter anchor. Desktop (tier 3, shadows) ≤ 80 calls / 130 k tris; phone (tier 1) ≤ 56 calls / 62 k tris.
// `--strict` fails the process; otherwise it reports. npm run check:runtime runs both viewports strict.
if (worldOn) {
  const phone = W <= 820;
  const CAP = phone ? { calls: 56, tris: 62000 } : { calls: 80, tris: 130000 };
  const over = report.frames.filter((f) => f.calls > CAP.calls || f.tris > CAP.tris);
  const peak = report.frames.reduce((m, f) => ({ calls: Math.max(m.calls, f.calls), tris: Math.max(m.tris, f.tris) }), { calls: 0, tris: 0 });
  console.error(`runtime ${W}x${H} tier ${report.tier}: peak ${peak.calls} calls / ${peak.tris} tris (cap ${CAP.calls} / ${CAP.tris}) — ${over.length ? 'OVER at ch ' + over.map((f) => f.i).join(',') : 'within cap'}`);
  if (args.strict && over.length) process.exit(1);
}
