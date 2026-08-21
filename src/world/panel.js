// Chapter 3, the arrival (spec §4 row 3, §5, §13b): once a reading has climbed the string, a small instrument
// panel face lights AT THE RECEIVER — the thing the visitor just set on the pad.
//
// What it is NOT (round 13, Kyle's call): it is not three chart glyphs. The retired bloom was three rounded
// dark cards billboarded at the camera, floating over the tank battery with no mount, no mast, no cable and no
// contact shadow — the "status bubble over the building" idiom — and its content was a rising-and-settling
// trace with a live end-dot, a six-bar stepped column set and a sine band. A six-bar chart with differing
// heights asserts a distribution and a crested curve asserts a trend; §0 bans the FORM ("No sparklines, no
// invented data"), not merely the numbers.
//
// What it is: the face of a lease panel. A dark steel plate with a bezel and four screws, THREE EMPTY numeric
// windows that light in sequence, and a needle that sweeps once and settles. No values. No axes. No labels. No
// rounded SaaS card, no BI chrome. Nothing on it can be read as a measurement, because nothing on it is a
// measurement — the only numbers on this chapter live in the DOM readout, under their "representative values"
// chip, where §0 requires them to live.
//
// Cost: ONE draw call. A single quad, a single material, one small canvas atlas for the plate face; the
// windows and the needle are computed in the fragment shader from three uniforms, so the sequence costs no
// extra geometry and no extra pass. It is MeshStandardMaterial, so the plate takes the same dusk light as the
// rest of the pad and stops reading as an unlit HUD; only the windows and the needle are self-lit, which is
// what a backlit panel actually does at dusk.
//
// Mounting: the plate is a child of the receiver group, so it stands where the receiver stands and moves with
// it. Its orientation is fixed in SCENE space (a yaw resolved once, on the first frame, from where the visitor
// is standing) — never re-aimed at the camera per frame.
//
// Motion discipline (spec §0): nothing here idles. It is a response to the placement, it settles, and it then
// HOLDS as a quiet fixture until the receiver is lifted, at which point it goes at once.

const TEX_W = 256, TEX_H = 160;
const SAND = '#e8dcc8';

// Plate-face geometry, in canvas pixels — shared by the atlas painter and the fragment shader so the lit
// windows land exactly inside the recesses that were painted for them.
const WIN = [[86, 37], [86, 75], [86, 113]];   // centres
const WIN_HALF = [64, 15];
const PIVOT = [200, 118], R_IN = 40, R_OUT = 62, A0 = 210, A1 = 330; // degrees, canvas space (y down)

function drawPlate() {
  const c = document.createElement('canvas');
  c.width = TEX_W; c.height = TEX_H;
  const g = c.getContext('2d');
  g.clearRect(0, 0, TEX_W, TEX_H);

  // the plate: painted steel, a hard bezel, four screws. A square-cornered plate with a machined edge, not a
  // card with a 12 px radius — the radius was half of what made the retired glyphs read as app UI.
  g.fillStyle = '#242c33';
  g.fillRect(4, 4, TEX_W - 8, TEX_H - 8);
  g.strokeStyle = 'rgba(232,220,200,0.46)'; g.lineWidth = 3;
  g.strokeRect(5.5, 5.5, TEX_W - 11, TEX_H - 11);
  g.strokeStyle = 'rgba(232,220,200,0.18)'; g.lineWidth = 2;
  g.strokeRect(12, 12, TEX_W - 24, TEX_H - 24);
  g.fillStyle = 'rgba(232,220,200,0.52)';
  [[14, 14], [TEX_W - 14, 14], [14, TEX_H - 14], [TEX_W - 14, TEX_H - 14]].forEach(([x, y]) => {
    g.beginPath(); g.arc(x, y, 3.4, 0, Math.PI * 2); g.fill();
  });

  // three EMPTY numeric windows: recessed, dark, bezelled. No digits are ever painted into them — the shader
  // lights the recess itself, which is what a window with nothing decoded in it looks like when it wakes up.
  WIN.forEach(([cx, cy]) => {
    g.fillStyle = '#0a0e11';
    g.fillRect(cx - WIN_HALF[0], cy - WIN_HALF[1], WIN_HALF[0] * 2, WIN_HALF[1] * 2);
    g.strokeStyle = 'rgba(232,220,200,0.40)'; g.lineWidth = 2;
    g.strokeRect(cx - WIN_HALF[0] + 1, cy - WIN_HALF[1] + 1, WIN_HALF[0] * 2 - 2, WIN_HALF[1] * 2 - 2);
  });

  // the needle's scale: an arc of ticks and a pivot boss. The needle itself lives in the shader.
  const rad = (d) => (d * Math.PI) / 180;
  g.strokeStyle = 'rgba(232,220,200,0.50)'; g.lineWidth = 2;
  g.beginPath(); g.arc(PIVOT[0], PIVOT[1], R_OUT, rad(A0), rad(A1)); g.stroke();
  g.strokeStyle = 'rgba(232,220,200,0.62)';
  for (let i = 0; i <= 8; i++) {
    const a = rad(A0 + ((A1 - A0) * i) / 8);
    const long = i % 4 === 0;
    const r0 = long ? R_IN + 6 : R_OUT - 9;
    g.lineWidth = long ? 3 : 2;
    g.beginPath();
    g.moveTo(PIVOT[0] + Math.cos(a) * r0, PIVOT[1] + Math.sin(a) * r0);
    g.lineTo(PIVOT[0] + Math.cos(a) * R_OUT, PIVOT[1] + Math.sin(a) * R_OUT);
    g.stroke();
  }
  g.fillStyle = 'rgba(232,220,200,0.72)';
  g.beginPath(); g.arc(PIVOT[0], PIVOT[1], 5, 0, Math.PI * 2); g.fill();

  return c;
}

export function buildReceiverPanel(THREE, host) {
  const tex = new THREE.CanvasTexture(drawPlate());
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 1;

  const geom = new THREE.PlaneGeometry(0.38, 0.2375); // 256:160
  const uniforms = {
    uWin: { value: new THREE.Vector3(0, 0, 0) },
    uNeedle: { value: 0 },
    uFade: { value: 0 },
    uLit: { value: new THREE.Color(SAND) },
  };
  const mat = new THREE.MeshStandardMaterial({
    map: tex, transparent: true, roughness: 0.58, metalness: 0.35, side: THREE.DoubleSide,
  });
  mat.customProgramCacheKey = () => 'receiver-panel-v1';
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vPUv;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvPUv = uv;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec2 vPUv; uniform vec3 uWin; uniform float uNeedle; uniform float uFade; uniform vec3 uLit;
        float boxMask(vec2 p, vec2 c, vec2 h) { vec2 d = abs(p - c) - h; return step(max(d.x, d.y), 0.0); }`)
      .replace('#include <map_fragment>', '#include <map_fragment>\n        diffuseColor.a *= uFade;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          // canvas space: x right, y DOWN, matching the atlas painter above
          vec2 P = vec2(vPUv.x * ${TEX_W}.0, (1.0 - vPUv.y) * ${TEX_H}.0);
          float lit = 0.0;
          lit += boxMask(P, vec2(${WIN[0][0]}.0, ${WIN[0][1]}.0), vec2(${WIN_HALF[0]}.0 - 4.0, ${WIN_HALF[1]}.0 - 4.0)) * uWin.x;
          lit += boxMask(P, vec2(${WIN[1][0]}.0, ${WIN[1][1]}.0), vec2(${WIN_HALF[0]}.0 - 4.0, ${WIN_HALF[1]}.0 - 4.0)) * uWin.y;
          lit += boxMask(P, vec2(${WIN[2][0]}.0, ${WIN[2][1]}.0), vec2(${WIN_HALF[0]}.0 - 4.0, ${WIN_HALF[1]}.0 - 4.0)) * uWin.z;
          // the needle: a segment pivoting through the painted arc. It sweeps once and settles; it never idles.
          float a = radians(mix(${A0}.0, ${A1}.0, clamp(uNeedle, 0.0, 1.0)));
          vec2 dir = vec2(cos(a), sin(a));
          vec2 rel = P - vec2(${PIVOT[0]}.0, ${PIVOT[1]}.0);
          float t = clamp(dot(rel, dir), 0.0, ${R_OUT}.0 - 4.0);
          float d = length(rel - dir * t);
          float needle = smoothstep(2.6, 1.0, d) * step(3.0, t) * uWin.z;
          // the windows glow like a backlit recess; the needle is the one hard-edged mark on the face
          totalEmissiveRadiance += uLit * ((lit * 0.52 + needle * 0.95) * uFade);
        }`);
  };

  const mesh = new THREE.Mesh(geom, mat);
  mesh.name = 'receiver-panel';
  mesh.visible = false;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  // mounted ON the receiver: the mast is 0.52 tall, so the plate rides its upper body, standing slightly proud
  // of the tube so it is a face bolted to a stand and not a decal.
  mesh.position.set(0, 0.41, 0.052);
  host.add(mesh);

  // Per-beat state. Same shape the retired bloom used, so the lifecycle in circuit.js and the timing test that
  // pins the wait against the settle both read the same two constants.
  const DELAY = [0, 0.13, 0.26];
  const RISE = 0.36;
  const p = [0, 0, 0];
  let clock = -1;   // < 0 = nothing has been acquired
  let yawSet = false;
  const _v = new THREE.Vector3();

  // Fixed scene-space orientation, resolved ONCE from where the visitor is standing, then frozen: an instrument
  // face is aimed at whoever reads it, but it does not follow them around the lease.
  const _h = new THREE.Vector3();
  function orient(camera) {
    if (yawSet || !camera) return;
    camera.getWorldPosition(_v);
    host.getWorldPosition(_h);
    mesh.rotation.set(-0.14, Math.atan2(_v.x - _h.x, _v.z - _h.z), 0); // slight upward tilt: a panel you read standing
    yawSet = true;
  }

  function apply() {
    const e = (i) => (p[i] <= 0 ? 0 : 1 - Math.pow(1 - p[i], 3));
    uniforms.uWin.value.set(e(0), e(1), e(2));
    // The needle answers the last window: it sweeps with the third beat and rests just short of the top of
    // its scale — a reading has arrived, and the panel is not claiming where on the scale it sits.
    uniforms.uNeedle.value = 0.82 * e(2);
    uniforms.uFade.value = Math.max(e(0), Math.max(e(1), e(2)));
  }

  return {
    mesh,
    // A response to the act: begins at the moment the reading reaches surface.
    start() { if (clock < 0) { clock = 0; p[0] = p[1] = p[2] = 0; mesh.visible = true; apply(); } },
    // Reduced motion / a state carried in from the DOM-only path: settled, on arrival, with no sequence to watch.
    settle() { clock = 99; p[0] = p[1] = p[2] = 1; mesh.visible = true; apply(); },
    // The receiver is lifted: the panel goes with it. Nothing lingers past the claim.
    clear() { clock = -1; p[0] = p[1] = p[2] = 0; mesh.visible = false; apply(); },
    get busy() { return clock >= 0 && clock < DELAY[DELAY.length - 1] + RISE; },
    update(dt, camera) {
      if (clock < 0) return false;
      const wasBusy = clock < DELAY[DELAY.length - 1] + RISE;
      if (wasBusy) {
        clock += dt;
        for (let i = 0; i < 3; i++) p[i] = Math.max(0, Math.min(1, (clock - DELAY[i]) / RISE));
        apply();
      }
      orient(camera);
      return wasBusy;
    },
  };
}
