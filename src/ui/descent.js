// Chapter 1 (spec §4 row 1): the Signal / Measure / Insight strip becomes three depth markers on the well —
// 01 the tool (sensors + collar at the heel), 02 the sensors (same place, the measurement), 03 the receiver
// at the wellhead. They light in sequence as the descent passes them; hovering/focusing a strip step warms
// its marker. Strip steps are the visible twins (≥ 44 px). No numbers.

export function mountDescent() {
  const steps = Array.from(document.querySelectorAll('.signal-step'));
  if (!steps.length) return null;
  function attach(w) {
    const THREE = w.THREE;
    const island = w.island;
    const ringGeom = new THREE.RingGeometry(0.16, 0.2, 40);
    const mk = (pos, normal) => {
      const m = new THREE.Mesh(ringGeom, new THREE.MeshBasicMaterial({ color: '#e8dcc8', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
      m.position.copy(pos);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      m.renderOrder = 20;
      island.parallax.add(m);
      return m;
    };
    const heel = island.paths.openHole.getPointAt(0.03);
    const tangent = island.paths.openHole.getTangentAt(0.03).normalize();
    const markers = [
      mk(heel.clone().addScaledVector(tangent, -0.45), tangent),             // 01 signal: the tool
      mk(heel.clone().addScaledVector(tangent, 0.45), tangent),              // 02 measure: the sensors
      mk(new THREE.Vector3(island.paths.wellhead.x, 0.42, island.paths.wellhead.z), new THREE.Vector3(0, 1, 0)), // 03 insight: the receiver
    ];
    const lit = [0, 0, 0], warm = [0, 0, 0];
    steps.forEach((li, i) => {
      li.dataset.hotspot = `strip-0${i + 1}`;
      li.setAttribute('tabindex', '0');
      w.interactions.register(`strip-0${i + 1}`, { proxy: null, twin: li, chapters: [[0.55, 2.2]], apply3D(state) { warm[i] = state === 'hover' || state === 'focus' || state === 'active' ? 1 : 0; }, onActivate() {} });
    });
    // at: where along chapter 1 each marker lights (01 at the tool ~0.98 of the descent, 02 same, 03 surface first)
    const AT = [0.9, 0.97, 0.35];
    document.addEventListener('world:progress', (e) => {
      const p = e.detail.exact;
      const d = Math.min(1, Math.max(0, p - 1));
      const inRange = p >= 0.55 && p < 2.6;
      for (let i = 0; i < 3; i++) lit[i] = inRange && d >= AT[i] ? 1 : 0;
    });
    const tick = () => {
      for (let i = 0; i < 3; i++) {
        const target = Math.min(1, lit[i] * 0.55 + warm[i] * 0.45);
        const m = markers[i].material;
        m.opacity += (target - m.opacity) * 0.12;
        markers[i].visible = m.opacity > 0.01;
        m.color.set(warm[i] ? '#f27622' : '#e8dcc8');
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  if (window.__yotinWorld) attach(window.__yotinWorld);
  else document.addEventListener('world:first-frame', () => attach(window.__yotinWorld), { once: true });
  return true;
}
