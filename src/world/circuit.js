// Chapter 3 world pieces (spec §4 row 3, §12): the two surface references (wellhead V₁, remote ground stake
// V₂), the hairline measurement loop that only draws when both are placed, the stake that slides along the
// lease road, and probing the rock (pointer/tap → local field reveal with decaying memory). Everything is
// qualitative: no distance scale, no S/N bar, no numbers.
import { ROAD_RECT, SLAB, NOTCH, BENCH_Y } from './layout.js';
// THREE is injected by the caller (the world chunk owns three; UI chunks must never import it — spec §6).

export function createCircuit(island, THREE) {
  const group = new THREE.Group();
  group.name = 'circuit';
  island.parallax.add(group);
  const wellhead = island.paths.wellhead.clone();
  const sand = new THREE.Color('#e8dcc8');

  // Stake: a slim steel rod with a small cyan-capable cap; slides along the road (z from 2.4 down to -4.4).
  const stake = new THREE.Group();
  stake.name = 'ground-stake';
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 8), new THREE.MeshStandardMaterial({ color: '#8f9aa3', roughness: 0.5, metalness: 0.7 }));
  rod.position.y = 0.16;
  const capMat = new THREE.MeshBasicMaterial({ color: '#e8dcc8', toneMapped: false });
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), capMat);
  cap.position.y = 0.36;
  stake.add(rod, cap);
  // proxy for raycast: a fatter invisible cylinder
  const stakeProxy = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.6, 8), new THREE.MeshBasicMaterial({ visible: false }));
  stakeProxy.position.y = 0.3;
  stake.add(stakeProxy);
  const roadX = (ROAD_RECT.minX + ROAD_RECT.maxX) / 2;
  let sep = 0.6; // 0..1 along the road away from the pad
  function placeStake(t) { sep = THREE.MathUtils.clamp(t, 0, 1); stake.position.set(roadX, 0.05, ROAD_RECT.maxZ - sep * (ROAD_RECT.maxZ - ROAD_RECT.minZ)); }
  placeStake(sep);
  stake.visible = false;
  group.add(stake);

  // Wellhead reference: a thin ring on the wellhead block (V₁) — a proxy sphere for the raycast.
  const whRing = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.235, 48), new THREE.MeshBasicMaterial({ color: '#e8dcc8', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
  whRing.rotation.x = -Math.PI / 2; whRing.visible = false;
  whRing.position.set(wellhead.x, 0.34, wellhead.z);
  const whProxy = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
  whProxy.position.set(wellhead.x, 0.3, wellhead.z);
  group.add(whRing, whProxy);

  // The loop: wellhead → stake along the ground, drawn only when both references are placed.
  // A thin sand tube (a 1 px GL line was invisible at any distance under a software renderer — round 4);
  // its geometry is rebuilt when the stake moves and drawn progressively via drawRange.
  const loopMat = new THREE.MeshBasicMaterial({ color: '#e8dcc8', transparent: true, opacity: 0, depthWrite: false, depthTest: false, toneMapped: false });
  let loopGeom = new THREE.BufferGeometry();
  const loop = new THREE.Mesh(loopGeom, loopMat);
  loop.visible = false; // drawn only once both references are placed
  loop.frustumCulled = false; loop.renderOrder = 23;
  group.add(loop);
  const LOOP_SEGS = 24;
  function updateLoop() {
    const a = new THREE.Vector3(wellhead.x, 0.36, wellhead.z);
    const b = new THREE.Vector3(stake.position.x, 0.38, stake.position.z);
    const pts = [];
    for (let i = 0; i <= LOOP_SEGS; i++) {
      const t = i / LOOP_SEGS;
      const p = a.clone().lerp(b, t);
      p.y += Math.sin(t * Math.PI) * 0.12; // slight arc so it reads as a hairline in air, not a road stripe
      pts.push(p);
    }
    const next = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5), LOOP_SEGS, 0.012, 5, false);
    loop.geometry = next; loopGeom.dispose(); loopGeom = next;
    loopGeom.setDrawRange(0, Math.round(loopDraw * loopGeom.index.count));
  }
  let loopDraw = 0; // 0..1 draw progress
  updateLoop();

  const state = { wellhead: false, ground: false, closed: false, dashes: false };
  function set(next) {
    Object.assign(state, next);
    state.closed = state.wellhead && state.ground && sep > 0.06;
    stake.visible = state.ground;
    whRing.material.opacity = state.wellhead ? 0.9 : 0;
    whRing.visible = state.wellhead;
    capMat.color.set(state.closed ? '#22D3EE' : '#e8dcc8');
  }
  function update(dt) {
    const target = state.closed ? 1 : 0;
    loopDraw += (target - loopDraw) * (1 - Math.exp(-4 * dt));
    loopGeom.setDrawRange(0, Math.max(0, Math.round(loopDraw * loopGeom.index.count)));
    loopMat.opacity = 0.75 * Math.min(1, loopDraw * 1.4);
    loop.visible = loopDraw > 0.02;
  }

  // Probe: pointer/tap on rock → local field reveal. Cast against the four section planes.
  const planes = [
    { plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -BENCH_Y), inside: (p) => p.x > NOTCH.minX && p.x < NOTCH.maxX && p.z > NOTCH.minZ && p.z < NOTCH.maxZ },
    { plane: new THREE.Plane(new THREE.Vector3(1, 0, 0), -NOTCH.minX), inside: (p) => p.y < 0 && p.y > BENCH_Y && p.z > NOTCH.minZ && p.z < NOTCH.maxZ },
    { plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), -NOTCH.minZ), inside: (p) => p.y < 0 && p.y > BENCH_Y && p.x > NOTCH.minX && p.x < NOTCH.maxX },
    { plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), -SLAB.maxZ), inside: (p) => p.y < 0 && p.y > SLAB.baseY && p.x > SLAB.minX && p.x < NOTCH.minX },
  ];
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hit = new THREE.Vector3();
  const inv = new THREE.Matrix4();
  function probe(camera, canvas, clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, ((clientY - r.top) / r.height) * -2 + 1);
    ray.setFromCamera(ndc, camera);
    // to parallax-local space
    inv.copy(island.parallax.matrixWorld).invert();
    const localRay = ray.ray.clone().applyMatrix4(inv);
    let best = null, bestD = Infinity;
    for (const { plane, inside } of planes) {
      if (localRay.intersectPlane(plane, hit) && inside(hit)) { const d = localRay.origin.distanceTo(hit); if (d < bestD) { bestD = d; best = hit.clone(); } }
    }
    if (best) { island.field.probeAt(best); return best; }
    return null;
  }

  return { group, stake, stakeProxy, whProxy, state, set, update, placeStake, get sep() { return sep; }, probe, updateLoop };
}
