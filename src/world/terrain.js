// Terrain for the bench topology: solid slab, rectangular 90° notch down to BENCH_Y, strata continuous
// around the shared corner, world-Y bedding shader (albedo modulation — bump alone is invisible on flat lit
// walls), a wet-bitumen bench, hairline sand cut edges on every cut boundary, and baked contact darkening in
// the inner corner (a flat evenly lit bench would read as a stage floor).
import * as THREE from 'three';
import { CAP_OUTLINE, BENCH_Y, LOWER, NOTCH, SLAB, STRATA } from './layout.js';

function polyToShape(poly) {
  const shape = new THREE.Shape();
  poly.forEach(([x, z], i) => (i === 0 ? shape.moveTo(x, z) : shape.lineTo(x, z)));
  shape.closePath();
  return shape;
}

// Extrude a plan-view shape downward from topY to bottomY (ExtrudeGeometry extrudes along +Z; rotateX(PI/2)
// maps that to -Y and the shape's plan Y onto world Z).
function stratumGeometry(shape, topY, bottomY) {
  const geom = new THREE.ExtrudeGeometry(shape, { depth: topY - bottomY, bevelEnabled: false });
  geom.rotateX(Math.PI / 2);
  geom.translate(0, topY, 0);
  geom.computeVertexNormals();
  return geom;
}

export function makeNoiseTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  let s = 1234567;
  for (let i = 0; i < img.data.length; i += 4) {
    s = (s * 16807) % 2147483647;
    const v = 116 + (s % 80);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

// Laminated bedding driven by WORLD-Y, plus a contact-darkening term near the notch's inner corner and
// the wall/bench junction (uCorner = the corner point in world space, uCornerRadius = falloff).
export function makeBeddingMaterial(color, roughness, freq, depth, phase, bump, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
  if (bump) { mat.bumpMap = bump; mat.bumpScale = 0.018; }
  const uniforms = {
    uCorner: { value: new THREE.Vector3(NOTCH.minX, BENCH_Y, NOTCH.minZ) },
    uCornerRadius: { value: opts.cornerRadius ?? 1.6 },
    uBenchY: { value: BENCH_Y },
  };
  mat.customProgramCacheKey = () => `bedding-${freq}-${depth}-${phase}`;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vBedWorld;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBedWorld = (modelMatrix * vec4(position, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vBedWorld;
        uniform vec3 uCorner; uniform float uCornerRadius; uniform float uBenchY;
        const float BED_FREQ = ${freq.toFixed(1)};
        const float BED_DEPTH = ${depth.toFixed(2)};
        const float BED_PHASE = ${phase.toFixed(2)};`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float bed = abs(sin(vBedWorld.y * BED_FREQ + BED_PHASE));
        float line = smoothstep(0.45, 0.97, bed);
        float lam = 0.5 + 0.5 * sin(vBedWorld.y * BED_FREQ * 0.31);
        diffuseColor.rgb *= (1.0 - BED_DEPTH * line);
        diffuseColor.rgb *= (0.90 + 0.18 * lam);
        // contact darkening: inner notch corner + wall/bench junction (only below the cap, near the bench)
        float dCorner = length(vec2(vBedWorld.x - uCorner.x, vBedWorld.z - uCorner.z));
        float nearBench = 1.0 - smoothstep(0.0, 0.9, abs(vBedWorld.y - uBenchY));
        float dark = (1.0 - smoothstep(0.0, uCornerRadius, dCorner)) * 0.55 + nearBench * 0.18;
        diffuseColor.rgb *= (1.0 - dark * 0.6);`);
  };
  return mat;
}

function makeShadowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(0.7, 'rgba(0,0,0,0.18)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

// Hairline sand cut-edges on every cut boundary: the notch's vertical edges, its top rim, the bench rim,
// and the slab's outer top edges — the drawing convention that says "this is a section, not an excavation".
function makeCutEdges() {
  const pts = [];
  const seg = (a, b) => pts.push(...a, ...b);
  const y0 = 0, yb = BENCH_Y;
  const { minX: nx, minZ: nz } = NOTCH;
  const { maxX: sx, maxZ: sz, minX: smx, minZ: smz } = SLAB;
  // notch top rim (on the cap at y=0)
  seg([nx, y0, sz], [nx, y0, nz]); seg([nx, y0, nz], [sx, y0, nz]);
  // notch vertical edges (inner corner and the two ends)
  seg([nx, y0, nz], [nx, yb, nz]); seg([nx, y0, sz], [nx, yb, sz]); seg([sx, y0, nz], [sx, yb, nz]);
  // bench rim where the bench meets the walls
  seg([nx, yb, sz], [nx, yb, nz]); seg([nx, yb, nz], [sx, yb, nz]);
  // outer top edges of the slab
  seg([smx, y0, sz], [nx, y0, sz]); seg([smx, y0, smz], [sx, y0, smz]); seg([smx, y0, sz], [smx, y0, smz]); seg([sx, y0, smz], [sx, y0, nz]);
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const mat = new THREE.LineBasicMaterial({ color: '#e8dcc8', transparent: true, opacity: 0.35, depthWrite: false });
  const lines = new THREE.LineSegments(geom, mat);
  lines.name = 'cut-edges';
  lines.renderOrder = 5;
  return lines;
}

export function buildTerrain({ noiseTex = makeNoiseTexture() } = {}) {
  const group = new THREE.Group();
  group.name = 'terrain';
  const capShape = polyToShape(CAP_OUTLINE);
  const rectShape = polyToShape([[SLAB.minX, SLAB.minZ], [SLAB.maxX, SLAB.minZ], [SLAB.maxX, SLAB.maxZ], [SLAB.minX, SLAB.maxZ]]);
  const strataMeshes = [];
  const byName = {};
  [...STRATA, LOWER].forEach((s) => {
    const parts = [];
    const topA = s.topY, botA = Math.max(s.bottomY, BENCH_Y);
    if (topA > botA) parts.push(stratumGeometry(capShape, topA, botA));   // above the bench: notched outline
    const topB = Math.min(s.topY, BENCH_Y), botB = s.bottomY;
    if (topB > botB) parts.push(stratumGeometry(rectShape, topB, botB));  // below the bench: full slab
    let mat;
    if (s.name === 'topsoil') {
      mat = new THREE.MeshStandardMaterial({ color: s.color, roughness: s.roughness, metalness: 0 });
      mat.bumpMap = noiseTex; mat.bumpScale = 0.02;
    } else {
      const b = s.bed ?? { freq: 26, depth: 0.3, phase: 0 };
      mat = makeBeddingMaterial(s.color, s.roughness, b.freq, b.depth, b.phase, noiseTex);
    }
    parts.forEach((g) => {
      const m = new THREE.Mesh(g, mat);
      m.name = 'stratum-' + s.name;
      m.userData.stratum = s.name;
      m.userData.label = s.label;
      group.add(m);
      strataMeshes.push(m);
      (byName[s.name] ??= []).push(m);
    });
  });

  // Bench: the exposed pay surface inside the notch — wet bitumen, slightly glossy.
  const bench = new THREE.Mesh(
    new THREE.PlaneGeometry(NOTCH.maxX - NOTCH.minX, NOTCH.maxZ - NOTCH.minZ),
    makeBeddingMaterial('#3a2a1e', 0.5, 12, 0.08, 0.3, noiseTex, { cornerRadius: 2.2 }), // visibly rock (round 1): the slots need a lit bench to be cut into
  );
  bench.material.bumpScale = 0.025;
  bench.rotation.x = -Math.PI / 2;
  bench.position.set((NOTCH.minX + NOTCH.maxX) / 2, BENCH_Y + 0.002, (NOTCH.minZ + NOTCH.maxZ) / 2);
  bench.name = 'pay-bench';
  bench.userData.stratum = 'lowerSand';
  group.add(bench);

  group.add(makeCutEdges());

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(22, 17), new THREE.MeshBasicMaterial({ map: makeShadowTexture(), transparent: true, depthWrite: false }));
  shadow.position.set(0, SLAB.baseY - 0.7, 0);
  shadow.rotation.x = -Math.PI / 2;
  shadow.name = 'ground-shadow';
  group.add(shadow);

  return { group, strataMeshes, byName, bench, noiseTex };
}
