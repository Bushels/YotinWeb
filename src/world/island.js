// Assembles the world (spec §3): terrain (bench topology), forest, well system, the WellFi tool at the
// open-hole anchor (the candle), the wellhead receiver ring, the lease pad, and the candle field. Exposes a
// pure update(t, elapsed, channels) so the conductor drives it from chapter state. No bullet pulse; the 12 s
// island cycle only shapes ambient light. Flow chevrons are sand-tinted at the surface and muted where the
// chapter's `flow` channel says so.
import * as THREE from 'three';
import { COLORS } from './layout.js';
import { cycleState } from './cycle.js';
import { DEFAULT_WELLFI_VIEW, buildWellPaths, getWellFiPlacement } from './wellPath.js';
import { createPulseMaterial } from './pulseMaterial.js';
import { buildTerrain } from './terrain.js';
import { buildForest } from './forest.js';
import { buildWellSystem } from './wellSystem.js';
import { buildWellFiTool } from './wellfiTool.js';
import { buildLeasePad, buildSignalRelay } from './props.js';
import { buildField } from './field.js';
import { buildWind } from './wind.js';

export const SAND_FLOW = '#d9c39a';

export function buildIsland({ tier = 'high', view = DEFAULT_WELLFI_VIEW } = {}) {
  const root = new THREE.Group();
  root.name = 'island';
  const parallax = new THREE.Group();
  parallax.name = 'parallax';
  root.add(parallax);

  const paths = buildWellPaths();
  const placement = getWellFiPlacement(paths, view);

  // Flow materials: sand-tinted chevrons (no cyan at the surface). Pulse (bullet) never set.
  const casedFlow = createPulseMaterial({ base: { color: COLORS.casing, roughness: 0.35, metalness: 0.85, transparent: true, opacity: 1 }, pulseColor: SAND_FLOW, flowCount: 10, flowColor: SAND_FLOW });
  // Open-hole bores: base at or below the pay so the slot floor never out-lights the bench (round 2); the
  // chevrons stay readable as dim flow inside a dark slot, not a lit ribbon.
  const trunkFlow = createPulseMaterial({ base: { color: '#2b1e14', roughness: 0.9, metalness: 0 }, pulseColor: SAND_FLOW, flowCount: 12, flowColor: '#8a7455' });
  const legFlow = createPulseMaterial({ base: { color: '#261a11', roughness: 0.9, metalness: 0 }, pulseColor: SAND_FLOW, flowCount: 8, flowColor: '#8a7455' });

  const terrain = buildTerrain();
  const forest = buildForest(tier);
  const well = buildWellSystem(paths, { cased: casedFlow.material, openHole: trunkFlow.material, lateral: legFlow.material });
  const tool = buildWellFiTool(placement, { glowColor: COLORS.emGlow });
  const relay = buildSignalRelay(paths.wellhead);
  const pad = buildLeasePad();
  const field = buildField({ collar: tool.group.position, tier });
  const wind = buildWind({ tier });

  parallax.add(terrain.group, forest.group, well.group, tool.group, relay.mesh, pad.group, field.mesh, wind.mesh);

  // Lights: golden hour at the surface — low, raking key from the west so long shadows cross the strata and
  // the pad owns the brightest non-sky pixel (spec §14.2). Driven per frame by the chapter light channel ×
  // the ambient cycle. Desktop tier casts one 2048 shadow map from the sun over the slab.
  const hemi = new THREE.HemisphereLight(COLORS.skyFill, COLORS.ground, 0.7);
  const sun = new THREE.DirectionalLight(COLORS.goldenHour, 2.0);
  sun.position.set(-11, 4.2, 7);
  const rim = new THREE.DirectionalLight('#5e86c4', 0.22);
  rim.position.set(8, 4, -7);
  root.add(hemi, sun, rim);
  if (tier === 'high') {
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    // The shadow box must cover the slab AND the long shadows a low sun throws off it: at ~18° elevation a 2.5-unit
    // spruce lays a ~7.7-unit shadow, so a ±11 × ±9 box ended inside the visible ground and every receiver past its
    // edge snapped to unshadowed — a razor-straight vertical brightness step across the world (round 7).
    sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 60;
    sun.shadow.camera.left = -19; sun.shadow.camera.right = 19; sun.shadow.camera.top = 19; sun.shadow.camera.bottom = -19;
    sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
    terrain.strataMeshes.forEach((m) => { m.receiveShadow = true; m.castShadow = false; }); // receivers only: casting re-rendered ~40 k tris into the shadow map for a corner shadow the baked contact darkening already paints
    terrain.bench.receiveShadow = true;
    forest.meshes.forEach((m) => { m.castShadow = true; m.receiveShadow = false; });
    pad.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    well.cased.castShadow = true;
    // the surface plane (topsoil top face) receives; strata already do
  }

  const state = { cycle: cycleState(1.5), elapsed: 0, view, candleBoost: 0, toolFocus: 0 }; // toolFocus: inspection sleeve + rings (orbit open), not the cutaway
  const pointer = { x: 0, y: 0 };
  let compact = false;

  // channels: { light, cutaway, candle, field, wind, flow, fog }
  let lastElapsed = 0;
  function update(t, elapsed, channels, { reducedMotion = false } = {}) {
    const s = cycleState(t);
    // Real elapsed time between frames: assuming 1/60 made every eased world state frame-rate dependent, so on a
    // software renderer or a slow phone they converged an order of magnitude too slowly (round 6).
    const dt = lastElapsed ? Math.min(0.25, Math.max(0, elapsed - lastElapsed)) : 1 / 60;
    lastElapsed = elapsed;
    state.cycle = s;
    state.elapsed = elapsed;
    const L = channels.light;
    // Golden hour is an authored light, not a lottery: the 12 s ambient cycle used to swing the key by 45 %, so the
    // hero could be seen (and captured) at a dim phase — measured darker than the deliberately darkest chapter
    // (round 6). The cycle now shapes the light; it no longer decides it.
    sun.intensity = 0.1 + 3.6 * L * (0.82 + 0.18 * s.sun);
    hemi.intensity = 0.16 + 0.95 * L * (0.78 + 0.22 * s.sky) + 0.05;
    rim.intensity = 0.12 + 0.26 * (1 - L); // the rim separates silhouettes; it must not become the key light as L → 0 (round 5)
    const flow = channels.flow ?? L;
    const flowTime = elapsed % 20;
    casedFlow.setFlow(0.9 * flow, flowTime);
    trunkFlow.setFlow(0.35 * flow, flowTime);
    legFlow.setFlow(0.25 * flow, flowTime);
    const cut = Math.max(channels.cutaway, 0);
    casedFlow.setCutaway(1 - 0.72 * cut, cut < 0.05);
    tool.update(channels.candle, state.toolFocus);
    field.setReveal(channels.field);
    field.update(dt, elapsed);
    forest.uniforms.wind.value = channels.wind;
    forest.uniforms.windTime.value = elapsed;
    wind.update(elapsed, channels.wind);
    // candle boost from the qualifier verdict (world:candle) decays on its own
    if (state.candleBoost > 0) { state.candleBoost = Math.max(0, state.candleBoost - dt * 0.24); tool.update(Math.min(1, channels.candle + state.candleBoost), state.toolFocus); }
    if (!reducedMotion) {
      const idleY = Math.sin(elapsed * 0.18) * (compact ? 0.018 : 0.026);
      const idleX = Math.sin(elapsed * 0.13 + 0.8) * (compact ? 0.006 : 0.01);
      const targetY = pointer.x * 0.05, targetX = -pointer.y * 0.025;
      parallax.rotation.y += (targetY + idleY - parallax.rotation.y) * 0.04;
      parallax.rotation.x += (targetX + idleX - parallax.rotation.x) * 0.04;
    }
  }

  function setView(nextView) {
    if (nextView === state.view) return;
    state.view = nextView;
    const p = getWellFiPlacement(paths, nextView);
    tool.setPlacement(p);
    field.setCollar(tool.group.position);
  }

  return {
    root, parallax, paths, placement, terrain, forest, well, tool, relay, pad, field, wind,
    lights: { hemi, sun, rim }, materials: { casedFlow, trunkFlow, legFlow },
    state, pointer, update, setView,
    setCompact(v) { compact = v; },
    setForestPointer(x, z, strength) { forest.uniforms.pointer.value.set(x, strength, z); wind.setPointer(x, z, strength); },
    setToolFocus(v) { state.toolFocus = Math.max(0, Math.min(1, v || 0)); },
  };
}
