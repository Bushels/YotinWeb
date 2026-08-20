// Well geometry for the bench topology (spec §3). Curve machinery ported from the island's wellPath.ts.
//
// Casing telescope (spec, engineer-vetted): 0.175 surface collar > 0.127 7-in shell > 0.100 cased >
// 0.086 open-hole trunk > 0.070 legs. The cased J-build rides half-proud on the front cut face (z = +5)
// and lands the heel on the bench; the open-hole trunk runs flat across the bench; six legs leave four
// staggered junctions (1/1/2/2) — no fan from one node, no leg plunging. Two legs cross the back notch
// wall (z = -0.6) into solid rock and terminate as bore mouths on that cut face.
import { CatmullRomCurve3, Vector3 } from 'three';
import { BENCH_Y, NOTCH } from './layout.js';

export const RADII = { surfaceCollar: 0.175, casedShell: 0.127, cased: 0.100, openHole: 0.086, lateral: 0.070 };
export const Z_FACE = 5; // front cut face — the cased bore rides ON it (half-proud)
export const BORE_LIFT = 0.0; // bore centreline ON the bench plane (spec §3) — the trough is drawn as a flattened dark slot, not a raised mound

export const WELLFI_VIEW_IDS = ['inside-intermediate', 'below-pump', 'outside-intermediate'];
// Round 11 (Kyle) put WellFi INSIDE the intermediate — the right call — but paid for it by landing the shoe
// DEEPER, past a collar that was not allowed to move: the whole landed run then sat at y = -2.43, its OD in
// the Clearwater Mudstone, and the open hole appeared to start in the mudstone ("it looks like we are
// producing from the mudstone" — Kyle, round 12).
//
// Round 12 fixes it from the other end, which is the honest one: the intermediate lands where a real
// intermediate lands — just into the TOP OF THE PAY — and the collar moves UP the well to stay above it. The
// landed run is at BENCH_Y (0.15 into the Clearwater Lower Sand, casing crown 0.05 clear of PAY_TOP), it runs
// along the exposed front cut face, and the collar rides that exposed stretch: visible through the casing at
// the cutaway, "right in the section right before the intermediate hides in the formation" (Kyle). The shoe
// lands a short way into the notch, on the bench, and everything past it — trunk and all six legs — is open
// hole in the Lower Sand.
export const DEFAULT_WELLFI_VIEW = 'inside-intermediate';
// On the cased string, on the exposed face run just before the string turns into the formation (u = 0.72;
// the dive is at u ≈ 0.76), ≈ 28 % of the intermediate above the shoe.
// This is ABOVE the 10 % standoff line (wellBuilder.STANDOFF_U = 0.9), not on it: 10 % is the minimum the
// qualifier states, and the authored placement keeps more than the minimum.
export const WELLFI_INSIDE_INTERMEDIATE_PARAM = 0.72;
export const WELLFI_BELOW_PUMP_CASING_PARAM = 0.5;   // inside the 7-in string, below a shallow pump landing
// On the open-hole trunk, below the shoe (the "deeper" answer). At u = 0.03 the anchor was only 0.25 units
// past the heel — less than the tool's own half-length, so the collar STRADDLED the shoe and half of the
// "outside the intermediate" configuration was still inside it (round 12).
export const WELLFI_OUTSIDE_INTERMEDIATE_PARAM = 0.075;

const v = (x, y, z) => new Vector3(x, y, z);

// Four staggered junctions along the trunk (fractions from the correction spec) and their toes (plan).
// J3b and J4b leave the notch (z < -0.6) — they enter solid rock and end as bore mouths on the back wall.
export const JUNCTIONS = [
  { t: 0.10, toes: [[3.9, 4.6]] },
  { t: 0.30, toes: [[5.6, 4.1]] },
  { t: 0.50, toes: [[6.6, 3.2], [4.9, -1.9]] },
  { t: 0.72, toes: [[6.8, 1.35], [6.4, -1.5]] },
];

function bendPoint(a, b, f, side) {
  // point f along a→b with a gentle lateral wobble so legs read "real well", not CAD
  const x = a.x + (b.x - a.x) * f, z = a.z + (b.z - a.z) * f;
  const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz) || 1;
  const nx = -dz / len, nz = dx / len;
  const w = Math.sin(f * Math.PI) * 0.12 * side;
  return v(x + nx * w, BENCH_Y + BORE_LIFT, z + nz * w);
}

// The section-cut convention keeps tubulars WHOLE on the cut plane (the cased string rides half-proud on
// z = Z_FACE). A tool drawn on that same centreline would be half-buried in the rock and would read as a
// sliced cylinder from any off-normal angle — including the chapter-2 close-up and its ±0.3 rad orbit. So a
// tool anchored on the face run rides the PROUD half of the string it is inside: +0.045 in z puts its 0.05 OD
// between the casing's centreline and its outer wall — whole, visible, still inside the pipe.
export const TOOL_FACE_BIAS = 0.045;
// The same argument on the bench: the open-hole bores are drawn as slots sunk past half, so a tool anchored on
// a bore centreline would be half in the floor. It rides the proud half of its own bore.
export const TOOL_BORE_LIFT = 0.045;

function toolAnchor(curve, param, offset = null) {
  const position = curve.getPointAt(param);
  if (offset) { position.z += offset.z || 0; position.y += offset.y || 0; }
  return { position, tangent: curve.getTangentAt(param).normalize().clone() };
}

// Where a curve crosses the plane axis = value (first crossing), or null. axis: 'z' (default) or 'x'.
function crossing(curve, plane, samples = 200, axis = 'z') {
  let prev = curve.getPointAt(0);
  for (let i = 1; i <= samples; i++) {
    const p = curve.getPointAt(i / samples);
    if ((prev[axis] - plane) * (p[axis] - plane) <= 0 && prev[axis] !== p[axis]) {
      const f = (prev[axis] - plane) / (prev[axis] - p[axis]);
      return { point: prev.clone().lerp(p, f), tangent: p.clone().sub(prev).normalize(), u: (i - 1 + f) / samples };
    }
    prev = p;
  }
  return null;
}

export function buildWellPaths() {
  const wellhead = v(-5.2, 0.05, Z_FACE);
  // The heel: where the intermediate lands, just inside the notch, sitting in the bench plane with the shoe
  // ring standing proud of the floor. Its lift is bounded by the truth this whole round is about — the 7-in
  // crown (RADII.casedShell) must stay below PAY_TOP, so the landed intermediate is never seen in the
  // Clearwater Mudstone (round 12; BENCH_Y + 0.02 leaves 0.023 of margin).
  const heel = v(-0.95, BENCH_Y + 0.02, 4.20);
  // The build stays ON the front cut face (z = Z_FACE) the whole way down, crosses the Mudstone while still
  // descending, and lands at BENCH_Y — so every part of the LANDED run, casing OD included, is below PAY_TOP.
  // Only the last ~13 % turns in plan, dives behind the face and crosses the x = -1.6 wall to the heel.
  const cased = new CatmullRomCurve3([
    wellhead.clone(), v(-5.2, -1.05, Z_FACE), v(-5.02, -1.88, Z_FACE), v(-4.34, -2.44, Z_FACE),
    v(-3.45, BENCH_Y, Z_FACE), v(-2.25, BENCH_Y, 4.94), heel.clone(),
  ], false, 'catmullrom', 0.5);

  const toe = v(6.6, BENCH_Y + BORE_LIFT, 0.5);
  const openHole = new CatmullRomCurve3([
    heel.clone(), bendPoint(heel, toe, 0.25, 1), bendPoint(heel, toe, 0.5, -1), bendPoint(heel, toe, 0.75, 0.6), toe,
  ], false, 'catmullrom', 0.5);

  const laterals = [];
  JUNCTIONS.forEach((j) => {
    const kop = openHole.getPointAt(j.t);
    j.toes.forEach((t2, k) => {
      const toeV = v(t2[0], BENCH_Y + BORE_LIFT, t2[1]);
      const side = k % 2 === 0 ? 1 : -1;
      const c = new CatmullRomCurve3([kop.clone(), bendPoint(kop, toeV, 0.35, side), bendPoint(kop, toeV, 0.7, -side * 0.5), toeV], false, 'catmullrom', 0.5);
      c.userData = { junction: j.t, leavesNotch: t2[1] < NOTCH.minZ };
      laterals.push(c);
    });
  });

  const shoe = cased.getPointAt(1);
  const wellfiTools = {
    insideIntermediate: toolAnchor(cased, WELLFI_INSIDE_INTERMEDIATE_PARAM, { z: TOOL_FACE_BIAS }),
    outsideIntermediate: toolAnchor(openHole, WELLFI_OUTSIDE_INTERMEDIATE_PARAM, { y: TOOL_BORE_LIFT }),
    belowPump: toolAnchor(cased, WELLFI_BELOW_PUMP_CASING_PARAM, { z: TOOL_FACE_BIAS }),
  };

  // Bore mouths: where bores pass from the notch into solid rock — the cased curve at the x = -1.6 wall
  // (approximated by its first point past x = -1.6 on the way to the heel is on the bench; the cased bore
  // actually rides the front face, so its mouth is where it meets the notch wall plane x = -1.6), and each
  // leg that crosses the back wall z = -0.6.
  const boreMouths = [];
  laterals.forEach((c, i) => {
    if (!c.userData.leavesNotch) return;
    const hit = crossing(c, NOTCH.minZ);
    if (hit) boreMouths.push({ id: `leg-${i}`, plane: 'back', ...hit });
  });
  // The cased string enters the notch through the x = -1.6 wall (spec §3: "name that bore mouth too") — the
  // hand-off the eye needs between the front-face casing and the heel (round 3).
  let casedBuried = null;
  {
    const hit = crossing(cased, NOTCH.minX, 200, 'x');
    if (hit) boreMouths.push({ id: 'cased', plane: 'left', r: RADII.cased, ...hit });
    // where the string leaves the front face (z < Z_FACE - r) and dives into rock: a rim there too, and the u-range
    // of the buried run for the ghost hairline (round 4)
    const dive = crossing(cased, Z_FACE - RADII.cased * 0.5, 200, 'z');
    if (dive) boreMouths.push({ id: 'cased-dive', plane: 'front', r: RADII.cased, ...dive });
    if (dive && hit) casedBuried = { u0: dive.u, u1: hit.u };
  }

  return { cased, openHole, laterals, shoe, wellhead, wellfiTools, boreMouths, casedBuried };
}

export function getWellFiPlacement(paths, view) {
  if (view === 'below-pump') return { ...paths.wellfiTools.belowPump, id: 'below-pump', label: 'WellFi', tone: 'primary' };
  if (view === 'outside-intermediate') return { ...paths.wellfiTools.outsideIntermediate, id: 'outside-intermediate', label: 'WellFi', tone: 'primary' };
  return { ...paths.wellfiTools.insideIntermediate, id: 'inside-intermediate', label: 'WellFi', tone: 'primary' };
}
