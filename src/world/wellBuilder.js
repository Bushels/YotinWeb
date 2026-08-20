// Chapter 6 — fit (spec §4 row 6). Re-poses the world from the qualifier's NORMALIZED schematic state only:
//   { lift, fluid, temp, hasLength, landing, verdict } — never a typed number, never raw text (spec §0).
// Everything here is additive and reversible: a rod-pump beam built from three boxes, a distinct pump marker,
// the relative 0.9 standoff line, a fluid tint on the flow chevrons, a subtle temperature treatment on the
// tool, and the verdict beat (candle up / tool dims). Nothing is added to island.js — the tool's per-frame
// update is wrapped so the candle boost / dim ride on the chapter's own candle channel.
//
// Budget note (spec §6): this module is imported statically by src/ui/fit.js (ui bucket) and therefore imports
// NOTHING from 'three' or the world modules — the world chunk must stay one chunk. The three.js classes it needs
// come in as `THREE` (boot's world API when it exposes one, else threeFromWorld() below derives them from the
// live scene objects), and the few world constants it needs are restated here.
const SAND = '#e8dcc8';          // layout.COLORS.sand
const SAND_FLOW = '#d9c39a';     // island.SAND_FLOW
const R_CASED = 0.100;           // wellPath.RADII.cased
export const FLUID_TINT = { heavy: SAND_FLOW, light: '#e9dcc0', gas: '#c9d4da', thermal: SAND_FLOW };
export const FOG_WARM = '#140c07';
// Cased-string parameter of the answered pump band. These must BRACKET the standoff line: "deeper" means the
// pump is landed below it (the whole reason WellFi is proposed outside the intermediate) and "shallower" above.
// Round 9: deeper was 0.9 — exactly ON the standoff line, so the one spatial relation chapter 6 exists to show
// was unreadable, and the 3D disagreed with the PNG schematic (src/ui/fit.js:108 uses 0.96 / 0.42).
export const PUMP_U = { shallower: 0.42, deeper: 0.96 };
export const STANDOFF_U = 0.9;                     // relative — "10 % of intermediate" above the shoe
const WITNESS_COOL = '#d9e5ef', WITNESS_WARM = '#e6c9a6';
const DEFAULT_VIEW = 'inside-intermediate';        // wellPath.DEFAULT_WELLFI_VIEW (restated: no world imports here)

// Derive the handful of three.js classes from objects the island already holds (no 'three' import here).
export function threeFromWorld(island) {
  const shoe = island.well.shoe;
  const box = island.pad.drive.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry');
  const band = island.tool.group.getObjectByName('collar-band');
  const TorusGeometry = shoe.geometry.constructor;
  return {
    Group: island.root.constructor,
    Mesh: shoe.constructor,
    TorusGeometry,
    BoxGeometry: box.geometry.constructor,
    MeshStandardMaterial: shoe.material.constructor,
    MeshBasicMaterial: band.material.constructor,
    Vector3: island.paths.wellhead.constructor,
    Quaternion: island.tool.group.quaternion.constructor,
    Color: shoe.material.color.constructor,
  };
}

export function createWellBuilder(island, THREE, { scene = null } = {}) {
  const T = THREE && THREE.Mesh ? THREE : threeFromWorld(island);
  const parent = island.parallax || island.root;
  const paths = island.paths;
  const cased = paths.cased;
  const X = new T.Vector3(1, 0, 0), Z = new T.Vector3(0, 0, 1);

  // --- rod pump: samson post, walking beam, horsehead (3 boxes, 36 tris) at the pad, over the wellhead.
  const steel = new T.MeshStandardMaterial({ color: '#aab4ba', roughness: 0.45, metalness: 0.7 });
  const beamPump = new T.Group();
  beamPump.name = 'rod-pump-beam';
  beamPump.position.set(paths.wellhead.x, 0, paths.wellhead.z - 0.45);
  const post = new T.Mesh(new T.BoxGeometry(0.08, 0.72, 0.08), steel); post.position.y = 0.36;
  const beam = new T.Mesh(new T.BoxGeometry(0.07, 0.06, 0.86), steel); beam.position.set(0, 0.74, 0.14); beam.rotation.x = 0.16;
  const head = new T.Mesh(new T.BoxGeometry(0.1, 0.18, 0.1), steel); head.position.set(0, 0.62, 0.52);
  beamPump.add(post, beam, head);
  beamPump.visible = false;
  parent.add(beamPump);

  // --- pump marker: a distinct steel ring (double band, brighter than the shoe) + a sand hairline ring.
  const marker = new T.Group();
  marker.name = 'pump-marker';
  const ringMat = new T.MeshStandardMaterial({ color: '#eef4f8', roughness: 0.3, metalness: 0.9 });
  const ringGeom = new T.TorusGeometry(R_CASED * 1.55, 0.024, 8, 28);
  const r1 = new T.Mesh(ringGeom, ringMat); r1.position.z = -0.045;
  const r2 = new T.Mesh(ringGeom, ringMat); r2.position.z = 0.045;
  const sandMat = new T.MeshBasicMaterial({ color: SAND, transparent: true, opacity: 0.85, depthTest: false, depthWrite: false, toneMapped: false });
  const sandRing = new T.Mesh(new T.TorusGeometry(R_CASED * 1.55, 0.006, 6, 40), sandMat);
  sandRing.renderOrder = 26;
  marker.add(r1, r2, sandRing);
  marker.visible = false;
  parent.add(marker);

  // --- standoff line: dashed sand hairline across the casing at cased u = 0.9 (relative, no numbers).
  // Seven flat dashes (thin boxes) rather than GL lines so the dash reads at any pixel ratio.
  const standoff = new T.Group();
  standoff.name = 'standoff-line';
  const dashGeom = new T.BoxGeometry(0.06, 0.008, 0.004);
  for (let i = 0; i < 7; i++) { const d = new T.Mesh(dashGeom, sandMat); d.position.x = -0.39 + i * 0.13; d.renderOrder = 26; standoff.add(d); }
  {
    const p = cased.getPointAt(STANDOFF_U), t = cased.getTangentAt(STANDOFF_U).normalize();
    const across = new T.Vector3().crossVectors(t, Z).normalize();
    if (across.lengthSq() < 1e-6) across.set(1, 0, 0);
    standoff.position.copy(p);
    standoff.position.z += 0.02;
    standoff.quaternion.setFromUnitVectors(X, across);
  }
  standoff.visible = false;
  parent.add(standoff);

  function placeMarker(band) {
    const u = PUMP_U[band];
    if (u == null) { marker.visible = false; return; }
    marker.position.copy(cased.getPointAt(u));
    marker.quaternion.setFromUnitVectors(Z, cased.getTangentAt(u).normalize());
    marker.visible = true;
  }

  // --- tool: witness capsule + halo handles, and the wrapped update (candle boost / dim, collar glide).
  const tool = island.tool;
  const witness = tool.group.children.find((c) => c.geometry && c.geometry.type === 'CapsuleGeometry') || null;
  const halo = tool.halo;
  const origUpdate = tool.update;
  const glide = { active: false, t: 0, from: new T.Vector3(), to: new T.Vector3(), q0: new T.Quaternion(), q1: new T.Quaternion() };
  const cur = { boost: 0, scale: 1 };
  const target = { boost: 0, scale: 1 };
  let dimHalo = false;
  // Time-based easing, not per-frame: a fixed 0.06 step takes ~1 s at 60 fps and ~20 s on a software renderer or a
  // slow phone, so the verdict's candle appeared not to light at all on slow devices (round 5).
  let lastEase = 0;
  tool.update = function wrappedUpdate(candle, focus) {
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    const dt = lastEase ? Math.min(0.25, Math.max(0, now - lastEase)) : 1 / 60;
    lastEase = now;
    const ease = 1 - Math.exp(-3.6 * dt);
    cur.boost += (target.boost - cur.boost) * ease;
    cur.scale += (target.scale - cur.scale) * ease;
    origUpdate.call(tool, Math.min(1, candle * cur.scale + cur.boost), focus);
    if (dimHalo && halo && halo.material) halo.material.opacity = Math.min(halo.material.opacity, 0.05);
    if (glide.active) {
      glide.t = Math.min(1, glide.t + Math.max(1 / 90, dt * 1.6)); // time-based: ~0.6 s regardless of frame rate
      const e = glide.t < 0.5 ? 2 * glide.t * glide.t : 1 - Math.pow(-2 * glide.t + 2, 2) / 2;
      tool.group.position.lerpVectors(glide.from, glide.to, e);
      tool.group.quaternion.slerpQuaternions(glide.q0, glide.q1, e);
      island.field.setCollar(tool.group.position);
      if (glide.t >= 1) glide.active = false;
    }
  };

  // Collar glides separately into the proposed configuration (island.setView snaps; we ease from the old pose).
  function anchorFor(view) {
    if (view === 'below-pump') return paths.wellfiTools.belowPump;
    if (view === 'outside-intermediate') return paths.wellfiTools.outsideIntermediate;
    return paths.wellfiTools.insideIntermediate;
  }
  function moveTool(view) {
    if (island.state.view === view) return;
    glide.from.copy(tool.group.position); glide.q0.copy(tool.group.quaternion);
    island.setView(view);
    const a = anchorFor(view);
    glide.to.copy(a.position);
    glide.q1.setFromUnitVectors(X, a.tangent);
    tool.group.position.copy(glide.from); tool.group.quaternion.copy(glide.q0);
    glide.t = 0; glide.active = true;
  }

  const drive = island.pad && island.pad.drive;
  const driveBox = drive && drive.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry');
  const fogBase = scene && scene.fog ? scene.fog.color.clone() : null;
  const fogWarm = new T.Color(FOG_WARM);
  const trunk = island.materials.trunkFlow, legs = island.materials.legFlow;

  function applyLift(lift) {
    // pcp / unanswered: the PCP drive head as built; rod: the beam instead; esp / flow: wellhead only.
    if (drive) drive.visible = lift == null || lift === 'pcp';
    beamPump.visible = lift === 'rod';
    if (driveBox && driveBox.material && driveBox.material.emissive) {
      driveBox.material.emissive.set(SAND);
      driveBox.material.emissiveIntensity = lift === 'pcp' ? 0.12 : 0;
    }
  }
  function applyFluid(fluid) {
    const tint = FLUID_TINT[fluid] || SAND_FLOW;
    trunk.uniforms.uFlowColor.value.set(tint);
    legs.uniforms.uFlowColor.value.set(tint);
    if (scene && scene.fog && fogBase) scene.fog.color.copy(fogBase).lerp(fogWarm, fluid === 'thermal' ? 1 : 0);
  }
  function applyTemp(temp, verdict) {
    const over = temp === 'over' || verdict === 'future';
    // Above the rating there is no product to light: the collar goes dark rather than dim, so an unavailable
    // configuration never appears to transmit (round 5).
    target.scale = over ? 0 : 1;
    dimHalo = over;
    if (witness && witness.material) witness.material.color.set(over ? WITNESS_WARM : WITNESS_COOL);
  }
  // Coupling: the caption for a shallower landing says "inside casing — attenuated coupling", so the world has to
  // show it. Steel around the emitter shorts a large part of the dipole; open hole couples straight into the
  // formation. This is the ratio the candle and the field are scaled by (round 7, engineering-truth review).
  // 'inside-intermediate' is the authored landing-page placement (round 11) and is steel-shorted like
  // 'below-pump': both sit on the tubing inside the intermediate.
  const COUPLING = { 'inside-intermediate': 0.45, 'below-pump': 0.45, 'outside-intermediate': 1 };
  let coupling = 1;
  function applyLanding(landing, hasLength) {
    standoff.visible = Boolean(hasLength) || Boolean(landing);
    placeMarker(landing);
    // Unanswered means unanswered: with no landing the collar stays at the AUTHORED landing-page placement —
    // inside the intermediate (round 11). Before this it fell through to 'outside-intermediate' on every reset,
    // so the world quietly proposed the open-hole configuration to a visitor who had answered nothing.
    const view = landing == null ? DEFAULT_VIEW : (landing === 'shallower' ? 'below-pump' : 'outside-intermediate');
    coupling = COUPLING[view];
    moveTool(view);
  }
  function applyVerdict(verdict) {
    if (verdict === 'strong' || verdict === 'review') {
      // The CANDLE answers "does WellFi fit" (the verdict), so it is not scaled by placement — the strong answer
      // must never render dimmer than the weaker one. Coupling is a different claim and it belongs to the FIELD:
      // a collar shorted by steel casing pushes a visibly weaker field into the formation, which is exactly what
      // the caption "inside casing — attenuated coupling" says (round 7, engineering-truth review).
      target.boost = verdict === 'strong' ? 0.8 : 0.3; // base 0.12 → strong 0.92 (cyan), review 0.42 (sand warming)
      island.field.swell(coupling);
      document.dispatchEvent(new CustomEvent('world:candle', { detail: { boost: target.boost } }));
    } else {
      target.boost = 0;
    }
  }

  let last = null;
  function apply(state) {
    last = state || null;
    const s = state || {};
    applyLift(s.lift || null);
    applyFluid(s.fluid || null);
    applyTemp(s.temp || null, s.verdict || null);
    applyLanding(s.landing || null, Boolean(s.hasLength));
    applyVerdict(s.verdict || null);
  }
  function reset() {
    applyLift(null); applyFluid(null); applyTemp(null, null); applyLanding(null, false); applyVerdict(null);
    // snap the candle state so ch. 3 never inherits a fit verdict
    cur.boost = 0; cur.scale = 1;
  }

  return {
    apply, reset,
    get state() { return last; },
    objects: { beamPump, marker, standoff },
    dispose() { tool.update = origUpdate; parent.remove(beamPump, marker, standoff); },
  };
}
