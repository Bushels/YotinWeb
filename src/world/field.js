// The candle field (spec §3). A section-plane field on exactly four planes — the bench, the x = -1.6 notch
// wall, the z = -0.6 notch wall, and the outer front face (z = +5, x < -1.6, carrying the return up the
// casing). Instances are short strokes ORIENTED ALONG THE LOCAL FIELD GRADIENT on a BLUE-NOISE jittered
// lattice, CULLED below a magnitude threshold (never faded to a dim grid), density falling with magnitude,
// so it reads as a geophysical section rather than an LED wall. One draw call.
//
// Physics grammar: quasi-static anisotropic potential (dipole-ish falloff, vertical reach along the casing,
// flattened/dimmed above the Colorado seal). NOT periodic: magnitude swells once on chapter entry / on
// activation and idles with low-amplitude noise-driven, non-propagating modulation. Pointer/finger probe
// memory lives in a 128x1 RGBA DataTexture (x, y, z, age) and decays over 1.5 s.
import * as THREE from 'three';
import { BENCH_Y, NOTCH, SEAL, SLAB } from './layout.js';

export const PROBE_SLOTS = 32;

// Deterministic PRNG for the jittered lattice.
function mulberry32(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// The circuit has two halves and the picture has to show both (spec §3): the emitter's quasi-static field around
// the collar, AND the return travelling up the cased string to surface. A single radial falloff from the collar
// culled the whole outer front face, so the chapter read as a glow bursting into rock with nothing tying it to
// the wellhead (round 8). `returnPts` is the cased string sampled from heel to surface; the return term is a line
// source around it that thins as it climbs, because the formation takes its cut on the way up.
let RETURN_PTS = null;
// Nearest point on the cased string: `d` is the distance to the sheath, `t` is the position along it. MEASURED
// (round 12d, against paths.cased at runtime): `returnPath` is handed in reversed, so RETURN_PTS[0] is the HEEL
// and the last point is the WELLHEAD — t runs 0 at the heel to 1 at surface. (The round-8 comment here claimed
// the opposite; the code was never changed, so the shipped return term is strongest at SURFACE, not at the
// collar. That is an authored look Kyle has signed off, so it is left alone and described honestly instead.)
// The static return term reads this; so does the acquire climb, which is the same line source walked in time
// instead of held — one geometry, two uses, no second set of strokes.
const _near = { d: Infinity, t: 0 };
function returnNearest(p) {
  _near.d = Infinity; _near.t = 0;
  if (!RETURN_PTS) return _near;
  for (let i = 0; i < RETURN_PTS.length; i++) {
    const q = RETURN_PTS[i];
    const d = Math.hypot(p.x - q.x, (p.y - q.y) * 0.8, (p.z - q.z) * 1.4);
    if (d < _near.d) { _near.d = d; _near.t = i / (RETURN_PTS.length - 1); }
  }
  return _near;
}
function returnTerm(p) {
  if (!RETURN_PTS) return 0;
  const n = returnNearest(p);
  // n.t: 0 at the heel, 1 at the wellhead. Weight along the string (see the note above on its direction).
  const climb = 0.35 + 0.65 * n.t;
  // Round 13: the collar term is now a DIPOLE and falls off far faster than the monopole it replaced, so the
  // sheath is the honest dominant at mid-radius for a collar shorted by casing — which is what the rail's
  // "IN CASING" tally has been claiming while the picture showed an open-hole burst. 0.055 → 0.075.
  return Math.pow(n.d + 0.22, -2.4) * 0.075 * climb; // a tight sheath ON the casing, not a wash across the face
}

// Anisotropic quasi-static kernel for ONE pole (spec §3, "dipole-ish falloff"). Used CPU-side only — the
// vertex program reads a baked aPot attribute and has no potential of its own.
//
// The seal is where the section has to look like geophysics: the vertical reach that carries the field up the
// casing is SPENT at the seal base, so above it the potential stops climbing and spreads sideways instead.
// Raising the dy multiplier across the seal makes vertical distance count nearly 3x more there, which flattens
// the iso-contours (the gradient turns toward horizontal on its own — no bolted-on rotation term) and pushes
// the far seal strokes below the density and cull thresholds. Measured before: strokes INSIDE the grey seal
// band were brighter than strokes below it at matched screen radius, the exact inverse of the art direction.
function poleAt(p, c, aboveSeal) {
  const dx = p.x - c.x, dy = (p.y - c.y) * (0.55 + 1.05 * aboveSeal), dz = (p.z - c.z) * 1.15;
  return Math.pow(Math.hypot(dx, dy, dz) + 0.3, -1.6);
}
// The gap source is a DIPOLE: current leaves one section of the string and returns on the other, so the two
// poles straddle the collar along the local string tangent. A single pole is a point source of current, which
// cannot exist — and its gradient is radial everywhere, which is why the chapter read as a firework rather
// than a section. SIGNED: the gradient must stay smooth through the null plane, so callers take the magnitude.
let POLE_A = null, POLE_B = null;
function potentialAt(p) {
  const aboveSeal = THREE.MathUtils.smoothstep(p.y, SEAL.bottomY, SEAL.topY);
  const d = (poleAt(p, POLE_A, aboveSeal) - poleAt(p, POLE_B, aboveSeal)) * 1.30;
  return d * (1 - 0.8 * aboveSeal) + returnTerm(p) * (1 - 0.5 * aboveSeal);
}

export function buildField({ collar, axis = null, tier = 'high', color = '#22D3EE', returnPath = null } = {}) {
  RETURN_PTS = returnPath && returnPath.length ? returnPath : null;
  // The separation IS the tool, so it stays short next to the strata; the poles are seeded before any
  // placement runs because placement, orientation, density rejection and aPot all read potentialAt().
  const tAxis = (axis ? axis.clone() : new THREE.Vector3(1, 0, 0)).normalize().multiplyScalar(0.13);
  POLE_A = collar.clone().add(tAxis); POLE_B = collar.clone().sub(tAxis);
  const dense = tier !== 'low';
  const spacing = dense ? 0.16 : 0.32;
  const strokeLen = dense ? 0.15 : 0.24;
  const geom = new THREE.PlaneGeometry(strokeLen, strokeLen * 0.28);
  const rand = mulberry32(0x3f9a1c7b);

  // Placement: walk each plane on a jittered lattice; keep instances above a potential floor; store the
  // in-plane gradient direction so the stroke aligns with the field.
  const positions = [], quats = [], pots = [], climbTs = [], climbDs = [];
  const q = new THREE.Quaternion(), zAxis = new THREE.Vector3(0, 0, 1);
  const tmp = new THREE.Vector3(), g = new THREE.Vector3();
  function gradient(p) {
    const e = 0.02;
    g.set(
      potentialAt(tmp.set(p.x + e, p.y, p.z)) - potentialAt(tmp.set(p.x - e, p.y, p.z)),
      potentialAt(tmp.set(p.x, p.y + e, p.z)) - potentialAt(tmp.set(p.x, p.y - e, p.z)),
      potentialAt(tmp.set(p.x, p.y, p.z + e)) - potentialAt(tmp.set(p.x, p.y, p.z - e)),
    );
    return g;
  }
  function place(p, normal) {
    // MAGNITUDE here (the field is signed so gradient() stays smooth through the null): strokes near the null
    // plane cull themselves, so the dipole's dark band perpendicular to the tool appears for free.
    const pot = Math.abs(potentialAt(p));
    if (pot < 0.06) return; // magnitude floor — no dim grid
    // density falls with magnitude (spec §3): stochastic rejection — full near the collar, a few strokes on the
    // far wall; without it every lattice point survived and the far field read as an LED carpet (round 3)
    if (rand() > Math.min(1, Math.pow(pot / 0.45, 1.5))) return;
    // stroke lies in the plane, aligned to the projected gradient
    const gr = gradient(p).clone();
    gr.addScaledVector(normal, -gr.dot(normal));
    if (gr.lengthSq() < 1e-8) gr.set(1, 0, 0);
    gr.normalize();
    // build a basis: x = gradient, z = normal
    const m = new THREE.Matrix4().makeBasis(gr, new THREE.Vector3().crossVectors(normal, gr), normal.clone());
    q.setFromRotationMatrix(m);
    positions.push(p.clone().addScaledVector(normal, 0.012));
    quats.push(q.clone());
    pots.push(pot);
    // Where this stroke sits on the cased string — the travelling acquire window reads these two numbers.
    const n = returnNearest(p);
    climbTs.push(n.t); climbDs.push(Math.min(9, n.d));
  }
  const jit = () => (rand() - 0.5) * spacing * 0.9;
  // Plane A: bench (y = BENCH_Y), normal +y
  for (let x = NOTCH.minX + spacing / 2; x < NOTCH.maxX; x += spacing)
    for (let z = NOTCH.minZ + spacing / 2; z < NOTCH.maxZ; z += spacing)
      place(new THREE.Vector3(x + jit(), BENCH_Y, z + jit()), new THREE.Vector3(0, 1, 0));
  // Plane B: x = -1.6 wall (facing +x), y from bench up to the cap
  for (let z = NOTCH.minZ + spacing / 2; z < NOTCH.maxZ; z += spacing)
    for (let y = BENCH_Y + spacing / 2; y < -0.05; y += spacing)
      place(new THREE.Vector3(NOTCH.minX, y + jit(), z + jit()), new THREE.Vector3(1, 0, 0));
  // Plane C: z = -0.6 wall (facing +z)
  for (let x = NOTCH.minX + spacing / 2; x < NOTCH.maxX; x += spacing)
    for (let y = BENCH_Y + spacing / 2; y < -0.05; y += spacing)
      place(new THREE.Vector3(x + jit(), y + jit(), NOTCH.minZ), new THREE.Vector3(0, 0, 1));
  // Plane D: outer front face z = +5 for x < -1.6 (the return up the casing), full depth
  for (let x = SLAB.minX + spacing / 2; x < NOTCH.minX; x += spacing)
    for (let y = SLAB.baseY + spacing / 2; y < -0.05; y += spacing)
      place(new THREE.Vector3(x + jit(), y + jit(), SLAB.maxZ), new THREE.Vector3(0, 0, 1));

  const count = positions.length;
  const probeTex = new THREE.DataTexture(new Float32Array(PROBE_SLOTS * 4), PROBE_SLOTS, 1, THREE.RGBAFormat, THREE.FloatType);
  probeTex.needsUpdate = true;
  const uniforms = {
    uCollar: { value: collar.clone() },
    uBreath: { value: 0 },      // 0..1 field magnitude (entry/activation swell + idle noise)
    uReveal: { value: 0 },      // 0..1 chapter reveal
    uColor: { value: new THREE.Color(color) },
    uProbe: { value: probeTex },
    uTime: { value: 0 },
    uSealTop: { value: SEAL.topY }, uSealBottom: { value: SEAL.bottomY }, uShadow: { value: 0.65 },
    uCull: { value: 0.11 },
    uClimbAt: { value: -1 },    // window centre along the cased string (0 = heel, 1 = wellhead); < 0 = off
    uClimbAmp: { value: 0 },    // 0 while nothing is being acquired — this is a response, never an idle
  };
  const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide });
  mat.customProgramCacheKey = () => 'candle-field-v3';
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        uniform vec3 uCollar; uniform float uBreath; uniform float uReveal; uniform sampler2D uProbe; uniform float uTime;
        uniform float uSealTop; uniform float uSealBottom; uniform float uShadow; uniform float uCull;
        uniform float uClimbAt; uniform float uClimbAmp;
        attribute float aPot; attribute float aClimbT; attribute float aClimbD;
        varying float vI;
        const int SLOTS = ${PROBE_SLOTS};
        // cheap value noise, non-propagating (no r-dependent phase)
        float hash31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        {
          vec3 wp = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          float n = hash31(floor(wp * 3.0) + floor(uTime * 0.35));
          float n2 = hash31(floor(wp * 3.0) + floor(uTime * 0.35) + 17.0);
          float shimmer = 0.9 + 0.1 * mix(n, n2, fract(uTime * 0.35));
          float field = clamp(aPot, 0.0, 1.0) * uBreath * shimmer;
          float probe = 0.0;
          for (int i = 0; i < SLOTS; i++) {
            vec4 p = texelFetch(uProbe, ivec2(i, 0), 0);
            if (p.w <= 0.0) continue;
            float pd = distance(wp, p.xyz);
            probe += smoothstep(0.9, 0.0, pd) * clamp(1.0 - p.w / 1.5, 0.0, 1.0);
          }
          probe = min(probe, 1.0);
          // The acquire climb: a window travelling ALONG the cased string, tight to its sheath. It is the
          // reading leaving the collar for surface — driven only while a receiver has just been placed.
          float climb = 0.0;
          if (uClimbAmp > 0.0) {
            float along = exp(-pow((aClimbT - uClimbAt) / 0.085, 2.0));
            float sheath = exp(-pow(aClimbD / 0.42, 2.0));
            climb = uClimbAmp * along * sheath;
          }
          float intensity = clamp(uReveal * field + probe * 0.7 * clamp(aPot * 4.0, 0.15, 1.0) + climb, 0.0, 1.0);
          // cull below threshold by collapsing the stroke
          float on = step(uCull, intensity);
          vI = intensity * on;
          transformed *= on * (0.5 + 0.8 * intensity);
        }`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uColor;\nvarying float vI;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb = uColor * (0.06 + 1.15 * vI); // low-intensity strokes carry no constant floor
        diffuseColor.a = min(0.40, vI * 0.46);           // spec §3: <= 40 % alpha at peak, additive fill capped`);
  };

  const mesh = new THREE.InstancedMesh(geom, mat, Math.max(1, count));
  mesh.name = 'candle-field';
  mesh.frustumCulled = false;
  const dummy = new THREE.Object3D();
  const potAttr = new Float32Array(Math.max(1, count));
  const climbTAttr = new Float32Array(Math.max(1, count));
  const climbDAttr = new Float32Array(Math.max(1, count));
  for (let i = 0; i < count; i++) {
    dummy.position.copy(positions[i]); dummy.quaternion.copy(quats[i]); dummy.scale.set(0.6 + rand() * 0.7, 1, 1); // stroke-length jitter: not equal dashes
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    potAttr[i] = pots[i];
    climbTAttr[i] = climbTs[i]; climbDAttr[i] = climbDs[i];
  }
  mesh.count = count;
  mesh.instanceMatrix.needsUpdate = true;
  geom.setAttribute('aPot', new THREE.InstancedBufferAttribute(potAttr, 1));
  geom.setAttribute('aClimbT', new THREE.InstancedBufferAttribute(climbTAttr, 1));
  geom.setAttribute('aClimbD', new THREE.InstancedBufferAttribute(climbDAttr, 1));

  // Probe ring buffer
  const probes = probeTex.image.data;
  let head = 0;
  function probeAt(p) {
    const k = head * 4;
    probes[k] = p.x; probes[k + 1] = p.y; probes[k + 2] = p.z; probes[k + 3] = 0.0001;
    head = (head + 1) % PROBE_SLOTS;
    probeTex.needsUpdate = true;
  }
  // Breath state: target swells to 1 on swell(), relaxes to idle (0.35) with a slow non-periodic wander.
  let breath = 0, breathTarget = 0.35, wander = 0;
  // `strength` lets the caller say how well the emitter is coupled to the formation (1 = open hole; a collar
  // shorted by steel casing swells the field visibly less — round 7).
  function swell(strength = 1) { const t = Math.max(0.25, Math.min(1, strength)); breath = Math.max(breath, 0.2 * t); breathTarget = t; }
  function update(dt, elapsed) {
    uniforms.uTime.value = elapsed;
    // relax toward idle after a swell; idle wanders slowly with noise (no clock)
    breathTarget += (0.35 - breathTarget) * (1 - Math.exp(-0.35 * dt));
    wander += ((Math.sin(elapsed * 0.13) * Math.sin(elapsed * 0.071 + 1.7)) * 0.08 - wander) * (1 - Math.exp(-0.5 * dt));
    breath += (breathTarget + wander - breath) * (1 - Math.exp(-1.6 * dt));
    uniforms.uBreath.value = Math.max(0, breath);
    let any = false;
    for (let i = 0; i < PROBE_SLOTS; i++) {
      const a = probes[i * 4 + 3];
      if (a > 0) { probes[i * 4 + 3] = a + dt; if (probes[i * 4 + 3] > 1.5) probes[i * 4 + 3] = 0; any = true; }
    }
    if (any) probeTex.needsUpdate = true;
  }
  // Where on the string the reading is born: the acquire climb starts at the collar, not at the toe.
  const collarT = returnNearest(collar).t;
  return {
    mesh, uniforms, count, probeAt, swell, update, collarT,
    // The travelling acquire window. amp = 0 puts it away entirely (the shader branch costs nothing then).
    setClimb(at, amp) { uniforms.uClimbAt.value = at; uniforms.uClimbAmp.value = Math.max(0, amp || 0); },
    setReveal(v) { uniforms.uReveal.value = v; },
    setColor(c) { uniforms.uColor.value.set(c); },
    setCollar(p) { uniforms.uCollar.value.copy(p); },
  };
}
