// Port of Forest.tsx — 3 InstancedMesh spruce variants, deterministic mulberry32 scatter, per-instance HSL tint.
// Adds an optional wind uniform (vertex sway) — the R3F original had none.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
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
  const merged = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  return merged;
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
    // Wind sway: bend the tree top in the wind direction; amplitude grows with local height.
    mat.customProgramCacheKey = () => 'spruce-wind';
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uWind = wind;
      shader.uniforms.uWindTime = windTime;
      shader.uniforms.uPointer = pointer;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uWind;\nuniform float uWindTime;\nuniform vec3 uPointer;\nvarying float vTreeH;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
        {
          vec4 wp = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float h = clamp(position.y / 1.6, 0.0, 1.0);
          float phase = wp.x * 0.9 + wp.z * 1.3;
          float gust = sin(uWindTime * 1.1 + phase) * 0.6 + sin(uWindTime * 2.3 + phase * 1.7) * 0.4;
          float sway = uWind * h * h * (0.05 + 0.05 * gust);
          // pointer parting: trees near the pointer lean away
          vec2 d = wp.xz - uPointer.xz;
          float dist = length(d);
          float part = smoothstep(1.4, 0.0, dist) * uPointer.y; // uPointer.y carries strength
          vec2 dir = dist > 1e-4 ? d / dist : vec2(0.0);
          transformed.x += sway + dir.x * part * h * h * 0.35;
          transformed.z += sway * 0.35 + dir.y * part * h * h * 0.35;
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
      if (!onCap(x, z) || inRect(x, z, PAD_RECT) || inRect(x, z, ROAD_RECT)) continue;
      // clearing: no trees within ~1.1 units of the pad edge (negative space around the lease)
      if (x > PAD_RECT.minX - 1.1 && x < PAD_RECT.maxX + 1.1 && z > PAD_RECT.minZ - 1.1 && rand() < 0.85) continue;
      const s = 0.8 + rand() * 0.7;
      dummy.position.set(x, 0, z);
      dummy.scale.setScalar(s * (rand() < 0.25 ? 1.35 : 1));
      dummy.rotation.y = rand() * Math.PI * 2;
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      mesh.setColorAt(placed, color.setHSL(0.31 + (rand() - 0.5) * 0.07, 0.3, 0.11 + rand() * 0.09)); // luminance ceiling below the pad (spec §14.2)
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
