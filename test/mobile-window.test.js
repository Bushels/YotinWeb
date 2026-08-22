/**
 * Round 19 — Kyle's second real-device walkthrough on an iPhone 17 Pro Max:
 *   1. "The commission the well section where you place the receiver on the pad, I can't visually see it,
 *       would need a gap to actually see it on mobile."
 *   2. "Same with the fluid level slider, I can't see the fluid level on mobile"
 *
 * Both are the same class: on a phone the invited action and its world consequence never share open screen —
 * the receiver planted 373 px across and 350 px down, INSIDE the commissioning card (phone ground 0.72) under
 * its own body copy; the fluid level rule projected to x −139, off the left edge entirely. The fix is a world
 * band in the copy stack (CSS) plus a MOBILE pose composed offline to aim the consequence into it, and — for
 * chapter 4 — the spec §4 mobile phase rule that chapter 2 already uses, so the level is not also a moving
 * target under a moving camera.
 *
 * These tests lock the mobile half AND the promise that desktop did not move by a single number, which is what
 * lets the seven public stills and scripts/stills-pose.fingerprint stand without regeneration.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { poseProgress, worldAt, POSES } from '../src/chapters.js';

// The stations, measured settled at 440×956 / 440×758 / 390×844 (scratch/r19/station2.mjs).
const SLIDER_CENTRED = [0.141, 0.174, 0.158];
const BAND_LEAVES_FOLD = [0.394, 0.383, 0.383];
const FAQ_PEEKS_IN = [0.599, 0.653, 0.635];

test('mobile chapter 4 — the camera holds the instrument while the instrument is used', () => {
  for (const l of [0, 0.05, ...SLIDER_CENTRED, 0.3, 0.38]) {
    assert.equal(poseProgress(4 + l, true), 5,
      `the mobile pose must still be deployment-a at chapter-4 local ${l}`);
  }
  // and it must still be within a whisker of it while the world band is on screen (the smoothstep leaves with
  // zero derivative, so the last few hundredths cost almost nothing)
  for (const l of BAND_LEAVES_FOLD) {
    assert.ok(Math.abs(poseProgress(4 + l, true) - 5) < 0.02,
      `the mobile pose must still read as deployment-a while the world band is on screen (local ${l})`);
  }
  // Before the fix the pose was already 26–32 % of the way to the wide slice by the time the slider was centred.
  assert.ok(poseProgress(4 + SLIDER_CENTRED[0]) > 5.25,
    'sanity: the DESKTOP map really is well into its move at that local progress — that is the phase knot');
});

test('mobile chapter 4 — the move is spent on the tail and the world is at rest before the FAQ', () => {
  assert.ok(poseProgress(4.5, true) > 5, 'the mobile pose must be moving once the benefits grid is being read');
  for (const l of FAQ_PEEKS_IN) {
    assert.equal(poseProgress(4 + l, true), 6,
      `the mobile pose must have arrived at deployment-b before the FAQ (local ${l}) — spec §4: world at rest under text being read`);
  }
});

test('the mobile chapter-4 curve is continuous and monotonic at both seams', () => {
  assert.equal(poseProgress(4, true), 5, 'chapter 4 still opens exactly on deployment-a');
  assert.ok(Math.abs(poseProgress(4 - 1e-9, true) - 5) < 1e-6, 'and arrives on it from chapter 3');
  assert.ok(Math.abs(poseProgress(4.8 - 1e-9, true) - 6) < 1e-6, 'and hands over to the rise exactly on deployment-b');
  assert.equal(poseProgress(4.8, true), 6);
  let prev = -Infinity;
  for (let p = 0; p <= 6; p += 0.001) {
    const v = poseProgress(Math.min(6, p), true);
    assert.ok(v >= prev - 1e-9, `mobile poseProgress is not monotonic at p = ${p.toFixed(3)}`);
    prev = v;
  }
});

test('the two re-composed MOBILE endpoints are the ones the offline search authored', () => {
  const byId = Object.fromEntries(POSES.map((p) => [p.id, p]));
  assert.deepEqual(byId['signal-b'].mobile, { position: [1.57, 11.73, 18.68], target: [-5.16, 2.99, 2.18], fov: 36 });
  assert.deepEqual(byId['deployment-a'].mobile, { position: [-4.26, -1.83, 14.27], target: [-4.97, -0.15, 5.98], fov: 38 });
});

test('DESKTOP IS UNTOUCHED — every desktop pose endpoint is byte-for-byte what it was', () => {
  // scripts/stills.mjs shoots at 1600×900 and frames.mjs at 1440×900 / 1366×768; none of them can see a
  // `mobile` sub-pose. Frozen literals so a desktop edit can never slip through as "just a mobile change" —
  // if this fails, the public WebP stills and scripts/stills-pose.fingerprint are stale.
  const want = [
    ['surface', [27.8, 22.0, 30.9], [-1.8, -1.3, 2.2], 20],
    ['descent', [-0.25, 2.25, 15.5], [-5.32, -1.54, 5.26], 30],
    ['tool', [-2.07, -2.16, 6.95], [-2.40, -2.57, 5.01], 20],
    ['signal', [4.1, 1.3, 13.2], [-4.08, -2.0, 6.07], 28],
    ['signal-b', [1.0, 11.0, 16.0], [-8.0, 0.0, 5.0], 28],
    ['deployment-a', [-0.8, -0.4, 12.3], [-6.0, -2.1, 5.4], 26],
    ['deployment-b', [4.6, 1.2, 15.8], [0.6, -2.5, 2.4], 28],
    ['yotin', [-6.5, 8.0, 15.0], [-4.6, -0.3, 3.6], 34],
    ['fit', [-3.0, 1.5, 17.0], [-4.95, -2.56, 5.0], 26],
  ];
  assert.equal(POSES.length, want.length);
  POSES.forEach((p, i) => {
    const [id, position, target, fov] = want[i];
    assert.equal(p.id, id, `pose ${i} is ${p.id}, expected ${id}`);
    assert.deepEqual(p.position, position, `${id} desktop position moved`);
    assert.deepEqual(p.target, target, `${id} desktop target moved`);
    assert.equal(p.fov, fov, `${id} desktop fov moved`);
  });
});

test('DESKTOP IS UNTOUCHED — the desktop pose map and every world channel are unchanged', () => {
  // The desktop chapter-4 branch is still the authored 0 → 0.55 move: the mobile hold is behind `if (mobile)`.
  for (let p = 4; p < 4.8; p += 0.001) {
    assert.ok(Math.abs(poseProgress(p) - (5 + Math.min(1, (p - 4) / 0.55))) < 1e-12,
      `desktop chapter-4 pose map moved at p = ${p.toFixed(3)}`);
  }
  for (let p = 0; p <= 6.0001; p += 0.001) {
    const q = Math.min(6, p);
    assert.equal(poseProgress(q), poseProgress(q, false), `poseProgress diverged at p = ${q.toFixed(3)}`);
    const a = worldAt(q), b = worldAt(q, false);
    for (const k of Object.keys(a)) assert.equal(a[k], b[k], `worldAt.${k} diverged at p = ${q.toFixed(3)}`);
  }
});

test('only chapters 2 and 4 may differ on a phone — and only in the POSE, never in the light', () => {
  for (const p of [0.5, 1.5, 3.5, 5.5, 6]) {
    assert.equal(poseProgress(p), poseProgress(p, true), `chapter at p = ${p} must not differ on mobile`);
  }
  // Chapter 4 differs by design from round 19; every world channel (light, cutaway, candle, field, wind, flow,
  // fog) is still viewport-independent there — the chapter-2 hold needed a light hold to go with it, this one
  // does not, because chapter 4's own light ramp is nearly flat (0.32 → 0.75 across a chapter read at l < 0.4).
  for (const p of [4.1, 4.3, 4.5, 4.7]) {
    assert.deepEqual(worldAt(p), worldAt(p, true), `worldAt must stay viewport-independent at p = ${p}`);
  }
});
