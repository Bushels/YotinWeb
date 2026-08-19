// Interaction frames (spec §4/§5 acceptance, round-1 P3): drive each named interaction through its DOM twin
// (every raycast target has one), settle, and capture — so pressed/completed states can be reviewed like the
// chapter anchors. Headless SwiftShader, same flags as frames.mjs.
//
//   node scripts/interactions.mjs [--url http://localhost:5174/?world=1] [--out scratch/frames] [--w 1366 --h 768]
//
// Frames: tool-orbit, signal-closed (both references + stake), deploy-xray, deploy-pumpoff (fluid at pump-off),
// fit-strong (PCP · heavy · 100–150 °C · 1000 m · shallower · within 3 months), fit-review (rod pump · light ·
// under 100 · 1000 m · deeper · 3–12 months), fit-future (above 150 °C).
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true] : []).filter(Boolean));
const url = args.url || 'http://localhost:5174/?world=1';
const out = args.out || 'scratch/frames';
const W = Number(args.w || 1366), H = Number(args.h || 768);
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction(() => document.documentElement.classList.contains('world-live'), null, { timeout: 45000 });

const report = [];
async function gotoChapter(i) {
  await page.evaluate((k) => { const a = window.__yotinWorld.conductor.anchors; window.scrollTo({ top: a[k], behavior: 'instant' }); window.__yotinWorld.conductor.jumpTo(); }, i);
  await page.waitForTimeout(700);
}
async function shot(name, note) {
  await page.waitForTimeout(args.settle ? Number(args.settle) : 2500); // match frames.mjs: SwiftShader needs the damped conductor to converge
  const file = path.join(out, `${name}-${W}x${H}.png`);
  await page.screenshot({ path: file });
  const state = await page.evaluate(() => ({ chapter: document.documentElement.dataset.chapter, classes: document.documentElement.className }));
  report.push({ name, note, file, ...state });
  console.error(`captured ${name} (${state.chapter})`);
}
async function clickTwin(selector) {
  await page.evaluate((sel) => { const el = document.querySelector(sel); if (!el) throw new Error('twin missing: ' + sel); el.scrollIntoView({ block: 'center', behavior: 'instant' }); }, selector);
  await page.waitForTimeout(200);
  await page.click(selector);
}
async function setRange(selector, value) {
  await page.evaluate(([sel, v]) => { const el = document.querySelector(sel); if (!el) throw new Error('twin missing: ' + sel); el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, [selector, value]);
}

// 1) Tool: Inspect → contained orbit
await gotoChapter(2);
await clickTwin('[data-hotspot="inspect"]');
await shot('tool-orbit', 'Inspect tool pressed: contained orbit, inspection sleeve + rings, chips as twins');
await page.keyboard.press('Escape');

// 2) Signal: both references placed, stake moved → loop draws, digits settle
await gotoChapter(3);
await clickTwin('[data-hotspot="ref-wellhead"]');
await clickTwin('[data-hotspot="ref-ground"]');
await setRange('[data-hotspot="stake"] input[type="range"]', 72);
await shot('signal-closed', 'Close the Circuit: V₁ + V₂ placed, stake at 72 % — loop drawn, readout digits settled, logomark received');
await setRange('[data-hotspot="stake"] input[type="range"]', 2);
await shot('signal-nodiff', 'Stake back on the wellhead: "no difference, no reading" — digits dissolve');

// 3) Deployment: X-ray on; fluid at pump-off
await gotoChapter(4);
await clickTwin('[data-hotspot="xray"]');
await shot('deploy-xray', 'X-ray on: tubing ghosted, collar + sensor package read through, figure in its x-ray colour');
await clickTwin('[data-hotspot="xray"]');
await setRange('[data-hotspot="fluid-level"]', 96);
await shot('deploy-pumpoff', 'Fluid level dragged to pump-off: pump warms, line + "earlier" ghost');

// 4) Fit: run the qualifier three ways (state is normalised — no free text reaches the world)
async function runQualifier(answers, name, note) {
  await gotoChapter(6);
  // restart if a previous run left a verdict
  const restarted = await page.evaluate(() => { const b = Array.from(document.querySelectorAll('.qualifier-back')).find((x) => /start over/i.test(x.textContent)); if (b) { b.click(); return true; } return false; });
  if (restarted) await page.waitForTimeout(400);
  for (const a of answers) {
    if (typeof a === 'number') {
      await page.fill('.qualifier-input', String(a));
      await page.click('.qualifier-go');
    } else {
      const ok = await page.evaluate((label) => {
        const b = Array.from(document.querySelectorAll('.qualifier-option')).find((x) => x.textContent.trim().startsWith(label));
        if (!b) return false; b.click(); return true;
      }, a);
      if (!ok) throw new Error('qualifier option not found: ' + a);
    }
    await page.waitForTimeout(350);
  }
  // The verdict card is much taller than the question card, so answering moves the chapter anchor out from under
  // the camera. Re-seat the chapter so every verdict frame is captured at the same authored pose.
  await gotoChapter(6);
  await shot(name, note);
}
await runQualifier(['Progressing cavity pump', 'Heavy oil', '100 – 150', 1000, 'Shallower', 'Within 3 months'], 'fit-strong', 'Verdict strong: candle lights at the proposed placement, schematic state applied');
await runQualifier(['Rod pump', 'Light oil', 'Under 100', 1000, 'Deeper', '3 – 12 months'], 'fit-review', 'Verdict review: likely fit, collar outside the intermediate');
await runQualifier(['Electric submersible', 'Heavy oil', 'Above 150', 1000, 'Shallower', 'Within 3 months'], 'fit-future', 'Verdict future (above 150 °C): tool dims, waitlist copy');

fs.writeFileSync(path.join(out, `interactions-${W}x${H}.json`), JSON.stringify({ url, viewport: [W, H], frames: report, logs }, null, 1));
console.log(JSON.stringify({ frames: report.map((r) => r.name), logs }, null, 1));
await browser.close();
