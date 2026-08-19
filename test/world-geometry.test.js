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
    for (const c of bores) {
      for (let i = 0; i <= 20; i++) {
        const y = c.getPointAt(i / 20).y;
        assert.ok(Math.abs(y - (layout.BENCH_Y + wellPath.BORE_LIFT)) < 0.06, `bore point off the bench: ${y}`);
      }
    }
  });
  test('six legs from four staggered junctions (1/1/2/2), never a fan from one node', () => {
    assert.equal(paths.laterals.length, 6);
    assert.deepEqual(wellPath.JUNCTIONS.map((j) => j.t), [0.1, 0.3, 0.5, 0.72]);
    assert.deepEqual(wellPath.JUNCTIONS.map((j) => j.toes.length), [1, 1, 2, 2]);
  });
  test('at least two legs leave the notch into solid rock and produce bore mouths on the back wall', () => {
    const leaving = paths.laterals.filter((c) => c.userData.leavesNotch);
    assert.ok(leaving.length >= 2, `only ${leaving.length} legs leave the notch`);
    assert.ok(paths.boreMouths.length >= 2);
    for (const m of paths.boreMouths) assert.ok(Math.abs(m.point.z - layout.NOTCH.minZ) < 0.03);
  });
  test('the candle (default view) is at the open-hole anchor, on the bench near the x = -1.6 wall', () => {
    const p = wellPath.getWellFiPlacement(paths, wellPath.DEFAULT_WELLFI_VIEW);
    assert.equal(p.id, 'outside-intermediate');
    assert.ok(p.position.x > layout.NOTCH.minX && p.position.x < layout.NOTCH.minX + 1.2, `x ${p.position.x}`);
    assert.ok(Math.abs(p.position.y - (layout.BENCH_Y + 0.12)) < 0.1);
  });
  test('the below-pump placement is inside the intermediate string on the front face', () => {
    const p = wellPath.getWellFiPlacement(paths, 'below-pump');
    assert.equal(p.id, 'below-pump');
    assert.ok(Math.abs(p.position.z - wellPath.Z_FACE) < 0.4);
    assert.ok(p.position.y > layout.BENCH_Y);
  });
});
