/* The camera map must be continuous (spec §4: "one authored move per chapter", never a cut except the
 * deliberate hard-cut arrival on an anchor link).
 *
 * poseProgress() maps conductor progress (0..6) onto pose indices (0..8). A step at a chapter boundary is
 * invisible in a still frame and unmissable in motion: it snaps the camera mid-scroll, and it also makes the
 * frame job non-deterministic — at the chapter-4 anchor one viewport landed at exact = 3.99983 and another at
 * 4.00007, so the same anchor rendered two different poses (round 5).
 *
 *   node --test test/pose-continuity.test.js
 */
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');

let chapters;
before(async () => { chapters = await import('../src/chapters.js'); });

describe('camera pose map', () => {
  test('is continuous at every chapter boundary (no camera cut mid-scroll)', () => {
    const { poseProgress } = chapters;
    for (let k = 1; k <= 6; k++) {
      const before_ = poseProgress(k - 1e-6);
      const after = poseProgress(k);
      assert.ok(Math.abs(before_ - after) < 1e-3, `poseProgress steps ${before_} → ${after} at p = ${k}`);
    }
  });

  test('is monotonic and stays inside the authored pose range', () => {
    const { poseProgress, POSES } = chapters;
    let prev = -Infinity;
    for (let p = 0; p <= 6.0001; p += 0.01) {
      const v = poseProgress(Math.min(6, p));
      assert.ok(v >= prev - 1e-9, `poseProgress is not monotonic at p = ${p.toFixed(2)}`);
      assert.ok(v >= 0 && v <= POSES.length - 1, `poseProgress(${p.toFixed(2)}) = ${v} outside 0..${POSES.length - 1}`);
      prev = v;
    }
  });

  test('each chapter lands on its authored pose at its anchor', () => {
    const { poseProgress, POSES } = chapters;
    for (const [chapter, pose] of [[0, 0], [1, 1], [2, 2], [3, 3], [4, 5], [6, 8]]) {
      const v = poseProgress(chapter);
      assert.ok(Math.abs(v - pose) < 1e-6, `chapter ${chapter} maps to pose ${v}, expected ${pose}`);
      assert.ok(POSES[pose], `pose ${pose} exists`);
    }
    // Chapter 5 is the exception by design: the rise (deployment-b → yôtin) runs 4.8 → 5.3, so the #company
    // anchor is deliberately mid-rise — the camera is still climbing as the paper arrives — and completes
    // before the paper is read.
    const atFive = poseProgress(5);
    assert.ok(atFive > 6 && atFive < 7, `chapter 5 should be mid-rise between poses 6 and 7, got ${atFive}`);
    assert.ok(Math.abs(poseProgress(5.3) - 7) < 1e-6, 'the rise completes by p = 5.3');
    assert.ok(Math.abs(poseProgress(5.7) - 7) < 1e-6, 'and holds while the paper is read');
  });

  test('the two sub-poses are named where the ledger says they are', () => {
    const ids = chapters.POSES.map((p) => p.id);
    assert.deepEqual(ids, ['surface', 'descent', 'tool', 'signal', 'signal-b', 'deployment-a', 'deployment-b', 'yotin', 'fit']);
  });
});
