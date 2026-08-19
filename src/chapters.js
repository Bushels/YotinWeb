// Chapter ledger (spec §4) — the single data contract for DOM anchors, world channels and camera poses.
// Positions are in world units (see world/layout.js). Desktop and mobile poses are authored separately; when
// a mobile pose exists the rig skips its emergency tall-aspect pullback. Chapter 4 (deployment) has two poses:
// close ghost-tubing → wider slice, interpolated over the first 55 % of the chapter, then held (world at rest
// under the FAQ).
//
// world channels: light 0..1 (chapter light × ambient cycle) · cutaway 0..1 (casing shell → 28 %) ·
// candle 0..1 (collar glow) · field 0..1 (section-plane field reveal) · wind 0..1 · flow 0..1 (chevrons) ·
// fog 0..1
export const CHAPTERS = [
  { id: 'surface',    section: '.hero',              dwell: 1.0, world: { light: 0.85, cutaway: 0.0, candle: 0.1,  field: 0.0, wind: 0.6, flow: 0.25, fog: 0.0 } },
  { id: 'descent',    section: '[data-chapter="descent"]',    dwell: 1.5, world: { light: 0.38, cutaway: 0.6, candle: 0.12, field: 0.0, wind: 0.2, flow: 0.3, fog: 0.02 } },
  { id: 'tool',       section: '[data-chapter="tool"]',       dwell: 1.4, world: { light: 0.24, cutaway: 0.85, candle: 0.12, field: 0.0, wind: 0.05, flow: 0.2, fog: 0.03 } },
  { id: 'signal',     section: '[data-chapter="signal"]',     dwell: 1.6, world: { light: 0.03, cutaway: 0.9, candle: 1.0,  field: 1.0, wind: 0.0, flow: 0.0, fog: 0.05 } },
  { id: 'deployment', section: '#insight',           dwell: 1.5, world: { light: 0.32, cutaway: 0.95, candle: 0.15, field: 0.05, wind: 0.05, flow: 0.25, fog: 0.03 } },
  { id: 'yotin',      section: '#company',           dwell: 1.0, world: { light: 0.75, cutaway: 0.2, candle: 0.1,  field: 0.0, wind: 1.0, flow: 0.5, fog: 0.0 } },
  { id: 'fit',        section: '#contact',           dwell: 1.3, world: { light: 0.42, cutaway: 0.8, candle: 0.12, field: 0.2, wind: 0.15, flow: 0.25, fog: 0.02 } },
];

// Camera poses (9): one per chapter, two for signal (collar → the surface references once the circuit stage is in view), two for deployment. Targets: the candle at the heel ≈ (-0.67,-2.43,3.32)
// (chapters 2 and 4 aim here — the tool lives at the open-hole anchor), wellhead (-5.2, 0.05, 5).
export const POSES = [
  { id: 'surface',      position: [27.8, 22.0, 30.9], target: [-1.8, -1.3, 2.2],  fov: 20, mobile: { position: [24.0, 22.5, 30.5], target: [-1.2, -3.2, 2.2], fov: 30 } },
  { id: 'descent',      position: [-0.2, 2.3, 15.2],  target: [-4.9, -1.2, 5.0],  fov: 28, mobile: { position: [-0.6, 1.4, 16.5], target: [-4.9, -2.4, 5.0], fov: 38 } },
  { id: 'tool',         position: [0.55, -1.9, 5.3],  target: [-0.55, -2.45, 3.3], fov: 18, mobile: { position: [1.35, -1.95, 7.8], target: [-0.55, -3.15, 3.3], fov: 34 } }, // mobile: the tool fills its 38 vh band rather than sitting tiny at its top edge (round 5)
  { id: 'signal',       position: [4.1, 1.3, 13.2],   target: [-2.8, -1.75, 4.0], fov: 28, mobile: { position: [2.0, -0.4, 21.0], target: [-0.6, -5.4, 3.2], fov: 36 } }, // collar right of centre AND the wellhead/front-face return in frame (round 2); mobile: collar in the 42 vh band
  // signal-b: while the Close-the-Circuit panel (left ≤ 60 %) is in view, the wellhead reference, the road and the
  // stake sit in the free right column; the camera looks across the pad from the front-left (round 4)
  { id: 'signal-b',     position: [1.0, 11.0, 16.0],  target: [-8.0, 0.0, 5.0],   fov: 28, mobile: { position: [1.4, 12.0, 19.5], target: [-7.4, -0.6, 5.0], fov: 38 } }, // the reading returns to surface: the camera lifts to the lease so the wellhead (V₁), the road and the ground stake (V₂) all read in the free right column — a road is only legible from above (pose search, round 5)
  { id: 'deployment-a', position: [-0.8, -0.4, 12.3], target: [-6.0, -2.1, 5.4],  fov: 26, mobile: { position: [-1.6, -1.2, 12.5], target: [-4.4, -3.4, 5.2], fov: 34 } }, // the instrument: cased string u 0.3–0.55 on the front face, landing right of centre (round 2)
  { id: 'deployment-b', position: [4.6, 1.2, 15.8],   target: [0.6, -2.5, 2.4],   fov: 28, mobile: { position: [4.0, 2.0, 21.0], target: [0.4, -2.8, 2.4], fov: 38 } },
  { id: 'yotin',        position: [-6.5, 8.0, 15.0],  target: [-4.6, -0.3, 3.6],  fov: 34, mobile: { position: [-6.0, 5.8, 19.5], target: [-4.6, -1.2, 3.6], fov: 44 } }, // the pad + wind in the upper 60 vh band, paper below (round 2) // lower, flatter: the island low in the rise band, strokes read as wind over the pad (round 2)
  { id: 'fit',          position: [1.6, -0.3, 12.8],  target: [-3.0, -2.3, 4.4],  fov: 30, mobile: { position: [1.8, 0.2, 16.5], target: [-2.1, -2.7, 4.4], fov: 44 } }, // mobile: heel + collar inside the band, not cropped at the right edge (round 5)
];

export const CHAPTER_IDS = CHAPTERS.map((c) => c.id);

// Map conductor progress (0..6, fractional) to pose progress (0..7). Chapter 4 spans poses 4→5 over its
// first 55 %, then holds pose 5 through the FAQ; chapters 5 and 6 map to poses 6 and 7.
// Continuous piecewise map (round 3: a hard cut 5 → 6 at p = 5 snapped the camera at the #company anchor):
//   3 → 5 : signal → signal-b over the first 25 % of chapter 3 (by which point the circuit stage is centred), held to 75 %,
//            then signal-b → deployment-a over the last quarter so poseProgress(4) is 5 from BOTH sides
//   4 → 5 : deployment-a → deployment-b over the first 55 % of chapter 4, held through benefits + FAQ
//   4.8 → 5.3: the RISE — deployment-b → yôtin, beginning under the FAQ scrim and landing a third of the way into the band
//   5.3 → 5.8: hold the pad + wind while the paper is read
//   5.8 → 6: ease into fit
export function poseProgress(p) {
  if (p <= 3) return p;
  if (p < 4) {
    const l = p - 3;
    if (l < 0.25) return 3 + l / 0.25;   // signal → signal-b: complete by the time the circuit stage is centred (p ≈ 3.26)
    if (l < 0.75) return 4;              // hold on the surface references while the instrument is used
    return 4 + (l - 0.75) / 0.25;        // signal-b → deployment-a: continuous into chapter 4
  }
  if (p < 4.8) { const l = p - 4; return 5 + Math.min(1, l / 0.55); } // deployment-a → -b, held through benefits + FAQ
  if (p < 5.3) return 6 + (p - 4.8) / 0.5;   // the rise begins under the FAQ's smoked scrim and completes a third of the way down the band
  if (p < 5.8) return 7;                       // hold the pad + wind while the paper is read
  return 7 + Math.min(1, (p - 5.8) / 0.2);     // ease into fit
}

// Interpolate adjacent chapter channel values.
const lerp = (a, b, t) => a + (b - a) * t;
export function worldAt(p) {
  const i = Math.min(CHAPTERS.length - 2, Math.max(0, Math.floor(p)));
  const t = Math.min(1, Math.max(0, p - i));
  const a = CHAPTERS[i].world, b = CHAPTERS[Math.min(CHAPTERS.length - 1, i + 1)].world;
  const out = {};
  for (const k of Object.keys(a)) out[k] = lerp(a[k], b[k] ?? a[k], t);
  return out;
}

// Resolve the DOM anchor element for each chapter (falls back to the previous one if missing).
export function chapterElements() {
  let prev = document.body;
  return CHAPTERS.map((c) => { const el = document.querySelector(c.section) || prev; prev = el; return el; });
}
