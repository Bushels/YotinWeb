// Ports of SignalRelay.tsx and LeasePad.tsx.
import * as THREE from 'three';
import { COLORS, PAD_RECT, ROAD_RECT } from './layout.js';
import { mergeIndexed } from './forest.js';

export function buildSignalRelay(wellhead) {
  const base = new THREE.Color(COLORS.emGlow);
  const mat = new THREE.MeshBasicMaterial({ color: COLORS.emGlow, transparent: true, opacity: 0, toneMapped: false, side: THREE.FrontSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.17, 0.25, 64), mat);
  ring.visible = false;
  ring.position.set(wellhead.x, wellhead.y + 0.06, wellhead.z);
  ring.rotation.x = -Math.PI / 2;
  ring.name = 'signal-relay';
  function update(p) {
    const active = p >= 0;
    ring.visible = active;
    if (!active) return;
    ring.scale.setScalar(0.55 + 3.6 * p);
    mat.opacity = Math.min(1, 1.18 * (1 - p) * Math.min(1, p / 0.05));
    mat.color.copy(base).multiplyScalar(1 + 2.7 * (1 - Math.min(1, p / 0.16)));
  }
  return { mesh: ring, update, setColor(c) { base.set(c); } };
}

export function buildLeasePad() {
  const group = new THREE.Group();
  group.name = 'lease-pad';
  // Surface steel is weathered, not showroom: at ch3 the rim light is at its strongest exactly as the scene goes
  // dark, and bright metal on the pad was out-shining the candle (round 5).
  const steel = new THREE.MeshStandardMaterial({ color: '#7d868c', roughness: 0.62, metalness: 0.5 });
  const padCx = (PAD_RECT.minX + PAD_RECT.maxX) / 2, padCz = (PAD_RECT.minZ + PAD_RECT.maxZ) / 2;
  const roadCx = (ROAD_RECT.minX + ROAD_RECT.maxX) / 2, roadLen = ROAD_RECT.maxZ - ROAD_RECT.minZ;

  const pad = new THREE.Mesh(new THREE.BoxGeometry(PAD_RECT.maxX - PAD_RECT.minX, 0.06, PAD_RECT.maxZ - PAD_RECT.minZ), new THREE.MeshStandardMaterial({ color: '#8d816c', roughness: 0.95 }));
  pad.position.set(padCx, 0.03, padCz); pad.name = 'gravel-pad';
  const road = new THREE.Mesh(new THREE.BoxGeometry(ROAD_RECT.maxX - ROAD_RECT.minX, 0.05, roadLen), new THREE.MeshStandardMaterial({ color: '#6e655a', roughness: 0.95 }));
  road.position.set(roadCx, 0.025, ROAD_RECT.minZ + roadLen / 2); road.name = 'lease-road';
  group.add(pad, road);

  // The drive head sits ON the wellhead — it drives the rod string through it. It used to stand 0.4 units in
  // front, so the surface end of the well read as an unfinished stub with a box beside it (round 8).
  const drive = new THREE.Group();
  drive.name = 'pcp-drive-head';
  drive.position.set(-5.2, 0, 5.0);
  // All the static steel merges into ONE mesh — a wellhead is five small parts and five draw calls is a bad trade.
  const stackGeoms = [];
  const push = (g, tf) => { tf(g); stackGeoms.push(g); };
  push(new THREE.CylinderGeometry(0.15, 0.17, 0.06, 12), (g) => g.translate(0, 0.2, 0));           // flange
  push(new THREE.CylinderGeometry(0.1, 0.13, 0.16, 12), (g) => g.translate(0, 0.31, 0));           // bonnet
  push(new THREE.BoxGeometry(0.2, 0.34, 0.2), (g) => g.translate(0, 0.56, 0));                      // drive housing
  push(new THREE.CylinderGeometry(0.035, 0.035, 0.26, 8), (g) => { g.rotateZ(Math.PI / 2); g.translate(-0.13, 0.26, 0); }); // wing valve
  push(new THREE.TorusGeometry(0.05, 0.014, 6, 14), (g) => { g.rotateY(Math.PI / 2); g.translate(-0.27, 0.26, 0); });        // handwheel
  const stack = new THREE.Mesh(mergeIndexed(stackGeoms), steel);
  stack.name = 'wellhead-stack';
  stackGeoms.forEach((g) => g.dispose());
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.18, 10), new THREE.MeshStandardMaterial({ color: '#6d281d', roughness: 0.6, metalness: 0.3 }));
  motor.position.set(0.16, 0.68, 0); motor.rotation.z = Math.PI / 2; motor.name = 'drive-motor';
  drive.add(stack, motor);
  group.add(drive);

  const tanks = new THREE.Group();
  tanks.name = 'tank-battery';
  [[-6.0, 3.4, '#6d281d'], [-5.3, 3.2, '#6d281d'], [-5.65, 4.1, '#96a0a5']].forEach(([x, z, color], i) => {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.5, 16), new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.35 }));
    t.position.set(x, 0.31, z); t.name = `tank-${i}`;
    tanks.add(t);
  });
  group.add(tanks);

  const separator = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.5, 4, 12), steel);
  separator.position.set(-4.4, 0.24, 3.1); separator.rotation.z = Math.PI / 2; separator.name = 'separator';
  const flare = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.9, 8), steel);
  flare.position.set(-3.95, 0.48, 2.8); flare.name = 'flare-stack';
  group.add(separator, flare);

  return { group, drive, motor, tanks, separator, flare };
}
