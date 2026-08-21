// Colour-budget gate for the STILLS (spec §6: "stills reviewed in the same job"; round 2: a stale ch6 still shipped
// a lit cyan candle before any verdict). Saturated cyan above the 25 % luminance gate is allowed only in the
// chapter-3 still; every other still must carry (near) none, and ch3 must carry some. Also warns when a still is
// older than src/chapters.js (poses changed → regenerate with scripts/stills.mjs).
//
//   node scripts/colour-gate.mjs [--dir public/assets/stills] [--strict]
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { poseFingerprint, FINGERPRINT_FILE } from './pose-fingerprint.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true] : []).filter(Boolean));
const dir = args.dir || 'public/assets/stills';
const strict = Boolean(args.strict);
const chaptersMtime = fs.statSync('src/chapters.js').mtimeMs;

// Staleness: prefer the CONTENT fingerprint (see scripts/pose-fingerprint.mjs) over the mtime clock, so a
// mobile-only edit — which no still can render — does not demand a rewrite of seven immutable public assets.
// Missing or mismatched fingerprint ⇒ fall back to the original mtime rule, so this can only be as weak as before.
let poseUnchanged = false, fpNote = 'mtime';
try {
  const want = poseFingerprint();
  if (fs.existsSync(FINGERPRINT_FILE)) {
    const have = fs.readFileSync(FINGERPRINT_FILE, 'utf8').trim();
    poseUnchanged = have === want;
    fpNote = poseUnchanged ? `pose fingerprint ${want} matches` : `pose fingerprint CHANGED (${have} → ${want})`;
  } else fpNote = `no ${FINGERPRINT_FILE} — falling back to mtime`;
} catch (e) { fpNote = 'fingerprint unavailable (' + e.message + ') — falling back to mtime'; }

async function cyan(file) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  let n = 0, peak = 0;
  for (let i = 0; i < info.width * info.height; i++) {
    const k = i * info.channels, r = data[k], g = data[k + 1], b = data[k + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (!mx) continue;
    const sat = (mx - mn) / mx, L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    if (sat > 0.45 && b > r * 1.6 && g > r * 1.5 && L > 0.25) { n++; if (L > peak) peak = L; }
  }
  return { n, peak, px: info.width * info.height };
}

let fail = 0;
for (let i = 0; i <= 6; i++) {
  const file = path.join(dir, `ch${i}.webp`);
  if (!fs.existsSync(file)) { console.log(`ch${i}: MISSING`); fail++; continue; }
  const stale = !poseUnchanged && fs.statSync(file).mtimeMs < chaptersMtime;
  const c = await cyan(file);
  const share = c.n / c.px;
  const ok = i === 3 ? c.n > 50 : share < 0.0004; // ≤ 0.04 % of the still's pixels outside ch3 (anti-aliasing slack)
  console.log(`ch${i}: cyan px ${c.n} (${(share * 100).toFixed(3)} %), peak L ${c.peak.toFixed(2)} — ${ok ? 'ok' : 'FAIL'}${stale ? ' — STALE (older than src/chapters.js: regenerate)' : ''}`);
  if (!ok || stale) fail++;
}
console.log(`staleness: ${fpNote}`);
console.log(fail ? `colour-gate: ${fail} problem(s)${strict ? ' — FAIL' : ' (report-only; --strict to fail)'}` : 'colour-gate: PASS');
if (strict && fail) process.exit(1);
