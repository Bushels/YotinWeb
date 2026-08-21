/**
 * Mobile phase (spec §4 "Mobile phase rule", round 16 — Kyle's first real-device audit on an iPhone 17 Pro Max:
 * "you scroll past some parts of say the Flow insight at the tool to Inspect the tool and you cannot see the
 * tool").
 *
 * The tool chapter is one screen of copy on a laptop and two and a quarter on a phone, so spreading the 2 → 3
 * pose interpolation across the whole DOM span put the phone camera 56–60 % of the way to the NEXT chapter's
 * wide shot by the time the visitor reached this chapter's one invited action. These tests lock the two halves
 * of the fix and, just as importantly, lock the promise that desktop did not move.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { poseProgress, worldAt, chapter2Light, POSES } from '../src/chapters.js';

// The stations, measured across 390×844, 430×932, 440×956, 440×758 and 440×855 (scratch/mobile-phase.mjs).
const CH05_CENTRED = 0.39;   // the "Flow Insight" card centred — the card Kyle named
const INSPECT_CENTRED = 0.60; // the Inspect control centred — the chapter's one invited action
const SPECS_ARRIVE = 0.755;   // the spec grid arriving — copy that no longer refers to the tool

test('mobile tool chapter — the camera holds the tool while the tool is being discussed', () => {
  for (const l of [0, 0.1, CH05_CENTRED, INSPECT_CENTRED, 0.7]) {
    assert.equal(poseProgress(2 + l, true), 2,
      `the mobile pose must still be the tool pose at chapter-2 local ${l}`);
  }
  // and it must have let go by the time the spec tiles are being read, or the chapter never reaches chapter 3
  assert.ok(poseProgress(2 + SPECS_ARRIVE, true) > 2,
    'the mobile pose must be moving once the spec grid arrives');
});

test('mobile tool chapter — the key holds with the pose (a held camera on a fading light is still a black frame)', () => {
  const anchor = worldAt(2, true).light;
  assert.ok(Math.abs(anchor - 0.24) < 1e-9, 'the anchor keeps the ledger value the mobile pose was authored against');
  for (const l of [CH05_CENTRED, INSPECT_CENTRED, 0.7]) {
    assert.ok(Math.abs(worldAt(2 + l, true).light - 0.24) < 1e-9,
      `the mobile light must not have faded at chapter-2 local ${l}`);
  }
  // Before the fix these were 0.166 / 0.114 / 0.081 — 1.4×, 2.1× and 3× darker than the authored frame.
  assert.ok(worldAt(2.9, true).light < 0.24, 'and it must fall away before chapter 3');
});

test('the one-candle contract survives: chapter 3 still opens on the ledger darkness', () => {
  assert.ok(Math.abs(chapter2Light(1) - 0.03) < 1e-9, 'chapter 2 hands over at chapter 3 own value');
  assert.ok(Math.abs(worldAt(3, true).light - worldAt(3).light) < 1e-9, 'and the handover is viewport-independent');
});

test('the mobile chapter-2 curve is continuous and monotonic at both seams', () => {
  assert.equal(poseProgress(2, true), 2);
  assert.ok(Math.abs(poseProgress(3 - 1e-9, true) - 3) < 1e-6, 'arrives exactly on pose 3');
  assert.equal(poseProgress(3, true), 3);
  let prev = -Infinity;
  for (let p = 0; p <= 6; p += 0.001) {
    const v = poseProgress(Math.min(6, p), true);
    assert.ok(v >= prev - 1e-9, `mobile poseProgress is not monotonic at p = ${p.toFixed(3)}`);
    assert.ok(v >= 0 && v <= POSES.length - 1, `mobile poseProgress(${p.toFixed(3)}) = ${v} out of range`);
    prev = v;
  }
});

test('DESKTOP IS UNTOUCHED — the mobile fix is invisible to every desktop frame and every still', () => {
  // scripts/stills.mjs shoots at 1600×900 and frames.mjs at 1440×900 / 1366×768, all of which call these
  // functions with the default `mobile = false`. If this test ever fails, the seven public WebP stills and the
  // scripts/stills-pose.fingerprint that vouches for them are stale and must be regenerated.
  for (let p = 0; p <= 6.0001; p += 0.001) {
    const q = Math.min(6, p);
    assert.equal(poseProgress(q), poseProgress(q, false), `poseProgress diverged at p = ${q.toFixed(3)}`);
    const a = worldAt(q), b = worldAt(q, false);
    for (const k of Object.keys(a)) assert.equal(a[k], b[k], `worldAt.${k} diverged at p = ${q.toFixed(3)}`);
  }
  // chapters 0,1 and 3..6 must be identical on BOTH paths — only chapter 2 is allowed to differ on a phone
  for (const p of [0.5, 1.5, 3.5, 4.5, 5.5, 6]) {
    assert.equal(poseProgress(p), poseProgress(p, true), `only chapter 2 may differ on mobile (p = ${p})`);
    assert.deepEqual(worldAt(p), worldAt(p, true), `only chapter 2 may differ on mobile (p = ${p})`);
  }
});
