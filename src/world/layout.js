// World layout — the geometric single source of truth for the Yotin/WellFi world.
// Ported from the WellFi island (wellfi-marketing/site/src/lib/island/layout.ts) and converted to the
// Clearwater "bench" topology per docs/superpowers/specs/2026-08-19-yotin-threejs-world-design.md §3.
//
// Y-up. Slab top (grass) = y 0. Front cut face = z +5. One topology only: a solid slab with a rectangular
// 90° notch cut from the front-right corner down to the pay bench. No dish, no floor mesh, no rubble.

export const SLAB = { minX: -7, maxX: 7, minZ: -5, maxZ: 5, baseY: -4.4 };

// The notch (plan). Opens to the front (z = +5) and right (x = +7) faces.
export const NOTCH = { minX: -1.6, maxX: 7, minZ: -0.6, maxZ: 5 };

// Stratigraphic boundary at the top of the pay, and the bench elevation the notch is cut to.
// Every open-hole bore centreline lies on the bench plane.
export const PAY_TOP = -2.4;
export const BENCH_Y = PAY_TOP - 0.15; // -2.55

// Clearwater column (Kyle's website lock, 2026-06-22). Names only — no metres are printed anywhere.
// Colours follow the Bluesky-derived material discipline (near-black wet bitumen pay, sharp cut, no bevels).
export const STRATA = [
  { name: 'topsoil',        label: 'Boreal topsoil',        topY: 0.0,   bottomY: -0.35, color: '#3f5a2e', roughness: 0.95 },
  { name: 'colorado',       label: 'Colorado Shale (seal)', topY: -0.35, bottomY: -1.5,  color: '#6f787e', roughness: 0.9,  bed: { freq: 38, depth: 0.34, phase: 0.0 } },
  { name: 'upperSand',      label: 'Clearwater Upper Sand', topY: -1.5,  bottomY: -2.1,  color: '#a8874f', roughness: 0.92, bed: { freq: 22, depth: 0.24, phase: 1.1 } },
  { name: 'middleMudstone', label: 'Middle Mudstone',       topY: -2.1,  bottomY: PAY_TOP, color: '#4a4540', roughness: 0.88, bed: { freq: 44, depth: 0.3, phase: 0.6 } },
  { name: 'lowerSand',      label: 'Clearwater Lower Sand', topY: PAY_TOP, bottomY: -3.6, color: '#2b1e14', roughness: 0.45, bed: { freq: 26, depth: 0.22, phase: 2.3 } },
];
export const LOWER = { name: 'ellerslie', label: 'Ellerslie', topY: -3.6, bottomY: SLAB.baseY, color: '#241a10', roughness: 0.6, bed: { freq: 20, depth: 0.28, phase: 0.6 } };

// The Colorado seal band — the conductive bed that flattens and dims the field above it (spec §3, field).
export const SEAL = { topY: STRATA[1].topY, bottomY: STRATA[1].bottomY };

// Plan outline of the solid cap above the bench: slab rect minus the notch (single concave ring, 6 pts).
export const CAP_OUTLINE = [
  [-7, -5], [7, -5], [7, NOTCH.minZ], [NOTCH.minX, NOTCH.minZ], [NOTCH.minX, 5], [-7, 5],
];

// Lease pad + road exclusion rects (forest never plants here). Unchanged from the island.
export const PAD_RECT = { minX: -6.3, maxX: -3.8, minZ: 2.6, maxZ: 5.0 };
export const ROAD_RECT = { minX: -4.6, maxX: -4.0, minZ: -5.0, maxZ: 2.6 };

export function inNotch(x, z) {
  return x > NOTCH.minX && x <= NOTCH.maxX && z > NOTCH.minZ && z <= NOTCH.maxZ;
}

const EDGE_MARGIN = 0.4;
export function onCap(x, z) {
  return (
    x > SLAB.minX + EDGE_MARGIN && x < SLAB.maxX - EDGE_MARGIN &&
    z > SLAB.minZ + EDGE_MARGIN && z < SLAB.maxZ - EDGE_MARGIN && !inNotch(x, z)
  );
}

// Palette. Cyan is transmission only; ember is Yotin's surface warmth; sand is readable light.
export const COLORS = {
  emCyan: '#06B6D4',
  emGlow: '#22D3EE',
  ember: '#f27622',
  sand: '#e8dcc8',
  casing: '#6b7d8a',
  casingShell: '#7dd3e8',
  trough: '#0f0a07',      // dark rock-walled open-hole bore (negative), not a pipe — darker than the bench (#3a2a1e)
  boreRim: '#241911',     // rock lip along an exposed bore — ≈ 0.6× the bench albedo so the slot reads as shadow, not a sand strip
  void: '#03070b',
  sunWarm: '#ffd9a8',
  goldenHour: '#ffc98a',
  skyFill: '#bfd9e8',
  ground: '#1a130b',
};
