// Verbatim port of lib/island/pulseMaterial.ts — gaussian uplink blob + production-flow chevrons on TubeGeometry uv.x.
import * as THREE from 'three';
let pulseMaterialId = 0;
export function createPulseMaterial(opts) {
  const uniforms = {
    uHead: { value: -1 }, uWidth: { value: 0.07 }, uStrength: { value: 0 },
    uPulseColor: { value: new THREE.Color(opts.pulseColor) },
    uTime: { value: 0 }, uFlowStrength: { value: 0 }, uFlowCount: { value: opts.flowCount ?? 10 },
    uFlowColor: { value: new THREE.Color(opts.flowColor ?? '#22D3EE') },
  };
  const material = new THREE.MeshStandardMaterial(opts.base);
  material.toneMapped = false;
  material.defines = { ...(material.defines ?? {}), USE_UV: '' };
  const cacheId = pulseMaterialId++;
  material.customProgramCacheKey = () => `pulse-${cacheId}`;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uHead;\nuniform float uWidth;\nuniform float uStrength;\nuniform vec3 uPulseColor;\nuniform float uTime;\nuniform float uFlowStrength;\nuniform float uFlowCount;\nuniform vec3 uFlowColor;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        if (uHead >= 0.0) {
          float d = (vUv.x - uHead) / uWidth;
          totalEmissiveRadiance += uPulseColor * (uStrength * exp(-d * d));
        }
        if (uFlowStrength > 0.0) {
          float saw = fract(vUv.x * uFlowCount + uTime * 0.82);
          float dash = smoothstep(0.0, 0.2, saw) * (1.0 - smoothstep(0.46, 0.72, saw));
          totalEmissiveRadiance += uFlowColor * (uFlowStrength * dash * 0.95);
        }`);
  };
  return {
    material, uniforms,
    setPulse(head, strength, width = 0.07) { uniforms.uHead.value = head; uniforms.uStrength.value = strength; uniforms.uWidth.value = width; },
    setFlow(strength, time) { uniforms.uFlowStrength.value = strength; uniforms.uTime.value = time; },
    setCutaway(opacity, depthWrite) { material.opacity = opacity; material.depthWrite = depthWrite; },
  };
}
