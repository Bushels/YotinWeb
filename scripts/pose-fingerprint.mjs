// A fingerprint of everything in src/chapters.js that can move a DESKTOP still.
//
// scripts/colour-gate.mjs has always flagged a still that is older than src/chapters.js — a good tripwire (round
// 2 shipped a stale ch6 still with a lit cyan candle) with one false-positive mode, which round 16 walked into:
// the mobile phase fix (the chapter-2 pose/light hold, reached only when innerWidth ≤ 820) cannot change a still
// by a single pixel, because scripts/stills.mjs shoots at 1600 × 900 where those branches are dead — yet the
// mtime tripwire demanded a rewrite of seven public WebP assets at their immutable URLs for a provably identical
// render.
//
// So the gate compares CONTENT, not clocks. This hashes the desktop pose endpoints and the desktop pose/world
// curves sampled every 0.001 of a chapter across the whole scroll; `mobile` sub-poses and the mobile branches
// are deliberately excluded, since no still can see them. Any real change to a desktop pose, a chapter channel
// value, poseProgress or the chapter-3 light curve moves the hash and the STALE flag comes back. If the
// fingerprint file is missing or unreadable the gate falls back to the mtime rule, so the tripwire can only ever
// be as weak as it was before.
import crypto from 'node:crypto';
import { POSES, CHAPTERS, poseProgress, worldAt } from '../src/chapters.js';

export const FINGERPRINT_FILE = 'scripts/stills-pose.fingerprint';

export function poseFingerprint() {
  const parts = [];
  for (const p of POSES) parts.push(p.id, ...p.position, ...p.target, p.fov ?? 30); // desktop endpoints only — p.mobile is excluded on purpose
  for (const c of CHAPTERS) { parts.push(c.id, c.section, c.dwell); for (const k of Object.keys(c.world).sort()) parts.push(k, c.world[k]); }
  for (let i = 0; i <= 6000; i++) {
    const p = i / 1000;
    parts.push(poseProgress(p).toFixed(6));
    const w = worldAt(p);
    for (const k of Object.keys(w).sort()) parts.push(k, w[k].toFixed(6));
  }
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 16);
}
