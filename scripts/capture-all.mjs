// Capture the full frame set for a review round: chapters at 1440x900, 1366x768, 390x844 (world), plus the
// reduced-motion stills path at 1440x900, and write scratch/frames/report.json (renderer.info, console logs,
// scroll ratios per viewport). Usage: node scripts/capture-all.mjs --url http://localhost:5174
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true] : []).filter(Boolean));
const base = (args.url || 'http://localhost:5174').replace(/\/$/, '');
const out = args.out || 'scratch/frames';
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (f.endsWith('.png') || f.endsWith('.json')) fs.unlinkSync(path.join(out, f));

const report = { generatedAt: new Date().toISOString(), viewports: {} };
function run(extra, key) {
  const r = spawnSync(process.execPath, ['scripts/frames.mjs', '--url', `${base}/?world=1`, '--out', out, ...extra], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const text = r.stdout || '';
  const start = text.indexOf('{');
  try { report.viewports[key] = JSON.parse(text.slice(start)); } catch (e) { report.viewports[key] = { error: 'parse', stderr: (r.stderr || '').slice(0, 2000) }; }
}
run(['--w', '1440', '--h', '900'], '1440x900');
run(['--w', '1366', '--h', '768'], '1366x768');
run(['--w', '390', '--h', '844'], '390x844');
// Round 16: a TALL phone pass. Kyle's first real-device audit (iPhone 17 Pro Max, logical 440 × 956) found a
// world-vs-copy phase error in the tool chapter that fifteen rounds of 390 × 844 capture never showed — not
// because 390 × 844 is immune (it has the same bug) but because this harness only ever shoots chapter ANCHORS,
// and the failure lives mid-chapter. The geometry pass is cheap insurance against band heights and poses that
// were composed for one phone aspect; scratch/mobile-phase.mjs is the companion that walks the scroll STATIONS
// inside chapter 2 and is the one that actually catches phase.
run(['--w', '440', '--h', '956'], '440x956');
// reduced-motion stills path (no ?world): one frame per chapter anchor (rm-0 .. rm-6)
{
  const r = spawnSync(process.execPath, ['-e', `
    import('playwright').then(async ({ chromium }) => {
      const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
      const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
      const p = await ctx.newPage();
      const logs = []; p.on('console', m => { if (m.type()==='error') logs.push(m.text()); }); p.on('pageerror', e => logs.push('pageerror '+e.message));
      await p.goto('${base}/', { waitUntil: 'load', timeout: 60000 });
      await p.waitForTimeout(1200);
      // One frame per CHAPTER, not four evenly-spaced scroll positions: rm-0..rm-3 covered only the first half
      // of the page, so the stills path for chapters 4 (device figure), 5 (windbreak) and 6 (qualifier) went
      // unreviewed for a whole round. Same names, extended to the full seven.
      const SECTIONS = ['.hero', '[data-chapter=descent]', '[data-chapter=tool]', '[data-chapter=signal]', '#insight', '#company', '#contact'];
      const missing = [];
      for (let i = 0; i < SECTIONS.length; i++) {
        const ok = await p.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return false;
          const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
          window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - header - 8), behavior: 'instant' });
          return true;
        }, SECTIONS[i]);
        if (!ok) { missing.push(SECTIONS[i]); continue; }
        await p.waitForTimeout(700);
        await p.screenshot({ path: '${out.replace(/\\\\/g, '/')}/rm-' + i + '-1440x900.png' });
      }
      console.log(JSON.stringify({ stillsOn: await p.evaluate(() => document.documentElement.classList.contains('stills-on')), logs, missing, rmFrames: 7 - missing.length, ratio: await p.evaluate(() => document.documentElement.scrollHeight / innerHeight) }));
      await b.close();
    });
  `], { encoding: 'utf8' });
  try { report.viewports['reduced-motion-1440x900'] = JSON.parse((r.stdout || '').trim().split('\n').pop()); } catch (e) { report.viewports['reduced-motion-1440x900'] = { error: (r.stderr || '').slice(0, 1000) }; }
}
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1));
const summary = Object.entries(report.viewports).map(([k, v]) => `${k}: ratio ${v.scrollRatio ? v.scrollRatio.toFixed(2) : v.ratio ? v.ratio.toFixed(2) : '?'} · logs ${(v.logs || []).length}${v.frames ? ' · frames ' + v.frames.length : ''}`);
console.log(summary.join('\n'));
