// Well system for the bench topology. Render semantics (spec §3): the cased J-build is a POSITIVE steel
// tubular on the front cut face; the open-hole trunk and legs are NEGATIVE dark rock-walled troughs whose
// centrelines lie on the bench (buried slightly past half so a rock lip overhangs) — never pipes on a shelf.
// The casing telescope reads 0.175 (surface collar) > 0.127 (7-in shell) > 0.100 (cased) > 0.086 > 0.070.
import * as THREE from 'three';
import { COLORS } from './layout.js';
import { RADII, Z_FACE as Z_FRONT } from './wellPath.js';
import { mergeIndexed } from './forest.js';

export function buildWellSystem(paths, mats) {
  const group = new THREE.Group();
  group.name = 'well';

  // Surface casing collar: short, concentric, top 15–20 % of the vertical run.
  const collarCurve = new THREE.CatmullRomCurve3([paths.cased.getPointAt(0), paths.cased.getPointAt(0.09), paths.cased.getPointAt(0.18)], false, 'catmullrom', 0.5);
  const surfaceCollar = new THREE.Mesh(
    new THREE.TubeGeometry(collarCurve, 12, RADII.surfaceCollar, 16, false),
    new THREE.MeshStandardMaterial({ color: '#5d666d', roughness: 0.7, metalness: 0.45, transparent: true, opacity: 0.32, depthWrite: false }),
  );
  surfaceCollar.name = 'surface-casing';
  group.add(surfaceCollar);

  // 7-in intermediate shell — a matte ghost (not a specular glass barrel: it read as a syringe, round 4) so the
  // production string reads inside it; it stops short of the heel so it never butts into the shoe.
  const shellPts = []; for (let i = 0; i <= 48; i++) shellPts.push(paths.cased.getPointAt((i / 48) * 0.93));
  const shellCurve = new THREE.CatmullRomCurve3(shellPts, false, 'catmullrom', 0.5);
  const shell = new THREE.Mesh(
    new THREE.TubeGeometry(shellCurve, 60, RADII.casedShell, 12, false),
    new THREE.MeshStandardMaterial({ color: COLORS.casingShell, transparent: true, opacity: 0.1, depthWrite: false, roughness: 0.85, metalness: 0.1 }),
  );
  shell.name = 'casing-shell';
  group.add(shell);

  // Cased production string — positive steel; carries the (sand-tinted) flow chevron material.
  const cased = new THREE.Mesh(new THREE.TubeGeometry(paths.cased, 80, RADII.cased, 16, false), mats.cased);
  cased.name = 'cased';
  group.add(cased);

  // Open-hole bores as negative troughs: a squashed wide tube sunk into the bench (rock-walled), plus a
  // slimmer inner "bore" tube in the flow material so production reads without a metallic pipe.
  const troughMat = new THREE.MeshStandardMaterial({ color: COLORS.trough, roughness: 0.95, metalness: 0 });
  const rimMat = new THREE.MeshStandardMaterial({ color: COLORS.boreRim, roughness: 0.9, metalness: 0 });
  const boreMeshes = [];
  const rimMeshes = [];
  const bores = [{ curve: paths.openHole, r: RADII.openHole, name: 'open-hole', mat: mats.openHole }, ...paths.laterals.map((c, i) => ({ curve: c, r: RADII.lateral, name: `lateral-${i}`, mat: mats.lateral, meta: c.userData }))];
  const meanY = (curve) => { let m = 0; const N = 9; for (let k = 0; k < N; k++) m += curve.getPointAt(k / (N - 1)).y; return m / N; };
  // Flatten each trough tube to a slot (y-scale 0.18) about its own mean height and sink it so the crown sits a
  // hairline proud of the bench: the lip 8 mm, the darker trough inside it 4 mm, the bore a sliver. Read: a dark
  // slot cut into lit rock, not a tube lying on a shelf (round-1 P0).
  const SQ = 0.18;
  const squash = (geom, my, sink) => { geom.translate(0, -my, 0); geom.scale(1, SQ, 1); geom.translate(0, my - sink, 0); return geom; };
  // Lips and troughs share one material each, so all seven merge into two draw calls (runtime budget, spec §6).
  const lipGeoms = [], troughGeoms = [];
  bores.forEach((b) => {
    const my = meanY(b.curve);
    lipGeoms.push(squash(new THREE.TubeGeometry(b.curve, 48, b.r * 2.6, 6, false), my, b.r * 2.6 * SQ - 0.008));
    troughGeoms.push(squash(new THREE.TubeGeometry(b.curve, 48, b.r * 2.0, 6, false), my, b.r * 2.0 * SQ - 0.004));
    // the bore itself, buried past half: only a sliver of the flow material shows in the slot floor
    const bore = new THREE.Mesh(new THREE.TubeGeometry(b.curve, 56, b.r, 8, false), b.mat);
    bore.position.y = -b.r * 0.88; // only the crown's sliver above the slot floor
    bore.name = b.name;
    bore.userData = { ...(b.meta || {}), bore: true };
    group.add(bore);
    boreMeshes.push(bore);
  });
  const lipMesh = new THREE.Mesh(mergeIndexed(lipGeoms), rimMat); lipMesh.name = 'bore-lips';
  const troughMesh = new THREE.Mesh(mergeIndexed(troughGeoms), troughMat); troughMesh.name = 'bore-troughs';
  lipGeoms.concat(troughGeoms).forEach((g) => g.dispose());
  group.add(lipMesh, troughMesh);
  rimMeshes.push(lipMesh);

  // Casing shoe — the OD step engineers look for, at the heel.
  const shoe = new THREE.Mesh(
    new THREE.TorusGeometry(RADII.cased * 1.1, 0.018, 8, 24),
    new THREE.MeshStandardMaterial({ color: '#8a949b', roughness: 0.6, metalness: 0.6 }),
  ); // the OD step at the heel — a dull thin step, not a glowing collar (round 4: the bright ring was the syringe flange)
  shoe.position.copy(paths.shoe);
  shoe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), paths.cased.getTangentAt(1).normalize());
  shoe.name = 'shoe';
  group.add(shoe);

  // Bore mouths on the back cut face: a dark ellipse with a thin sand rim where a leg enters solid rock.
  const mouths = new THREE.Group();
  mouths.name = 'bore-mouths';
  // All mouth rims merge into one mesh and all discs into another (two draw calls, not two per mouth).
  const mouthRimMat = new THREE.MeshBasicMaterial({ color: '#d9cfbd', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  const discMat = new THREE.MeshBasicMaterial({ color: '#05030a', side: THREE.DoubleSide });
  const rimGeoms = [], discGeoms = [];
  paths.boreMouths.forEach((m) => {
    const r = m.r || RADII.lateral;
    const ring = new THREE.RingGeometry(r * 0.9, r * 1.25, 32);
    const disc = new THREE.CircleGeometry(r * 0.9, 32);
    // back wall (z = -0.6): the ring lies in that plane facing +z; left wall (x = -1.6): facing +x
    [ring, disc].forEach((g) => { if (m.plane === 'left') { g.rotateY(Math.PI / 2); g.translate(m.point.x + 0.004, m.point.y, m.point.z); } else if (m.plane === 'front') { g.translate(m.point.x, m.point.y, Z_FRONT + 0.004); } else { g.translate(m.point.x, m.point.y, m.point.z + 0.004); } });
    rimGeoms.push(ring); discGeoms.push(disc);
  });
  // The buried run of the cased string (where it leaves the front face and travels through rock to the notch
  // wall) is drawn as a ghost hairline that reads through the rock, so the eye can follow casing → mouth → heel
  // (round 4: the hand-off did not read — the string vanished for ~400 px).
  if (paths.casedBuried) {
    const { u0, u1 } = paths.casedBuried;
    const pts = []; const N = 24; for (let i = 0; i <= N; i++) pts.push(paths.cased.getPointAt(u0 + (u1 - u0) * (i / N)));
    const ghostCurve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
    const ghost = new THREE.Mesh(new THREE.TubeGeometry(ghostCurve, 32, 0.014, 6, false), new THREE.MeshBasicMaterial({ color: '#d9cfbd', transparent: true, opacity: 0.38, depthTest: false, depthWrite: false, toneMapped: false }));
    ghost.name = 'cased-ghost'; ghost.renderOrder = 22;
    group.add(ghost);
  }
  if (rimGeoms.length) {
    const rims = new THREE.Mesh(mergeIndexed(rimGeoms), mouthRimMat); rims.name = 'bore-mouth-rims';
    const discs = new THREE.Mesh(mergeIndexed(discGeoms), discMat); discs.name = 'bore-mouths-discs';
    mouths.add(discs, rims);
    rimGeoms.concat(discGeoms).forEach((g) => g.dispose());
  }
  group.add(mouths);

  // Wellhead stub + block at grade.
  const wellhead = new THREE.Group();
  wellhead.name = 'wellhead';
  wellhead.position.set(paths.wellhead.x, 0, paths.wellhead.z);
  const stub = new THREE.Mesh(new THREE.CylinderGeometry(RADII.surfaceCollar * 0.86, RADII.surfaceCollar * 0.86, 0.5, 12), new THREE.MeshStandardMaterial({ color: '#5b6770', roughness: 0.5, metalness: 0.7 }));
  stub.position.y = -0.22;
  const block = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.16), new THREE.MeshStandardMaterial({ color: '#39424a', roughness: 0.45, metalness: 0.8 }));
  block.position.y = 0.16;
  wellhead.add(stub, block);
  group.add(wellhead);

  return { group, surfaceCollar, shell, cased, boreMeshes, rimMeshes, shoe, wellhead, mouths };
}

// A cross-section witness ring at an exposed toe: rock wall, open bore, cut-plane line (spec §3, 700 ms).
export function buildBoreWitness(point, tangent, r) {
  const g = new THREE.Group();
  g.name = 'bore-witness';
  const wall = new THREE.Mesh(new THREE.RingGeometry(r * 1.05, r * 1.6, 32), new THREE.MeshBasicMaterial({ color: '#8a7a62', transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
  const bore = new THREE.Mesh(new THREE.CircleGeometry(r * 1.05, 32), new THREE.MeshBasicMaterial({ color: '#05030a', side: THREE.DoubleSide, depthWrite: false }));
  const cut = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([-r * 1.9, 0, 0, r * 1.9, 0, 0], 3)), new THREE.LineBasicMaterial({ color: '#e8dcc8', transparent: true, opacity: 0.8 }));
  g.add(wall, bore, cut);
  g.position.copy(point);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent.clone().normalize());
  g.visible = false;
  return g;
}
