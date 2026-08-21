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
    assert.ok(Math.abs(heel.y - (layout.BENCH_Y + 0.02)) < 0.02, `heel y ${heel.y}`);
    const bores = [paths.openHole, ...paths.laterals];
    bores.forEach((c, ci) => {
      // the open hole leaves the shoe a hair above the bench and settles onto it within its first ~15 %; the
      // first junction (t = 0.10) sits on that descent, so a lateral's first sample may inherit it
      for (let i = ci === 0 ? 3 : 1; i <= 20; i++) {
        const y = c.getPointAt(i / 20).y;
        assert.ok(Math.abs(y - (layout.BENCH_Y + wellPath.BORE_LIFT)) < 0.06, `bore point off the bench: ${y}`);
      }
    });
    assert.equal(wellPath.BORE_LIFT, 0, 'bore centrelines lie ON the bench plane (spec §3) — troughs are slots, not mounds');
  });
  // Round 12 (Kyle: "the positioning of our intermediate looks like we are producing from the mudstone"). The
  // intermediate lands JUST INTO THE TOP OF THE PAY and the open hole below it is pay only. These three tests
  // are the depth truth of the whole schematic — they are why the heel moved.
  test('the intermediate shoe lands just into the top of the pay, below the Clearwater Mudstone', () => {
    const mudstone = layout.STRATA.find((s) => s.name === 'middleMudstone');
    const shoe = paths.shoe;
    assert.ok(shoe.y < layout.PAY_TOP, `shoe y ${shoe.y} must be below PAY_TOP ${layout.PAY_TOP}`);
    assert.ok(shoe.y <= mudstone.bottomY, 'the shoe is out of the mudstone');
    assert.ok(shoe.y > layout.PAY_TOP - 0.3, `shoe y ${shoe.y} — JUST into the top of the pay, not landed deep in it`);
    // and the shoe is inside the notch, on the bench, where the open hole can be seen
    assert.ok(shoe.x > layout.NOTCH.minX, `shoe x ${shoe.x} is inside the notch`);
  });
  test('the LANDED run of the intermediate — casing OD included — lies inside the pay', () => {
    // "landed" = the part of the cased string that has stopped descending. Its crown (centre + the 7-in shell
    // radius) must clear PAY_TOP, or a viewer reads the horizontal section as producing from the mudstone.
    const R = wellPath.RADII.casedShell;
    let landed = 0;
    for (let i = 0; i <= 200; i++) {
      const u = i / 200, p = paths.cased.getPointAt(u), t = paths.cased.getTangentAt(u);
      if (Math.abs(t.y) > 0.08) continue;             // still building
      landed++;
      assert.ok(p.y + R <= layout.PAY_TOP, `landed casing crown ${(p.y + R).toFixed(3)} at u ${u} is above PAY_TOP`);
    }
    assert.ok(landed > 30, 'there is a landed (horizontal) run to check');
  });
  test('the open hole and every lateral live in the Clearwater Lower Sand only', () => {
    const pay = layout.STRATA.find((s) => s.name === 'lowerSand');
    const R = wellPath.RADII.openHole;
    [paths.openHole, ...paths.laterals].forEach((c) => {
      for (let i = 0; i <= 20; i++) {
        const p = c.getPointAt(i / 20);
        assert.ok(p.y + R < pay.topY, `bore crown ${(p.y + R).toFixed(3)} is above the pay top`);
        assert.ok(p.y - R > pay.bottomY, `bore ${p.y} is below the pay`);
      }
    });
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
  // Round 11 (Kyle): the landing page shows WellFi INSIDE the intermediate. Round 12: it sits on the EXPOSED
  // front-face run of that string, above the shoe — which is why the shoe could be brought back up to the top
  // of the pay. Kyle: "it was right in the section right before the intermediate hides in the formation."
  test('the candle (default view) is inside the intermediate, on the exposed front-face run', () => {
    const p = wellPath.getWellFiPlacement(paths, wellPath.DEFAULT_WELLFI_VIEW);
    assert.equal(p.id, 'inside-intermediate');
    // on the cut face (the casing is half-proud there, so the collar reads through it in the cutaway)…
    assert.ok(Math.abs(p.position.z - wellPath.Z_FACE) < 0.12, `z ${p.position.z} — not on the front cut face`);
    assert.ok(p.position.x < layout.NOTCH.minX, `x ${p.position.x} — the exposed face run is x < ${layout.NOTCH.minX}`);
    // …and still ahead of the point where the string turns and dives into the formation
    const dive = paths.boreMouths.find((m) => m.id === 'cased-dive');
    assert.ok(dive && wellPath.WELLFI_INSIDE_INTERMEDIATE_PARAM < dive.u, 'the collar is above the dive, not buried');
    // landed depth: inside the pay, casing OD clear of the mudstone
    assert.ok(p.position.y + wellPath.RADII.casedShell <= layout.PAY_TOP, `collar crown ${p.position.y + wellPath.RADII.casedShell}`);
  });
  test('the default collar sits above the shoe, above the standoff line, with at least 10 % standoff', () => {
    const p = wellPath.getWellFiPlacement(paths, wellPath.DEFAULT_WELLFI_VIEW);
    const L = paths.cased.getLength();
    const share = 1 - wellPath.WELLFI_INSIDE_INTERMEDIATE_PARAM;
    // 10 % of the intermediate is the MINIMUM standoff the qualifier states; the authored placement keeps more
    // than the minimum and must never fall below it.
    assert.ok(share >= 0.10, `standoff share ${share} is below the 10 % rule`);
    assert.ok(share <= 0.35, `standoff share ${share} — still recognisably "above the shoe", not mid-build`);
    assert.ok(L * share > 0.5, 'the standoff is a visible length, not a hairline');
    assert.ok(p.position.distanceTo(paths.shoe) > 0.5, 'the collar is clear of the shoe');
    // the collar is ABOVE the qualifier's 10 % standoff line, and the line is above the shoe
    assert.ok(wellPath.WELLFI_INSIDE_INTERMEDIATE_PARAM < 0.9, 'the collar sits above the standoff line at u = 0.9');
    // and the "deeper" answer still puts the collar BELOW the shoe, in open hole — the WHOLE tool, not half of
    // it: the tool is 0.62 long (wellfiTool.TOOL_LENGTH), so its up-hole end must clear the shoe too
    const outside = wellPath.getWellFiPlacement(paths, 'outside-intermediate');
    assert.ok(outside.position.x > paths.shoe.x, 'outside-intermediate is past the shoe, down the open-hole trunk');
    assert.ok(outside.position.distanceTo(paths.shoe) > 0.42, `outside-intermediate is only ${outside.position.distanceTo(paths.shoe).toFixed(2)} from the shoe — the tool would straddle it`);
  });
  test('the below-pump placement is inside the intermediate string on the front face', () => {
    const p = wellPath.getWellFiPlacement(paths, 'below-pump');
    assert.equal(p.id, 'below-pump');
    assert.ok(Math.abs(p.position.z - wellPath.Z_FACE) < 0.4);
    assert.ok(p.position.y > layout.BENCH_Y);
  });
});

// Chapter 6 truth (round 13): the pump is ONE thing on ONE well. wellPath.PUMP_U is the single source of truth
// (shallower / datum / deeper); chapter 4 imports it, chapter 6 restates it, and the forwarded PNG uses the same
// two fractions — otherwise the download, the world and the Deployment chapter tell an operator three different
// stories about one pump. Both chapter-6 bands must also be RUNNABLE: a PCP or rod string lands in the vertical
// or a low-angle tangent above the KOP, never in the build and never in the lateral.
describe('chapter 6 pump marker — one pump, and it is landable', () => {
  let builder;
  before(async () => { builder = await import('../src/world/wellBuilder.js'); });
  const inclination = (u) => {
    const t = paths.cased.getTangentAt(u);
    return Math.acos(Math.min(1, Math.abs(-t.y))) * 180 / Math.PI;
  };
  test('wellPath.PUMP_U is the source of truth and chapter 4 imports it rather than restating a number', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    assert.deepEqual(
      { shallower: wellPath.PUMP_U.shallower, deeper: wellPath.PUMP_U.deeper },
      { shallower: builder.PUMP_U.shallower, deeper: builder.PUMP_U.deeper },
      'wellBuilder restates wellPath.PUMP_U exactly',
    );
    const toolViz = fs.readFileSync(path.join(__dirname, '..', 'src', 'world', 'toolViz.js'), 'utf8');
    assert.match(toolViz, /const PUMP_U = PUMP_BANDS\.datum;/, 'chapter 4 reads the shared datum, it does not restate a fraction');
    assert.ok(!/const PUMP_U = 0\./.test(toolViz), 'no local pump fraction survives in toolViz');
  });
  test('both answered bands bracket the chapter-4 datum, so the pump never moves on the same well', () => {
    const { shallower, datum, deeper } = wellPath.PUMP_U;
    assert.ok(shallower < datum && datum < deeper, `${shallower} < ${datum} < ${deeper}`);
  });
  test('every pump position is runnable: at or above a low-angle tangent, never in the build or the lateral', () => {
    for (const [name, u] of Object.entries(wellPath.PUMP_U)) {
      const inc = inclination(u);
      assert.ok(inc <= 35, `${name} (u = ${u}) is ${inc.toFixed(1)}° from vertical — past the low-angle tangent nobody lands a pump beyond`);
    }
  });
  test("the pump is not measured against the standoff line — that line is the collar datum", () => {
    assert.ok(wellPath.PUMP_U.deeper < builder.STANDOFF_U, 'both bands sit above the standoff line, in the runnable part of the string');
    const fs = require('node:fs');
    const path = require('node:path');
    const fitJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'fit.js'), 'utf8');
    assert.ok(!/pump\s—\sdeeper than the standoff line/.test(fitJs), 'the PNG label no longer couples the pump to the standoff line');
    assert.ok(!/(deeper|shallower) than the standoff line/.test(fitJs), 'no caption measures the pump landing against the standoff line');
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
