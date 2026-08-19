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

// Anisotropic potential used on the CPU (for placement/orientation) — mirrored in the vertex shader.
function potentialAt(p, collar) {
  const dx = p.x - collar.x, dy = (p.y - collar.y) * 0.55, dz = (p.z - collar.z) * 1.15;
  const r = Math.hypot(dx, dy, dz) + 0.3;
  const aboveSeal = THREE.MathUtils.smoothstep(p.y, SEAL.bottomY, SEAL.topY);
  return Math.pow(r, -1.6) * 1.15 * (1 - 0.65 * aboveSeal);
}

export function buildField({ collar, tier = 'high', color = '#22D3EE' } = {}) {
  const dense = tier !== 'low';
  const spacing = dense ? 0.16 : 0.32;
  const strokeLen = dense ? 0.15 : 0.24;
  const geom = new THREE.PlaneGeometry(strokeLen, strokeLen * 0.28);
  const rand = mulberry32(0x3f9a1c7b);

  // Placement: walk each plane on a jittered lattice; keep instances above a potential floor; store the
  // in-plane gradient direction so the stroke aligns with the field.
  const positions = [], quats = [], pots = [];
  const q = new THREE.Quaternion(), zAxis = new THREE.Vector3(0, 0, 1);
  const tmp = new THREE.Vector3(), g = new THREE.Vector3();
  function gradient(p) {
    const e = 0.02;
    g.set(
      potentialAt(tmp.set(p.x + e, p.y, p.z), collar) - potentialAt(tmp.set(p.x - e, p.y, p.z), collar),
      potentialAt(tmp.set(p.x, p.y + e, p.z), collar) - potentialAt(tmp.set(p.x, p.y - e, p.z), collar),
      potentialAt(tmp.set(p.x, p.y, p.z + e), collar) - potentialAt(tmp.set(p.x, p.y, p.z - e), collar),
    );
    return g;
  }
  function place(p, normal) {
    const pot = potentialAt(p, collar);
    if (pot < 0.02) return; // magnitude floor — no dim grid
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
    uCull: { value: 0.045 },
  };
  const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide });
  mat.customProgramCacheKey = () => 'candle-field-v2';
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        uniform vec3 uCollar; uniform float uBreath; uniform float uReveal; uniform sampler2D uProbe; uniform float uTime;
        uniform float uSealTop; uniform float uSealBottom; uniform float uShadow; uniform float uCull;
        attribute float aPot;
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
          float intensity = clamp(uReveal * field + probe * 0.7 * clamp(aPot * 4.0, 0.15, 1.0), 0.0, 1.0);
          // cull below threshold by collapsing the stroke
          float on = step(uCull, intensity);
          vI = intensity * on;
          transformed *= on * (0.5 + 0.8 * intensity);
        }`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uColor;\nvarying float vI;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb = uColor * (0.25 + 1.4 * vI);
        diffuseColor.a = min(1.0, vI * 1.1);`);
  };

  const mesh = new THREE.InstancedMesh(geom, mat, Math.max(1, count));
  mesh.name = 'candle-field';
  mesh.frustumCulled = false;
  const dummy = new THREE.Object3D();
  const potAttr = new Float32Array(Math.max(1, count));
  for (let i = 0; i < count; i++) {
    dummy.position.copy(positions[i]); dummy.quaternion.copy(quats[i]); dummy.scale.setScalar(1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    potAttr[i] = pots[i];
  }
  mesh.count = count;
  mesh.instanceMatrix.needsUpdate = true;
  geom.setAttribute('aPot', new THREE.InstancedBufferAttribute(potAttr, 1));

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
  function swell() { breath = Math.max(breath, 0.2); breathTarget = 1.0; }
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
  return {
    mesh, uniforms, count, probeAt, swell, update,
    setReveal(v) { uniforms.uReveal.value = v; },
    setColor(c) { uniforms.uColor.value.set(c); },
    setCollar(p) { uniforms.uCollar.value.copy(p); },
  };
}
