// Scroll-length gate (spec §6, accepted 2026-08-19 after round 1): the DOM is the site and stays complete, so
// the caps are the measured figures plus ~0.3 viewport of headroom — 10.7 at 1440×900, 11.9 at 1366×768, 14.7 at
// 390×844 (re-measured after rounds 2–3: 60 vh rise band per spec, fit chapter single column) — asserted so the
// length cannot drift further. Pass --strict to exit non-zero on FAIL.
//
//   npx vite --port 5176 --strictPort &
//   node scripts/scroll-length.mjs [--url http://localhost:5176/?world=1] [--strict]
import { chromium } from 'playwright';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true] : []).filter(Boolean));
const url = typeof args.url === 'string' ? args.url : 'http://localhost:5174/?world=1';
const strict = Boolean(args.strict);

// `cap: null` measures and reports without asserting — for a geometry we have only just started watching.
const VIEWPORTS = [
  { w: 1440, h: 900, cap: 10.7, label: 'desktop' },
  { w: 1366, h: 768, cap: 11.9, label: 'desktop' },
  { w: 390, h: 844, cap: 14.7, label: 'phone' },
  // Round 16: the tall phone (iPhone 17 Pro Max class, logical 440 × 956) joined the capture matrix after Kyle's
  // first real-device audit. The ratio here is comfortably under the 390 × 844 cap — the document is a little
  // shorter and the viewport a lot taller — but the number is REPORTED, not asserted: a cap is a promise about
  // a geometry we have measured across several rounds, and this one has been watched for exactly one.
  { w: 440, h: 956, cap: null, label: 'phone (tall)' },
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
  const pass = v.cap == null ? true : ratio <= v.cap;
  if (!pass) failed += 1;
  rows.push({ viewport: `${v.w}x${v.h}`, label: v.label, path: live ? 'world' : (worldOn ? 'world (not live)' : 'stills'), scrollHeight: m.sh, innerHeight: m.ih, ratio: Number(ratio.toFixed(2)), cap: v.cap == null ? '—' : v.cap, result: v.cap == null ? 'report' : (pass ? 'PASS' : 'FAIL') });
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
