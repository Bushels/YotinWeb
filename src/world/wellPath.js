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

export const WELLFI_VIEW_IDS = ['outside-intermediate', 'below-pump'];
export const DEFAULT_WELLFI_VIEW = 'outside-intermediate';
export const WELLFI_BELOW_PUMP_CASING_PARAM = 0.5;   // inside the 7-in string
export const WELLFI_OUTSIDE_INTERMEDIATE_PARAM = 0.03; // on the open-hole trunk at the heel

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

function toolAnchor(curve, param) {
  return { position: curve.getPointAt(param), tangent: curve.getTangentAt(param).normalize().clone() };
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
  const heel = v(-0.9, BENCH_Y + 0.12, 3.4);
  const cased = new CatmullRomCurve3([
    wellhead.clone(), v(-5.2, -0.9, Z_FACE), v(-5.08, -1.7, Z_FACE), v(-4.45, -2.25, Z_FACE), v(-3.1, heel.y, 4.6), heel.clone(),
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
    outsideIntermediate: toolAnchor(openHole, WELLFI_OUTSIDE_INTERMEDIATE_PARAM),
    belowPump: toolAnchor(cased, WELLFI_BELOW_PUMP_CASING_PARAM),
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
  {
    const hit = crossing(cased, NOTCH.minX, 200, 'x');
    if (hit) boreMouths.push({ id: 'cased', plane: 'left', r: RADII.cased, ...hit });
  }

  return { cased, openHole, laterals, shoe, wellhead, wellfiTools, boreMouths };
}

export function getWellFiPlacement(paths, view) {
  if (view === 'below-pump') return { ...paths.wellfiTools.belowPump, id: 'below-pump', label: 'WellFi', tone: 'primary' };
  return { ...paths.wellfiTools.outsideIntermediate, id: 'outside-intermediate', label: 'WellFi', tone: 'primary' };
}
