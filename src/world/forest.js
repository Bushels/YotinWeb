// Port of Forest.tsx — 3 InstancedMesh spruce variants, deterministic mulberry32 scatter, per-instance HSL tint.
// Adds an optional wind uniform (vertex sway) — the R3F original had none.
import * as THREE from 'three';
import { onCap, PAD_RECT, ROAD_RECT, SLAB } from './layout.js';

export function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Four silhouette families (spec §14.2): three spruce shapes plus a tall narrow jack-pine spire.
const VARIANTS = [
  { trunk: [0.035, 0.22], cones: [[0.42, 0.55, 0.45], [0.3, 0.45, 0.85], [0.17, 0.4, 1.2]] },
  { trunk: [0.03, 0.18], cones: [[0.34, 0.5, 0.38], [0.22, 0.42, 0.72], [0.12, 0.34, 1.02]] },
  { trunk: [0.04, 0.26], cones: [[0.5, 0.62, 0.5], [0.34, 0.5, 0.95], [0.18, 0.46, 1.35]] },
  { trunk: [0.03, 0.55], cones: [[0.2, 0.5, 0.75], [0.13, 0.55, 1.15], [0.07, 0.4, 1.6]] },
];

const COUNTS = { high: [190, 170, 130, 90], low: [100, 90, 70, 40] };

function spruceGeometry(v) {
  const parts = [];
  const trunk = new THREE.CylinderGeometry(v.trunk[0], v.trunk[0] * 1.3, v.trunk[1], 6);
  trunk.translate(0, v.trunk[1] / 2, 0);
  parts.push(trunk);
  for (const [r, h, atY] of v.cones) {
    const cone = new THREE.ConeGeometry(r, h, 7);
    cone.translate(0, atY + h / 2, 0);
    parts.push(cone);
  }
  const merged = mergeIndexed(parts);
  parts.forEach((p) => p.dispose());
  return merged;
}

// Minimal indexed-geometry merge (position/normal/uv + index) — avoids pulling BufferGeometryUtils (37 KB of
// source) into the world chunk for three cones and a trunk.
export function mergeIndexed(geoms) {
  let vCount = 0, iCount = 0;
  geoms.forEach((g) => { vCount += g.attributes.position.count; iCount += g.index.count; });
  const pos = new Float32Array(vCount * 3), nor = new Float32Array(vCount * 3), uv = new Float32Array(vCount * 2);
  const idx = new Uint32Array(iCount);
  let vo = 0, io = 0;
  geoms.forEach((g) => {
    pos.set(g.attributes.position.array, vo * 3);
    nor.set(g.attributes.normal.array, vo * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, vo * 2);
    const gi = g.index.array;
    for (let i = 0; i < gi.length; i++) idx[io + i] = gi[i] + vo;
    vo += g.attributes.position.count; io += gi.length;
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}

const inRect = (x, z, r) => x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ;

export function buildForest(tier = 'high') {
  const group = new THREE.Group();
  group.name = 'forest';
  const rand = mulberry32(20260610);
  const counts = COUNTS[tier] ?? COUNTS.low;
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const wind = { value: 0 };
  const windTime = { value: 0 };
  const pointer = { value: new THREE.Vector3(0, 0, 0) };
  const meshes = [];

  VARIANTS.forEach((variant, vi) => {
    const geom = spruceGeometry(variant);
    const count = counts[vi];
    const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, flatShading: true });
    // Wind sway: the stand answers the wind field — gust fronts travel through it (see the shader below).
    mat.customProgramCacheKey = () => 'spruce-wind';
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uWind = wind;
      shader.uniforms.uWindTime = windTime;
      shader.uniforms.uPointer = pointer;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>
        uniform float uWind; uniform float uWindTime; uniform vec3 uPointer; varying float vTreeH;
        // A GUST THAT TRAVELS (round 12, Kyle: "when that wind shows up it blows the trees and the physics of
        // it look realistic?"). The wind strokes in wind.js drift along -x over the lease; the stand has to
        // answer that same field rather than wobble on its own clock. Three fronts sweep -x across the slab at
        // the wind's own speed: a tree leans as a front reaches it (with a short lead-in, because air piles up
        // ahead of a gust), then springs back with a damped oscillation in its wake. Between fronts the stand
        // is calm — that silence is the point; idle uniform sway is what reads as fake.
        const float GUST_SPAN = 15.0;    // wrap length: the slab (14 wide) plus run-out either side
        const float GUST_X0 = 7.5;       // fronts enter at the +x edge and sweep to -x, like the motes
        float gustAt(float x, float z, float t, float seed, float speed) {
          float front = GUST_X0 - mod(t * speed + seed * GUST_SPAN, GUST_SPAN);
          // a gust front is not a plane: stagger its arrival along strike so it visibly rakes through the stand
          front += 0.42 * sin(z * 0.85 + seed * 6.28);
          float d = x - front;                                        // > 0 = the front has passed: the wake
          float w = max(d, 0.0);
          float lead = smoothstep(-1.15, 0.05, d);                    // the push just ahead of the front
          float wake = exp(-w * 0.72) * (0.78 + 0.22 * cos(w * 3.1)); // springy, damped return
          return lead * wake;
        }`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
        {
          vec4 wp = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float h = clamp(position.y / 1.6, 0.0, 1.0);
          // gust speed rides the wind channel — the same (0.4 + uWind) law the motes drift by
          float speed = 1.05 * (0.45 + 0.95 * uWind);
          float g = gustAt(wp.x, wp.z, uWindTime, 0.0, speed)
                  + 0.72 * gustAt(wp.x, wp.z, uWindTime, 0.41, speed * 0.86)
                  + 0.55 * gustAt(wp.x, wp.z, uWindTime, 0.73, speed * 1.17);
          g = min(g, 1.35);
          // needle flutter: only while a gust is actually on the tree, and only near the top
          float flutter = sin(uWindTime * 5.7 + wp.x * 2.3 + wp.z * 3.9) * 0.22 * g;
          // spruce are stiff: a few degrees at the leader, nothing at the trunk base (h squared)
          float sway = uWind * h * h * (0.062 * g + 0.022 * flutter);
          // pointer parting: trees near the pointer lean away
          vec2 d = wp.xz - uPointer.xz;
          float dist = length(d);
          float part = smoothstep(1.4, 0.0, dist) * uPointer.y; // uPointer.y carries strength
          vec2 dir = dist > 1e-4 ? d / dist : vec2(0.0);
          // the wind blows toward -x, so the stand leans DOWNWIND (it used to lean into it)
          transformed.x += -sway + dir.x * part * h * h * 0.35;
          transformed.z += -sway * 0.3 + dir.y * part * h * h * 0.35;
          vTreeH = h;
        }`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vTreeH;')
        .replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb *= 0.55 + 0.45 * smoothstep(0.0, 0.7, vTreeH);');
    };
    const mesh = new THREE.InstancedMesh(geom, mat, count);
    let placed = 0, guard = 0;
    while (placed < count && guard++ < count * 60) {
      const x = SLAB.minX + rand() * (SLAB.maxX - SLAB.minX);
      const z = SLAB.minZ + rand() * (SLAB.maxZ - SLAB.minZ);
      // The lease road has cleared shoulders — a real one does, and without them the spruce close over the road so
      // the ground stake and the measurement loop vanish into the canopy (round 5).
      const ROAD_CLEAR = { minX: ROAD_RECT.minX - 1.15, maxX: ROAD_RECT.maxX + 1.15, minZ: ROAD_RECT.minZ, maxZ: ROAD_RECT.maxZ + 0.8 };
      if (!onCap(x, z) || inRect(x, z, PAD_RECT) || inRect(x, z, ROAD_CLEAR)) continue;
      // clearing: no trees within ~1.1 units of the pad edge (negative space around the lease)
      if (x > PAD_RECT.minX - 1.1 && x < PAD_RECT.maxX + 1.1 && z > PAD_RECT.minZ - 1.1 && rand() < 0.85) continue;
      const s = 0.8 + rand() * 0.7;
      dummy.position.set(x, 0, z);
      // anisotropic scale (height and girth vary independently) + a wider lean: no two silhouettes identical
      // (round 2 — "identical cone stacks at different sizes")
      const tall = rand() < 0.25 ? 1.35 : 1;
      dummy.scale.set(s * (0.8 + rand() * 0.45), s * tall * (0.75 + rand() * 0.6), s * (0.8 + rand() * 0.45));
      dummy.rotation.set((rand() - 0.5) * 0.16, rand() * Math.PI * 2, (rand() - 0.5) * 0.16);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      // luminance ceiling below the pad (spec §14.2) AND distance falloff — RADIAL from the camera-near corner of
      // the three-quarter hero pose (+x, +z), so the back-right rows recede too (round 1/2: the forest read as a
      // strategy-game diorama).
      const dx = (SLAB.maxX - x) / (SLAB.maxX - SLAB.minX), dz = (SLAB.maxZ - z) / (SLAB.maxZ - SLAB.minZ);
      const depth = Math.min(1, Math.hypot(dx, dz) / 1.2);
      const dt = Math.min(1, Math.max(0, (depth - 0.3) / 0.7));
      const fall = 1 - 0.62 * dt * dt * (3 - 2 * dt);
      mesh.setColorAt(placed, color.setHSL(0.31 + (rand() - 0.5) * 0.12, 0.3 * (0.6 + 0.4 * fall), (0.09 + rand() * 0.13) * fall));
      placed++;
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.name = `spruce-${vi}`;
    group.add(mesh);
    meshes.push(mesh);
  });

  return { group, meshes, uniforms: { wind, windTime, pointer } };
}
