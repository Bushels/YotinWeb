// Wind (spec §4 rows 0 and 5): sand motes drifting across the surface in the authored wind direction, sharing
// the field's stroke primitive; colour ramps sand → ember across y = 0 ("Two unseen fields. One visual
// language." — the shared primitive, not the physics). Parts around the pointer/finger with a spring return.
// One draw call, tier ≥ 2 only, culled when the wind channel is 0.
import * as THREE from 'three';
import { SLAB } from './layout.js';

export function buildWind({ count = 420, tier = 'high' } = {}) {
  if (tier === 'low') count = 0;
  const geom = new THREE.PlaneGeometry(0.16, 0.035);
  const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide });
  const uniforms = { uTime: { value: 0 }, uWind: { value: 0 }, uPointer: { value: new THREE.Vector3(0, -99, 0) }, uSand: { value: new THREE.Color('#e8dcc8') }, uEmber: { value: new THREE.Color('#f27622') } };
  mat.customProgramCacheKey = () => 'wind-motes';
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTime; uniform float uWind; uniform vec3 uPointer;
        attribute vec3 aSeed; // x: phase, y: speed, z: height
        varying float vA; varying float vY;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        {
          vec3 base = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          float span = 14.4;
          // drift along -x (west wind) and wrap; slight sinuous lift
          float travel = fract(aSeed.x + uTime * (0.03 + 0.05 * aSeed.y) * (0.4 + uWind));
          vec3 wp = base;
          wp.x = ${SLAB.maxX.toFixed(1)} - travel * span;
          wp.y = aSeed.z + 0.08 * sin(uTime * 0.7 + aSeed.x * 6.28) + 0.04 * sin(uTime * 1.9 + aSeed.y * 6.28);
          // parting around the pointer
          vec2 d = wp.xz - uPointer.xz;
          float dist = length(d);
          float part = smoothstep(1.6, 0.0, dist) * uPointer.y;
          wp.xz += (dist > 1e-4 ? d / dist : vec2(0.0)) * part * 0.6;
          wp.y += part * 0.25;
          // fade at both ends of the run and when the wind is low
          float edge = smoothstep(0.0, 0.08, travel) * (1.0 - smoothstep(0.92, 1.0, travel));
          vA = edge * clamp(uWind * 1.4, 0.0, 1.0) * (0.35 + 0.65 * aSeed.y);
          vY = wp.y;
          // orient the stroke along the wind (x) with a little tilt
          vec3 p = position; p.x *= (0.6 + 0.8 * aSeed.y);
          transformed = wp + p; // strokes are pre-oriented planes; parent handles nothing else
        }`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uSand; uniform vec3 uEmber;\nvarying float vA; varying float vY;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float ramp = smoothstep(-0.2, 0.9, vY);      // sand at the ground, ember as it lifts
        diffuseColor.rgb = mix(uSand, uEmber, ramp) * 0.9;
        diffuseColor.a = vA * 0.55;`);
  };
  const mesh = new THREE.InstancedMesh(geom, mat, Math.max(1, count));
  mesh.name = 'wind-motes';
  mesh.frustumCulled = false;
  const dummy = new THREE.Object3D();
  const seeds = new Float32Array(Math.max(1, count) * 3);
  let s = 0x9e3779b9;
  const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; };
  for (let i = 0; i < count; i++) {
    const z = SLAB.minZ + rnd() * (SLAB.maxZ - SLAB.minZ);
    dummy.position.set(0, 0, z); // x/y come from the shader
    dummy.rotation.set(0, 0, (rnd() - 0.5) * 0.25);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    seeds[i * 3] = rnd(); seeds[i * 3 + 1] = rnd(); seeds[i * 3 + 2] = 0.15 + rnd() * 1.6;
  }
  mesh.count = count;
  mesh.instanceMatrix.needsUpdate = true;
  geom.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 3));
  mesh.visible = count > 0;
  return {
    mesh, uniforms,
    update(elapsed, wind) { uniforms.uTime.value = elapsed; uniforms.uWind.value = wind; mesh.visible = count > 0 && wind > 0.02; },
    setPointer(x, z, strength) { uniforms.uPointer.value.set(x, strength, z); },
  };
}
