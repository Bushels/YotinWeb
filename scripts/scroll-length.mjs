// Scroll-length gate (spec §6, accepted 2026-08-19 after round 1): the DOM is the site and stays complete, so
// the caps are the measured figures plus 0.5 viewport of headroom — 10.4 at 1440×900, 11.4 at 1366×768, 14.2 at
// 390×844 — asserted so the length cannot drift. Pass --strict to exit non-zero on FAIL.
//
//   npx vite --port 5176 --strictPort &
//   node scripts/scroll-length.mjs [--url http://localhost:5176/?world=1] [--strict]
import { chromium } from 'playwright';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true] : []).filter(Boolean));
const url = typeof args.url === 'string' ? args.url : 'http://localhost:5174/?world=1';
const strict = Boolean(args.strict);

const VIEWPORTS = [
  { w: 1440, h: 900, cap: 10.4, label: 'desktop' },
  { w: 1366, h: 768, cap: 11.4, label: 'desktop' },
  { w: 390, h: 844, cap: 14.2, label: 'phone' },
];

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let failed = 0;
const rows = [];
for (const v of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  const worldOn = await page.evaluate(() => document.documentElement.classList.contains('world-on'));
  if (worldOn) {
    await page.waitForFunction(() => document.documentElement.classList.contains('world-live'), null, { timeout: 45000 }).catch(() => {});
  } else {
    await page.waitForTimeout(5000);
  }
  const live = await page.evaluate(() => document.documentElement.classList.contains('world-live'));
  const m = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ih: window.innerHeight }));
  const ratio = m.sh / m.ih;
  const pass = ratio <= v.cap;
  if (!pass) failed += 1;
  rows.push({ viewport: `${v.w}x${v.h}`, label: v.label, path: live ? 'world' : (worldOn ? 'world (not live)' : 'stills'), scrollHeight: m.sh, innerHeight: m.ih, ratio: Number(ratio.toFixed(2)), cap: v.cap, result: pass ? 'PASS' : 'FAIL' });
  await ctx.close();
}
await browser.close();

console.log(`\nscroll length — ${url}\n`);
console.log('viewport    path              scrollHeight  innerHeight  ratio   cap   result');
console.log('-'.repeat(80));
for (const r of rows) console.log(`${r.viewport.padEnd(11)} ${r.path.padEnd(17)} ${String(r.scrollHeight).padStart(12)}  ${String(r.innerHeight).padStart(11)}  ${String(r.ratio).padStart(5)}  ${String(r.cap).padStart(4)}   ${r.result}`);
console.log('-'.repeat(80));
if (failed) {
  console.log(`${failed} viewport(s) over cap` + (strict ? ' — FAIL (--strict)' : ' — report-only (pass --strict to fail)'));
  if (strict) process.exit(1);
} else {
  console.log('scroll length: PASS');
}
