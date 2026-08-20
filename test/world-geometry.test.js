/* Geometry contract for the three.js world (spec §3): bench topology, Clearwater column, staggered fishbone,
 * casing telescope, candle at the open-hole anchor, two legs into rock. Pure math — no DOM, no WebGL.
 *
 *   node --test test/world-geometry.test.js
 */
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');

let layout, wellPath, paths;
before(async () => {
  layout = await import('../src/world/layout.js');
  wellPath = await import('../src/world/wellPath.js');
  paths = wellPath.buildWellPaths();
});

describe('bench topology constants', () => {
  test('PAY_TOP and BENCH_Y are the spec values and the bench is 0.15 below the pay top', () => {
    assert.equal(layout.PAY_TOP, -2.4);
    assert.equal(layout.BENCH_Y, -2.55);
    assert.ok(Math.abs(layout.PAY_TOP - 0.15 - layout.BENCH_Y) < 1e-9);
  });
  test('the notch opens to the front and right faces', () => {
    assert.deepEqual(layout.NOTCH, { minX: -1.6, maxX: 7, minZ: -0.6, maxZ: 5 });
  });
  test('Clearwater column is contiguous, top to bottom, no coals, pay top at PAY_TOP', () => {
    const names = layout.STRATA.map((s) => s.name);
    assert.deepEqual(names, ['topsoil', 'colorado', 'upperSand', 'middleMudstone', 'lowerSand']);
    for (let i = 1; i < layout.STRATA.length; i++) assert.equal(layout.STRATA[i].topY, layout.STRATA[i - 1].bottomY);
    assert.equal(layout.STRATA[4].topY, layout.PAY_TOP);
    assert.equal(layout.LOWER.topY, layout.STRATA[4].bottomY);
    assert.ok(!('COAL_YS' in layout));
  });
});

describe('well geometry', () => {
  test('casing telescope is strictly decreasing: 0.175 > 0.127 > 0.100 > 0.086 > 0.070', () => {
    const r = wellPath.RADII;
    assert.deepEqual([r.surfaceCollar, r.casedShell, r.cased, r.openHole, r.lateral], [0.175, 0.127, 0.1, 0.086, 0.07]);
  });
  test('the heel lands on the bench and every bore point lies on the bench plane', () => {
    const heel = paths.cased.getPointAt(1);
    assert.ok(Math.abs(heel.y - (layout.BENCH_Y + 0.12)) < 0.02, `heel y ${heel.y}`);
    const bores = [paths.openHole, ...paths.laterals];
    bores.forEach((c, ci) => {
      // the open hole leaves the shoe 0.12 above the bench and settles onto it within its first ~15 %; the
      // first junction (t = 0.10) sits on that descent, so a lateral's first sample may inherit it
      for (let i = ci === 0 ? 3 : 1; i <= 20; i++) {
        const y = c.getPointAt(i / 20).y;
        assert.ok(Math.abs(y - (layout.BENCH_Y + wellPath.BORE_LIFT)) < 0.06, `bore point off the bench: ${y}`);
      }
    });
    assert.equal(wellPath.BORE_LIFT, 0, 'bore centrelines lie ON the bench plane (spec §3) — troughs are slots, not mounds');
  });
  test('six legs from four staggered junctions (1/1/2/2), never a fan from one node', () => {
    assert.equal(paths.laterals.length, 6);
    assert.deepEqual(wellPath.JUNCTIONS.map((j) => j.t), [0.1, 0.3, 0.5, 0.72]);
    assert.deepEqual(wellPath.JUNCTIONS.map((j) => j.toes.length), [1, 1, 2, 2]);
  });
  test('at least two legs leave the notch into solid rock and produce bore mouths on the back wall', () => {
    const leaving = paths.laterals.filter((c) => c.userData.leavesNotch);
    assert.ok(leaving.length >= 2, `only ${leaving.length} legs leave the notch`);
    const back = paths.boreMouths.filter((m) => m.plane === 'back');
    assert.ok(back.length >= 2);
    for (const m of back) assert.ok(Math.abs(m.point.z - layout.NOTCH.minZ) < 0.03);
    // and the cased string is named where it enters the notch through the x = -1.6 wall (spec §3)
    const casedMouth = paths.boreMouths.find((m) => m.id === 'cased');
    assert.ok(casedMouth && casedMouth.plane === 'left', 'cased bore mouth on the notch wall');
    assert.ok(Math.abs(casedMouth.point.x - layout.NOTCH.minX) < 0.03);
  });
  // Round 11 (Kyle): the landing page shows WellFi INSIDE the intermediate. The collar stayed put in world
  // space (chapter 2 is an fov-18 close-up on it); the intermediate was landed deeper so the shoe is now below
  // it, with the standoff the qualifier states.
  test('the candle (default view) is inside the intermediate, on the bench near the x = -1.6 wall', () => {
    const p = wellPath.getWellFiPlacement(paths, wellPath.DEFAULT_WELLFI_VIEW);
    assert.equal(p.id, 'inside-intermediate');
    assert.ok(p.position.x > layout.NOTCH.minX && p.position.x < layout.NOTCH.minX + 1.2, `x ${p.position.x}`);
    assert.ok(Math.abs(p.position.y - (layout.BENCH_Y + 0.12)) < 0.1);
  });
  test('the default collar sits above the shoe with ~10 % of the intermediate as standoff', () => {
    const p = wellPath.getWellFiPlacement(paths, wellPath.DEFAULT_WELLFI_VIEW);
    const standoff = paths.cased.getLength() * (1 - wellPath.WELLFI_INSIDE_INTERMEDIATE_PARAM);
    assert.ok(Math.abs(standoff / paths.cased.getLength() - 0.10) < 0.02, `standoff share ${standoff / paths.cased.getLength()}`);
    assert.ok(p.position.distanceTo(paths.shoe) > 0.5, 'the collar is clear of the shoe');
    // and the "deeper" answer still puts the collar BELOW the shoe, in open hole
    const outside = wellPath.getWellFiPlacement(paths, 'outside-intermediate');
    assert.ok(outside.position.x > paths.shoe.x, 'outside-intermediate is past the shoe, down the open-hole trunk');
  });
  test('the below-pump placement is inside the intermediate string on the front face', () => {
    const p = wellPath.getWellFiPlacement(paths, 'below-pump');
    assert.equal(p.id, 'below-pump');
    assert.ok(Math.abs(p.position.z - wellPath.Z_FACE) < 0.4);
    assert.ok(p.position.y > layout.BENCH_Y);
  });
});

// Chapter 6 truth (round 9): the qualifier's "deeper"/"shallower" answers are a spatial relation to the standoff
// line, so the 3D marker must bracket it — and must agree with the client-side PNG schematic (src/ui/fit.js:108,
// deeper ? 0.96 : 0.42), or the download and the world tell an operator two different stories about one answer.
describe('chapter 6 pump marker vs the standoff line', () => {
  let builder;
  before(async () => { builder = await import('../src/world/wellBuilder.js'); });
  test('PUMP_U.deeper > STANDOFF_U > PUMP_U.shallower', () => {
    assert.ok(builder.PUMP_U.deeper > builder.STANDOFF_U, `deeper ${builder.PUMP_U.deeper} must be below the standoff line ${builder.STANDOFF_U}`);
    assert.ok(builder.STANDOFF_U > builder.PUMP_U.shallower, `shallower ${builder.PUMP_U.shallower} must be above the standoff line ${builder.STANDOFF_U}`);
  });
  // wellBuilder.js may not import the world modules (one-chunk budget), so it RESTATES the authored default
  // placement. If the two drift, an unanswered qualifier silently re-proposes the open-hole configuration.
  test('wellBuilder restates the authored default placement', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'world', 'wellBuilder.js'), 'utf8');
    const m = src.match(/const DEFAULT_VIEW = '([a-z-]+)'/);
    assert.ok(m, 'wellBuilder DEFAULT_VIEW not found');
    assert.equal(m[1], wellPath.DEFAULT_WELLFI_VIEW);
  });
  test('the 3D marker uses the same parameters as the downloaded schematic', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'fit.js'), 'utf8');
    const m = src.match(/deeper\s*\?\s*([\d.]+)\s*:\s*([\d.]+)/);
    assert.ok(m, 'fit.js pump-marker parameters not found');
    assert.equal(Number(m[1]), builder.PUMP_U.deeper);
    assert.equal(Number(m[2]), builder.PUMP_U.shallower);
  });
});
