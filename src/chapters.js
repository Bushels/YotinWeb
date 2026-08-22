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
  { id: 'surface',    section: '.hero',              dwell: 1.0, world: { light: 1.0,  cutaway: 0.0, candle: 0.1,  field: 0.0, wind: 0.6, flow: 0.25, fog: 0.0 } },
  { id: 'descent',    section: '[data-chapter="descent"]',    dwell: 1.5, world: { light: 0.38, cutaway: 0.6, candle: 0.12, field: 0.0, wind: 0.2, flow: 0.3, fog: 0.02 } },
  { id: 'tool',       section: '[data-chapter="tool"]',       dwell: 1.4, world: { light: 0.24, cutaway: 0.85, candle: 0.12, field: 0.0, wind: 0.05, flow: 0.2, fog: 0.03 } },
  { id: 'signal',     section: '[data-chapter="signal"]',     dwell: 1.6, world: { light: 0.03, cutaway: 0.9, candle: 1.0,  field: 1.0, wind: 0.0, flow: 0.0, fog: 0.05 } }, // light 0.03 is this chapter's FIRST beat only — see CH3_LIGHT below, which ramps it to dusk for the surface hold
  { id: 'deployment', section: '#insight',           dwell: 1.5, world: { light: 0.32, cutaway: 0.95, candle: 0.15, field: 0.05, wind: 0.05, flow: 0.25, fog: 0.03 } },
  { id: 'yotin',      section: '#company',           dwell: 1.0, world: { light: 0.75, cutaway: 0.2, candle: 0.1,  field: 0.0, wind: 1.0, flow: 0.5, fog: 0.0 } },
  { id: 'fit',        section: '#contact',           dwell: 1.3, world: { light: 0.42, cutaway: 0.8, candle: 0.12, field: 0.2, wind: 0.15, flow: 0.25, fog: 0.02 } },
];

// Camera poses (9): one per chapter, two for signal (collar → the surface references once the circuit stage is
// in view), two for deployment.
//
// Round 12 re-anchor: the intermediate now lands just into the top of the pay and the collar moved UP the well
// with it, onto the EXPOSED front-face run of the cased string — the candle is at (-2.55, -2.55, 5.05), the
// shoe at (-0.95, -2.53, 4.20), the wellhead unchanged at (-5.2, 0.05, 5). Every pose below that frames the
// tool was re-authored against those landmarks with the offline projector (scratch/geo/pose-lab.mjs, same
// camera math as cameraRig.js): the pixel positions in each comment are measured, not guessed.
export const POSES = [
  { id: 'surface',      position: [27.8, 22.0, 30.9], target: [-1.8, -1.3, 2.2],  fov: 20, mobile: { position: [24.0, 22.5, 30.5], target: [-1.2, -3.2, 2.2], fov: 30 } },
  { id: 'descent',      position: [-0.25, 2.25, 15.5], target: [-5.32, -1.54, 5.26], fov: 30, mobile: { position: [0.5, 1.5, 16.5], target: [-3.84, 0.11, 4.52], fov: 36 } }, // the whole cased run reads: wellhead (752,225) in the free band above the copy, kop (758,445), the collar (1100,640) in the gap between the paragraph and the cards, the shoe (1364,637) clear of it — and the pay top crosses 20 px above the landed string (round 12); mobile: wellhead (49,428), collar (306,698) in the free stack below the copy
  { id: 'tool',         position: [-2.07, -2.16, 6.95], target: [-2.40, -2.57, 5.01], fov: 20, mobile: { position: [-2.42, -2.02, 7.69], target: [-2.55, -2.87, 5.12], fov: 30 } }, // the tool is now INSIDE the intermediate on the front cut face, so the close-up looks at the section from the front: tool 238→809 px, centred (520,430) in the free band between the channel cards and the spec tiles, clear of the chip panel (x > 855) and the Inspect button; the pay-top boundary reads 200 px above it. The orbit still pivots on the tool (toolViz.startOrbit) (round 12); mobile: tool 60→324 px in the 38 vh band
  { id: 'signal',       position: [4.1, 1.3, 13.2],   target: [-4.08, -2.0, 6.07], fov: 28, mobile: { position: [2.0, -0.4, 21.0], target: [-2.46, -5.2, 5.42], fov: 36 } }, // same eye as round 2 — re-aimed only, so the candle stays right of centre (1010,560) above the journey cards now that it lives on the face, with the wellhead (731,94) and the front-face return in frame; mobile: collar (196,214) in the 42 vh band
  // signal-b: while the Close-the-Circuit panel (left ≤ 60 %) is in view, the wellhead reference, the road and the
  // stake sit in the free right column; the camera looks across the pad from the front-left (round 4)
  // Round 19 (Kyle's second real-device walkthrough: "where you place the receiver on the pad, I can't visually
  // see it, would need a gap"). The DESKTOP endpoint is untouched — there the commission card is 60 % wide and
  // the circuit reads in the free right column (receiver measured at x 1084 of 1440). A phone has no free
  // column, only a free band, and the mobile endpoint had the receiver at fy 0.49 — dead centre, behind the
  // card. The MOBILE endpoint below is re-composed offline (scratch/r19/search-signalb.mjs, the projector in
  // scratch/r19/pose-lab.mjs validated against measured browser projections to ≤ 3 px) to put the whole circuit
  // in the lower band that world.css now opens under the card: the camera barely moves (1.4,12.0,19.5 →
  // 1.57,11.73,18.68), the aim lifts, and the fov closes 38 → 36. At poseProgress 4 — pinned for the whole
  // commissioning hold, exact 3.25–3.75 — the landmarks land at the same viewport FRACTIONS at every phone
  // geometry (440×956, 440×758, 390×844), because a fraction is what a pose controls:
  //     receiver fx 0.503 fy 0.778 · wellhead fx 0.304 fy 0.809 · chart bloom top fy 0.712
  // so the receiver stands centre-band, the loop runs down-left to the wellhead, and the bloom has air above it.
  { id: 'signal-b',     position: [1.0, 11.0, 16.0],  target: [-8.0, 0.0, 5.0],   fov: 28, mobile: { position: [1.57, 11.73, 18.68], target: [-5.16, 2.99, 2.18], fov: 36 } }, // the reading returns to surface: the camera lifts to the lease so the wellhead (V₁), the road and the ground stake (V₂) all read in the free right column — a road is only legible from above (pose search, round 5)
  // Round 19, item 2. DESKTOP untouched. The MOBILE endpoint is re-composed offline (scratch/r19/search-deploya.mjs)
  // so the fluid-level instrument is IN the picture on a phone: with CH4_HOLD pinning poseProgress at 5 for the
  // whole span the slider can be reached, this endpoint alone decides where the level rule sits, and it used to
  // sit off the left edge (level above-pump at fx 0.17 fy −0.03 — outside the frame on both axes at once).
  // After: the level's whole travel, the pump it is measured against and the wellhead above it read together in
  // the lower band world.css/tool.css now open under the controls, at the same viewport fractions everywhere:
  //     above-pump fy 0.638 · pump-off fy 0.762 (travel 94–119 px) · pump fy 0.773 · wellhead fy 0.500, fx ≈ 0.47
  // Nothing is lost: the collar/tool and the shoe were ALREADY outside the mobile chapter-4 frame (fx 1.36 and
  // 2.17 before, 1.40 and 1.89 after) — the phone's chapter-4 shot has always been the surface end of the string.
  { id: 'deployment-a', position: [-0.8, -0.4, 12.3], target: [-6.0, -2.1, 5.4],  fov: 26, mobile: { position: [-4.26, -1.83, 14.27], target: [-4.97, -0.15, 5.98], fov: 38 } }, // the instrument: cased string u 0.3–0.55 on the front face, landing right of centre (round 2)
  { id: 'deployment-b', position: [4.6, 1.2, 15.8],   target: [0.6, -2.5, 2.4],   fov: 28, mobile: { position: [4.0, 2.0, 21.0], target: [0.4, -2.8, 2.4], fov: 38 } },
  { id: 'yotin',        position: [-6.5, 8.0, 15.0],  target: [-4.6, -0.3, 3.6],  fov: 34, mobile: { position: [-6.0, 5.8, 19.5], target: [-4.6, -1.2, 3.6], fov: 44 } }, // the pad + wind in the upper 60 vh band, paper below (round 2) // lower, flatter: the island low in the rise band, strokes read as wind over the pad (round 2)
  { id: 'fit',          position: [-3.0, 1.5, 17.0],  target: [-4.95, -2.56, 5.0],  fov: 26, mobile: { position: [-2.6, 1.9, 20.5], target: [-3.23, -2.94, 5.16], fov: 36 } }, // the same eye as round 6, re-aimed for the round-12 anchors: all three proposed placements sit in the free right column — the authored default inside the intermediate (1090,470), below-pump further up the string, and the below-shoe/open-hole anchor past the shoe (1333,438) — so the verdict's candle never lands behind the qualifier column; mobile: collar (250,390)
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
// Chapter 2 on a phone (round 16, Kyle's first real-device audit: "you scroll past some parts of say the Flow
// insight at the tool to Inspect the tool and you cannot see the tool"). The tool chapter's DOM is ONE screen on
// a laptop (945 px against a 900 px viewport at 1440×900) and TWO AND A QUARTER on a phone (1832–1883 px against
// 758–956) — the five channel cards, the four volume chips and the Inspect row cannot sit side by side there, so
// they stack. The pose map spreads 2 → 3 linearly across that whole span, so the local progress at which the
// visitor reaches each control is a function of viewport height, and the two platforms are simply out of phase:
//
//   station              1440×900        440×956        440×758 (real Safari, bar out)
//   Inspect centred      local 0.10      local 0.56     local 0.60
//   tool on screen       864 px tall     155 px         112 px
//
// By the chapter's ONE INVITED ACTION the phone camera is 56–60 % of the way to the next chapter's pose — a wide
// shot 21 units back at fov 36 — so the subject of the chapter is a sliver behind the last card. The fix is the
// hold this file already uses twice (the deployment hold at 4 → 4.8, the commissioning hold at CH3_LIGHT): the
// tool pose is HELD while the tool's own controls are being read, and the flight to the collar happens over the
// tail, under the spec tiles and the signal strip — copy that does not refer to the tool.
//
// The knot is measured, not guessed. Across 390×844, 430×932, 440×956, 440×758 and 440×855 the stations land at
// local 0.35–0.39 (CH-05 "Flow Insight" centred), 0.56–0.60 (Inspect centred) and 0.755–0.769 (the spec grid
// arriving) — so the hold has to outlast 0.60 and hand over at the spec grid, not before it.
const CH2_HOLD = 0.72;

// Chapter 4 on a phone (round 19, Kyle's second real-device walkthrough: "Same with the fluid level slider, I
// can't see the fluid level on mobile"). Exactly the same knot as chapter 2, one chapter later and worse:
// chapter 4 carries #insight + benefits + FAQ, which is 3.4–4.3 viewports on a phone against ~1.6 on a laptop,
// and its pose interpolation (deployment-a → deployment-b, a close section → a wide slice 21 units back) is
// spread across that whole span. Measured at 440×956 with the level held at above-pump, the level rule drifts
// 250 px down-screen across the span in which the slider can be reached — a moving target under a moving
// camera — on top of being off-frame to the left (that part is the endpoint's own composition, re-authored in
// POSES below). The stations, measured across 440×956 / 440×758 / 390×844 (scratch/r19/station2.mjs):
//
//   station                     440×956     440×758     390×844
//   fluid slider centred        local 0.141  0.174       0.158
//   world band leaves the fold  local 0.394  0.383       0.383
//   benefits grid peeks in      local 0.229  0.276       0.260
//   FAQ peeks in                local 0.599  0.653       0.635
//
// So the hold has to outlast 0.394 and hand over before the FAQ — the same shape as CH2_HOLD, and it keeps the
// spec §4 promise that chapter 4's interpolation completes before the FAQ with the world at rest under it.
// 0.58 and not 0.60: the earliest FAQ arrival measured is 0.599, and "before" has to mean before at every
// geometry, not to four decimal places at one of them.
// Desktop keeps its authored 0 → 0.55 move exactly (guarded by test/mobile-window.test.js).
const CH4_HOLD = 0.38;
const CH4_MOVE_END = 0.58;

// `mobile` is the viewport predicate boot.js already owns (innerWidth ≤ 820). Desktop is untouched: called with
// one argument this function is exactly what it was for fifteen rounds.
export function poseProgress(p, mobile = false) {
  if (mobile && p > 2 && p < 3) {
    const l = p - 2;
    if (l <= CH2_HOLD) return 2;                                    // the tool holds while its own controls are read
    const u = (l - CH2_HOLD) / (1 - CH2_HOLD);
    return 2 + u * u * (3 - 2 * u);                                 // smoothstep out, so the departure is a swing and not a snap
  }
  if (p <= 3) return p;
  if (p < 4) {
    const l = p - 3;
    if (l < 0.25) return 3 + l / 0.25;   // signal → signal-b: complete by the time the circuit stage is centred (p ≈ 3.26)
    if (l < 0.75) return 4;              // hold on the surface references while the instrument is used
    return 4 + (l - 0.75) / 0.25;        // signal-b → deployment-a: continuous into chapter 4
  }
  if (p < 4.8) {
    const l = p - 4;
    if (mobile) {                                                   // the phone holds the instrument while the instrument is used (round 19)
      if (l <= CH4_HOLD) return 5;
      const u = Math.min(1, (l - CH4_HOLD) / (CH4_MOVE_END - CH4_HOLD));
      return 5 + u * u * (3 - 2 * u);                                // smoothstep out, so the departure is a swing and not a snap
    }
    return 5 + Math.min(1, l / 0.55);                                // deployment-a → -b, held through benefits + FAQ
  }
  if (p < 5.3) return 6 + (p - 4.8) / 0.5;   // the rise begins under the FAQ's smoked scrim and completes a third of the way down the band
  if (p < 5.8) return 7;                       // hold the pad + wind while the paper is read
  return 7 + Math.min(1, (p - 5.8) / 0.2);     // ease into fit
}

// The chapter-3 light rises WITH THE POSE (round 12d). One channel value cannot serve both halves of this
// chapter: the first beat is the collar close-up, authored as the darkest frame on the site so the candle is
// unambiguously the brightest thing in it; but by the commissioning hold (poseProgress has moved to signal-b,
// the camera at surface) the visitor is being asked to SEE a footprint on the pad and put a receiver on it, and
// 0.03 renders that lease as a void. The curve below is keyed to chapter-LOCAL progress, and its endpoints are
// the ledger's own values (0.03 at l = 0, chapter 4's 0.32 at l = 1), so the blend either side stays continuous.
//
// The knots are measured, not guessed: the chapter ANCHOR (which frames.mjs captures as ch3, and which the
// candle gate reads) sits at l = 0, and the commissioning card centres at l = 0.215 — so the ramp has to be
// finished by 0.20, not merely started.
//
//   l ≤ 0.05   0.03  the collar reveal — untouched; the darkest-frame contract lives here
//   l = 0.18   0.30  signal-b has arrived (the pose completes at l = 0.25): pad, tanks, road, footprint read as dusk
//                    (phones centre the card at l = 0.095, where the pose is still mid-move and only a ~55 px
//                     strip of world shows above the card — it reads at ~0.12 there, dusk-ward but not full)
//   l ≤ 0.80   0.30  held through the commissioning act and the acquire beat
//   l = 1.00   0.32  hands to chapter 4 at chapter 4's own value
const CH3_LIGHT = [[0, 0.03], [0.05, 0.03], [0.18, 0.30], [0.8, 0.30], [1, 0.32]];

// The chapter-2 light holds WITH THE POSE on phones (round 16) — the exact mirror of CH3_LIGHT above, and needed
// for the same reason. Holding the camera on the tool is not enough if the key fades out from under it: the
// ledger ramps light 0.24 → 0.03 linearly across chapter 2, so the frame the mobile tool pose was authored
// against (0.240) is down to 0.114 by the Inspect control and 0.081 at the spec grid — 2.1× and 3× darker than
// the frame that was signed off. On a laptop this never showed because the whole chapter is read at local ≤ 0.25.
// Endpoints are the ledger's own values (0.24 at l = 0, chapter 3's 0.03 at l = 1) so the blend is continuous on
// both sides and chapter 3 still opens on the darkest frame on the site — the one-candle contract is untouched.
const CH2_LIGHT = [[0, 0.24], [CH2_HOLD, 0.24], [1, 0.03]];
function curveAt(table, l) {
  for (let i = 1; i < table.length; i++) {
    const [x1, y1] = table[i], [x0, y0] = table[i - 1];
    if (l <= x1) { const u = x1 === x0 ? 1 : (l - x0) / (x1 - x0); return y0 + (y1 - y0) * u * u * (3 - 2 * u); }
  }
  return table[table.length - 1][1];
}
export function chapter3Light(local) { return curveAt(CH3_LIGHT, Math.min(1, Math.max(0, local))); }
export function chapter2Light(local) { return curveAt(CH2_LIGHT, Math.min(1, Math.max(0, local))); }

// Interpolate adjacent chapter channel values.
const lerp = (a, b, t) => a + (b - a) * t;
export function worldAt(p, mobile = false) {
  const i = Math.min(CHAPTERS.length - 2, Math.max(0, Math.floor(p)));
  const t = Math.min(1, Math.max(0, p - i));
  const a = CHAPTERS[i].world, b = CHAPTERS[Math.min(CHAPTERS.length - 1, i + 1)].world;
  const out = {};
  for (const k of Object.keys(a)) out[k] = lerp(a[k], b[k] ?? a[k], t);
  if (i === 3) out.light = chapter3Light(t);
  if (i === 2 && mobile) out.light = chapter2Light(t);
  return out;
}

// Resolve the DOM anchor element for each chapter (falls back to the previous one if missing).
export function chapterElements() {
  let prev = document.body;
  return CHAPTERS.map((c) => { const el = document.querySelector(c.section) || prev; prev = el; return el; });
}
