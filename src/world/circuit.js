// Chapter 3 world pieces (spec §4 row 3, §12): the pre-lit receiver footprint on the pad, the receiver that
// plants on it, the hairline loop back to the wellhead that only draws once the receiver is down, and probing
// the rock (pointer/tap → local field reveal with decaying memory). Everything is qualitative: no distance
// scale, no separation axis, no S/N bar, no numbers — and the wellhead end is never labelled a "reference".
import { ROAD_RECT, SLAB, NOTCH, BENCH_Y } from './layout.js';
import { buildWellheadCharts } from './charts.js';
// THREE is injected by the caller (the world chunk owns three; UI chunks must never import it — spec §6).

export function createCircuit(island, THREE) {
  const group = new THREE.Group();
  group.name = 'circuit';
  island.parallax.add(group);
  const wellhead = island.paths.wellhead.clone();
  const sand = new THREE.Color('#e8dcc8');

  // The receiver: a slim steel mast with a small cyan-capable cap. It stands wherever it is planted; the
  // pre-lit footprint on the pad is the one spot the commissioning list invites (round 13).
  const stake = new THREE.Group();
  stake.name = 'lease-receiver';
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.52, 8), new THREE.MeshStandardMaterial({ color: '#b9c2c9', roughness: 0.45, metalness: 0.6 }));
  rod.position.y = 0.24;
  const capMat = new THREE.MeshBasicMaterial({ color: '#e8dcc8', toneMapped: false });
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), capMat);
  cap.position.y = 0.52;
  stake.add(rod, cap);
  // proxy for raycast: a fatter invisible cylinder
  const stakeProxy = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.6, 8), new THREE.MeshBasicMaterial({ visible: false }));
  stakeProxy.position.y = 0.3;
  stake.add(stakeProxy);
  // Separation 0 means the two references are IN THE SAME PLACE — the stake stands on the wellhead itself, which
  // is what the "no difference, no reading" beat claims (spec §12). The first 15 % of the travel walks the stake
  // off the wellhead onto the head of the road; the rest runs it down the road away from the pad. (Round 5: sep 0
  // used to leave the stake 2.5 units away on the pad edge while the copy said "same place".)
  const roadX = (ROAD_RECT.minX + ROAD_RECT.maxX) / 2;
  const ROAD_HEAD = new THREE.Vector3(roadX, 0.05, ROAD_RECT.maxZ);
  const ROAD_TOE = new THREE.Vector3(roadX, 0.05, ROAD_RECT.minZ);
  const AT_WELLHEAD = new THREE.Vector3(wellhead.x, 0.05, wellhead.z);
  // The receiver's footprint: firm ground on the lease pad, clear of the tank battery, the separator and the
  // flare, and a good stride off the wellhead — near it, plainly not it.
  const RECEIVER = new THREE.Vector3(-4.3, 0.05, 4.3);
  let sep = 0.6; // kept for the road walk (0 = on the wellhead, 1 = the far end of the road)
  function placeStake(t) {
    sep = THREE.MathUtils.clamp(t, 0, 1);
    if (sep < 0.15) stake.position.lerpVectors(AT_WELLHEAD, ROAD_HEAD, sep / 0.15);
    else stake.position.lerpVectors(ROAD_HEAD, ROAD_TOE, (sep - 0.15) / 0.85);
    updateLoop();
  }
  function placeStakeAt(p) { stake.position.copy(p); updateLoop(); }

  // The footprint reticle: two hairline sand rings lying on the pad, lit before anything is placed so the spot
  // reads as a real place to put something (Target / Google Arts). It is not a target to shoot at — it is the
  // outline of the thing that goes there, and it goes out the moment the receiver stands on it.
  const footMat = new THREE.MeshBasicMaterial({ color: '#e8dcc8', transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
  const footprint = new THREE.Group();
  footprint.name = 'receiver-footprint';
  [[0.14, 0.158], [0.26, 0.272]].forEach(([a, b]) => {
    const r = new THREE.Mesh(new THREE.RingGeometry(a, b, 40), footMat);
    r.rotation.x = -Math.PI / 2;
    footprint.add(r);
  });
  footprint.position.set(RECEIVER.x, 0.075, RECEIVER.z);
  footprint.visible = false;
  group.add(footprint);
  const receiverProxy = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.7, 8), new THREE.MeshBasicMaterial({ visible: false }));
  receiverProxy.position.set(RECEIVER.x, 0.3, RECEIVER.z);
  group.add(receiverProxy);
  function showFootprint(on) { footprint.visible = Boolean(on) && !state.placed; }
  function highlightFootprint(on) { footMat.opacity = on ? 0.85 : 0.42; }

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
    if (a.distanceTo(b) < 0.05) { loop.visible = false; return; } // receiver standing on the wellhead: there is no loop to draw
    const next = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5), LOOP_SEGS, 0.018, 5, false);
    loop.geometry = next; loopGeom.dispose(); loopGeom = next;
    loopGeom.setDrawRange(0, Math.round(loopDraw * loopGeom.index.count));
  }
  let loopDraw = 0; // 0..1 draw progress
  placeStakeAt(RECEIVER); // now that updateLoop exists: seats the receiver on its footprint and builds the loop

  // The acquire beat (round 12d, Kyle): placing the receiver is answered by ONE sequence — the reading climbs
  // the cased string from the collar to the wellhead, and chart glyphs unfold there. It runs once per
  // placement, it settles, and it never idles (spec §0).
  //
  //   0 → 0.70 s   THE CLIMB — the field's own line-source term (field.js: the fourth plane carries the return
  //                up the casing) walked in time: a travelling window along the sheath, collar → wellhead. No
  //                second stroke set, no extra draw call.
  //   0.60 → 1.22 s THE BLOOM — three chart glyphs unfold at the wellhead and hold (charts.js, one draw call).
  //   1.50 s        the caller's honest wait (ui/signal.js WAIT_MS) ends and the reading lands.
  const CLIMB_S = 0.70, BLOOM_AT = 0.60;
  const charts = buildWellheadCharts(THREE, new THREE.Vector3(wellhead.x, 1.62, wellhead.z));
  group.add(charts.mesh);
  let acquire = -1;             // < 0: nothing is being acquired
  function startAcquire() { if (acquire >= 0) return; acquire = 0; island.field.setClimb(island.field.collarT, 0); }
  function settleAcquire() { acquire = 99; island.field.setClimb(-1, 0); charts.settle(); }
  function clearAcquire() { acquire = -1; island.field.setClimb(-1, 0); charts.clear(); }
  function stepAcquire(dt, camera) {
    if (acquire < 0) return false;
    let busy = false;
    if (acquire < CLIMB_S) {
      acquire += dt;
      const u = Math.min(1, acquire / CLIMB_S);
      const e = u * u * (3 - 2 * u);                                   // smoothstep: leaves the collar, arrives at surface
      // collarT → 1: the field's string parameter runs 0 at the heel to 1 at the wellhead (measured, see
      // field.js), so the window climbs UP from the collar to surface. Sweeping it the other way sent the
      // reading down the hole (round 12d, caught in the frames).
      island.field.setClimb(island.field.collarT + (1 - island.field.collarT) * e, 0.95 * Math.sin(Math.PI * Math.min(1, u * 1.08)));
      if (acquire >= CLIMB_S) island.field.setClimb(-1, 0);             // the window is gone the moment it reaches the wellhead
      busy = true;
    } else if (acquire < 99) {
      acquire += dt;
    }
    if (acquire >= BLOOM_AT) charts.start();
    busy = charts.update(dt, camera) || busy;
    return busy;
  }

  // One truth, one flag: `placed` is whether a receiver stands on the lease. `landed` is whether a reading has
  // arrived — the only thing licensed to take cyan.
  const state = { placed: false, closed: false, landed: false };
  function set(next) {
    const wasClosed = state.closed, wasPlaced = state.placed;
    Object.assign(state, next);
    // The receiver is lifted: the climb residue and the charts go AT ONCE — the same hard-reset discipline the
    // loop already keeps, because the caption is about to say nothing is listening (round 5, round 12d).
    if (wasPlaced && !state.placed) clearAcquire();
    state.closed = state.placed;
    stake.visible = state.placed;
    footprint.visible = footprint.visible && !state.placed;
    whRing.material.opacity = state.placed ? 0.9 : 0;
    whRing.visible = state.placed;
    capMat.color.set(state.landed ? '#22D3EE' : '#e8dcc8');
    // Opening the loop is instant — the world must never show a drawn loop while the caption says there is no
    // reading (round 5). Closing it still eases in (update()).
    if (wasClosed && !state.closed) { loopDraw = 0; loopMat.opacity = 0; loop.visible = false; loopGeom.setDrawRange(0, 0); }
  }
  // Returns true while something is still moving, so the caller can keep the on-demand renderer awake.
  function update(dt, camera) {
    const busy = stepAcquire(dt, camera);
    if (!state.closed) { if (loop.visible) { loopDraw = 0; loopMat.opacity = 0; loop.visible = false; loopGeom.setDrawRange(0, 0); } return busy; }
    loopDraw += (1 - loopDraw) * (1 - Math.exp(-4 * dt));
    loopGeom.setDrawRange(0, Math.max(0, Math.round(loopDraw * loopGeom.index.count)));
    loopMat.opacity = 0.75 * Math.min(1, loopDraw * 1.4);
    loop.visible = loopDraw > 0.02;
    return busy || loopDraw < 0.99;
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

  return { group, stake, stakeProxy, whProxy, receiverProxy, RECEIVER, state, set, update, placeStake, placeStakeAt, showFootprint, highlightFootprint, get sep() { return sep; }, probe, updateLoop, charts, startAcquire, settleAcquire, clearAcquire };
}
