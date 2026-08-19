// The WellFi tool — parametric, four named volumes only (spec §3): sleeve, isolation gap, sensor package,
// battery. Deliberately less detailed than the approved public ghost render. The collar is the candle: a thin
// band plus one additive halo sprite, nothing else (no local light — a point light on the trough floor read as a
// downward beam, round 1). One-candle rule (spec §2/§6): the candle is SAND at rest and in every chapter but
// the signal chapter; it crosses to cyan only as the candle channel passes ~0.3–0.55 (ch. 3 at 1.0, and the
// fit verdict boost), so saturated cyan never appears where transmission is not the subject. No GLB.
import * as THREE from 'three';
import { COLORS } from './layout.js';
import { EMBER } from './cycle.js';

export const TOOL_LENGTH = 0.62;

export function buildWellFiTool(placement, { glowColor = COLORS.emGlow } = {}) {
  const group = new THREE.Group();
  group.name = `wellfi-${placement.id}`;
  group.position.copy(placement.position);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), placement.tangent);
  const base = new THREE.Color(glowColor);
  const SAND = new THREE.Color(COLORS.sand || '#e8dcc8');
  const glow = new THREE.Color(SAND);
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  // Inspection sleeve + rings (focus emphasis)
  const inspectionSleeveMat = new THREE.MeshBasicMaterial({ color: SAND, transparent: true, opacity: 0.03, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const inspectionSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, TOOL_LENGTH * 1.25, 24, 1, true), inspectionSleeveMat);
  inspectionSleeve.rotation.z = Math.PI / 2; inspectionSleeve.renderOrder = 21;
  group.add(inspectionSleeve);
  const ringMatA = new THREE.MeshBasicMaterial({ color: SAND, transparent: true, opacity: 0.04, depthTest: false, depthWrite: false, toneMapped: false });
  const ringMatB = ringMatA.clone();
  const ringGeom = new THREE.TorusGeometry(0.17, 0.008, 8, 32);
  const ringA = new THREE.Mesh(ringGeom, ringMatA); ringA.position.x = -TOOL_LENGTH * 0.58; ringA.rotation.y = Math.PI / 2; ringA.renderOrder = 26;
  const ringB = new THREE.Mesh(ringGeom, ringMatB); ringB.position.x = TOOL_LENGTH * 0.58; ringB.rotation.y = Math.PI / 2; ringB.renderOrder = 26;
  group.add(ringA, ringB);

  // Body: four named volumes along +X.
  const body = new THREE.Group();
  body.name = 'body';
  const steel = new THREE.MeshStandardMaterial({ color: '#c6ccd1', metalness: 0.8, roughness: 0.4 }); // neutral steel, not blue-white
  const dark = new THREE.MeshStandardMaterial({ color: '#2a2622', metalness: 0.2, roughness: 0.7 });
  const L = TOOL_LENGTH;
  const volumes = [
    { name: 'battery',  len: L * 0.28, r: 0.05, mat: steel,  x: -L * 0.36 },
    { name: 'sensors',  len: L * 0.26, r: 0.05, mat: steel,  x: -L * 0.05 },
    { name: 'gap',      len: L * 0.10, r: 0.047, mat: dark,  x: L * 0.16 },   // the isolation gap — dark band
    { name: 'sleeve',   len: L * 0.30, r: 0.05, mat: steel,  x: L * 0.36 },
  ];
  const hotspots = {};
  volumes.forEach((vdef) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(vdef.r, vdef.r, vdef.len, 20), vdef.mat);
    m.rotation.z = Math.PI / 2; m.position.x = vdef.x; m.name = `tool-${vdef.name}`;
    m.userData.hotspot = vdef.name;
    body.add(m);
    hotspots[vdef.name] = m;
  });
  group.add(body);

  // Witness capsule (soft outline) and the emissive collar sleeve — the candle. Values >1 are additive halo, no bloom.
  const witnessMat = new THREE.MeshBasicMaterial({ color: SAND, transparent: true, opacity: 0.1, depthTest: false, depthWrite: false, toneMapped: false });
  const witness = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, L * 0.62, 8, 16), witnessMat);
  witness.rotation.z = Math.PI / 2; witness.renderOrder = 24;
  group.add(witness);
  const sleeveMat = new THREE.MeshBasicMaterial({ color: SAND, depthTest: false, depthWrite: false, toneMapped: false });
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 16), sleeveMat); // thin band, not a wide halo
  collar.rotation.z = Math.PI / 2; collar.position.x = L * 0.16; collar.renderOrder = 25; collar.name = 'collar-band';
  group.add(collar);

  // Halo sprite (additive) — the candle glow, camera-facing, cheap.
  const haloTex = makeHaloTexture();
  const haloMat = new THREE.SpriteMaterial({ map: haloTex, color: SAND, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.setScalar(0.9); halo.position.x = L * 0.16; halo.renderOrder = 27; halo.name = 'collar-halo';
  group.add(halo);

  function update(boost, focus) {
    const k = Math.max(EMBER, boost);
    const sig = smooth(0.28, 0.55, k);              // 0 = sand (rest/ember), 1 = cyan (transmission)
    glow.copy(SAND).lerp(base, sig);
    sleeveMat.color.copy(glow).multiplyScalar(0.3 + 1.7 * k); // > 1 at full signal: the brightest non-sky pixel of ch. 3
    haloMat.color.copy(glow);
    haloMat.opacity = Math.min(0.72, 0.02 + 0.7 * k * k);
    witnessMat.opacity = Math.min(0.3, 0.04 + 0.26 * k);
    inspectionSleeveMat.color.copy(glow);
    inspectionSleeveMat.opacity = 0.02 + 0.08 * focus;
    ringMatA.color.copy(glow); ringMatB.color.copy(glow);
    const ringOpacity = (0.04 + 0.24 * focus) * (0.55 + 0.45 * sig);
    ringMatA.opacity = ringOpacity; ringMatB.opacity = ringOpacity;
  }

  return {
    group, body, hotspots, halo, update,
    setPlacement(p) { group.position.copy(p.position); group.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), p.tangent); },
    setGlowColor(c) { base.set(c); },
  };
}

function makeHaloTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.18, 'rgba(255,255,255,0.35)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.08)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
