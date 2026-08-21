// Chapter 3, the bloom (spec §0 lead decision 2026-08-21, §4 row 3, §5, §13b): once a reading has climbed the
// string, a small set of chart glyphs unfolds out of the receiver — the binary the tool sent becoming something
// a person can read. Kyle's call, round 14a: abstract chart glyphs are licensed marketing iconography; the bar
// is no blatant lies, and a shape that carries no printed value and no axis asserts nothing.
//
// They are GLYPHS, not charts. No axes, no tick labels, no numbers, no plotted values: three abstract marks
// whose SHAPES echo the directions the three representative rows already state (a pressure trace that settles,
// a temperature bar set that steps up, a vibration trace that stays quiet). Nothing here claims data.
//
// Cost: ONE draw call. Three quads live in a single InstancedMesh sharing one canvas atlas; the per-instance
// tile is chosen by an instanced attribute, so the whole bloom is one material and one geometry. The mesh is
// invisible — and therefore unrendered and uncounted — until a receiver is placed.
//
// Motion discipline (spec §0): nothing here idles. The bloom is a response to the placement, it settles, and it
// then HOLDS as a quiet fixture until the receiver is lifted, at which point it goes at once — no eased fade
// while the caption says nothing is listening.

const TILE_W = 256, TILE_H = 160, TILES = 3;
const SAND = '#e8dcc8';
const CYAN = '#22D3EE';

function drawAtlas() {
  const c = document.createElement('canvas');
  c.width = TILE_W; c.height = TILE_H * TILES;
  const g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);

  const card = (row) => {
    const y = row * TILE_H;
    g.save();
    g.translate(0, y);
    g.fillStyle = 'rgba(6,9,11,0.84)';
    g.strokeStyle = 'rgba(232,220,200,0.42)';
    g.lineWidth = 3;
    const r = 12, w = TILE_W - 14, h = TILE_H - 14;
    g.beginPath(); g.roundRect(7, 7, w, h, r); g.fill(); g.stroke();
    // the one horizontal rule is a baseline, not an axis: no ticks, no labels
    g.strokeStyle = 'rgba(232,220,200,0.20)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(26, TILE_H - 34); g.lineTo(TILE_W - 26, TILE_H - 34); g.stroke();
    return () => g.restore();
  };
  const trace = (pts, color, width) => {
    g.strokeStyle = color; g.lineWidth = width; g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath();
    pts.forEach(([x, yy], i) => (i ? g.lineTo(x, yy) : g.moveTo(x, yy)));
    g.stroke();
  };

  // 0 — a trace that rises and settles (the shape of a pressure build, drawn as a shape and nothing more)
  let done = card(0);
  trace([[28, 100], [52, 92], [76, 74], [100, 58], [124, 46], [148, 40], [176, 37], [204, 36], [228, 36]], SAND, 5);
  g.fillStyle = CYAN; g.beginPath(); g.arc(228, 36, 6.5, 0, Math.PI * 2); g.fill(); // the live end: the one cyan accent
  done();

  // 1 — a stepped bar set (the shape of a temperature climb)
  done = card(1);
  const bars = [0.30, 0.42, 0.51, 0.63, 0.72, 0.86];
  bars.forEach((h, i) => {
    const bw = 22, gap = 12, x = 30 + i * (bw + gap), top = (TILE_H - 34) - h * 76;
    g.fillStyle = 'rgba(232,220,200,0.86)';
    g.beginPath(); g.roundRect(x, top, bw, (TILE_H - 34) - top, 4); g.fill();
  });
  done();

  // 2 — a quiet band (the shape of a vibration trace that stays inside its envelope)
  done = card(2);
  const quiet = [];
  for (let i = 0; i <= 22; i++) {
    const x = 28 + i * 9.1;
    const y = 70 + Math.sin(i * 1.31) * 7 + Math.sin(i * 0.47 + 2.1) * 5;
    quiet.push([x, y]);
  }
  trace(quiet, SAND, 4);
  done();

  return c;
}

export function buildWellheadCharts(THREE, anchor) {
  const atlas = new THREE.CanvasTexture(drawAtlas());
  atlas.colorSpace = THREE.SRGBColorSpace;
  atlas.anisotropy = 1;
  const geom = new THREE.PlaneGeometry(0.70, 0.44);
  const mat = new THREE.MeshBasicMaterial({ map: atlas, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
  mat.customProgramCacheKey = () => 'wellhead-charts-v1';
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float aTile; attribute float aFade; varying float vFade;`)
      .replace('#include <uv_vertex>', `#include <uv_vertex>
        vMapUv = vec2(vMapUv.x, (vMapUv.y + aTile) / ${TILES}.0);
        vFade = aFade;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vFade;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        diffuseColor.a *= vFade;`);
  };
  const mesh = new THREE.InstancedMesh(geom, mat, TILES);
  mesh.name = 'wellhead-charts';
  mesh.frustumCulled = false;
  mesh.renderOrder = 24;
  mesh.visible = false;
  const tiles = new Float32Array([0, 1, 2]);
  geom.setAttribute('aTile', new THREE.InstancedBufferAttribute(tiles, 1));
  const fades = new THREE.InstancedBufferAttribute(new Float32Array(TILES), 1);
  geom.setAttribute('aFade', fades);

  // Per-glyph state: t counts up from its own stagger, 0 → 1 over RISE_MS, then holds.
  const DELAY = [0, 0.13, 0.26];
  const RISE = 0.36;
  const FAN_BIAS = 0.10, FAN_STEP = 0.62;
  const p = [0, 0, 0];
  let clock = -1;            // < 0 = nothing has been acquired
  const base = anchor.clone();
  const dummy = new THREE.Object3D();
  const right = new THREE.Vector3(), camPos = new THREE.Vector3(), pos = new THREE.Vector3();

  function layout(camera) {
    if (!camera) return;
    // Cylindrical fan: the row spreads across the viewer's screen-right on the ground plane, each glyph
    // billboarded so a chart is never read edge-on. Cheap — three matrices, no extra draw.
    camera.getWorldPosition(camPos);
    right.set(camPos.x - base.x, 0, camPos.z - base.z);
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
    right.normalize();
    right.set(right.z, 0, -right.x); // rotate 90° about +y: screen-RIGHT on the ground plane (measured, not assumed)
    for (let i = 0; i < TILES; i++) {
      const e = p[i] <= 0 ? 0 : 1 - Math.pow(1 - p[i], 3);
      // Round 12d fanned the row to the viewer's RIGHT of the WELLHEAD, because chapter 3's copy card owns the
      // left 60 % of the frame and a centred fan put the first glyph behind it. Round 14a re-anchors the row on
      // the RECEIVER, which already stands right of that card — so the fan is tightened and centred on its own
      // anchor instead, and the three cards stay one tight row over the thing they came out of rather than
      // trailing off into the treeline (measured on the signal-closed frame).
      pos.copy(base).addScaledVector(right, FAN_BIAS + (i - 1) * FAN_STEP);
      pos.y = base.y - 0.24 + 0.24 * e;   // unfolds UP out of its anchor
      dummy.position.copy(pos);
      dummy.quaternion.copy(camera.quaternion);
      dummy.scale.setScalar(0.001 + 0.999 * (0.72 + 0.28 * e));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      fades.array[i] = e;
    }
    mesh.instanceMatrix.needsUpdate = true;
    fades.needsUpdate = true;
  }

  return {
    mesh,
    // The row's origin. Round 14a: the glyphs rise out of the RECEIVER the visitor just planted rather than
    // out of free air over the tank battery, and they follow it if it is moved.
    setAnchor(x, y, z) { base.set(x, y, z); },
    // A response to the act: begins at the moment the reading reaches the wellhead.
    start() { if (clock < 0) { clock = 0; p[0] = p[1] = p[2] = 0; mesh.visible = true; } },
    // Reduced motion / a state carried in from the DOM-only path: settled, on arrival, with no rise to watch.
    settle() { clock = 99; p[0] = p[1] = p[2] = 1; mesh.visible = true; },
    // The receiver is lifted: the charts go at once. Nothing lingers past the claim.
    clear() { clock = -1; p[0] = p[1] = p[2] = 0; mesh.visible = false; fades.array.fill(0); fades.needsUpdate = true; },
    get busy() { return clock >= 0 && clock < DELAY[TILES - 1] + RISE; },
    update(dt, camera) {
      if (clock < 0) return false;
      const wasBusy = clock < DELAY[TILES - 1] + RISE;
      if (wasBusy) {
        clock += dt;
        for (let i = 0; i < TILES; i++) p[i] = Math.max(0, Math.min(1, (clock - DELAY[i]) / RISE));
      }
      layout(camera);
      return wasBusy;
    },
  };
}
