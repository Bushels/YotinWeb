// Dev harness: renders the world at a fixed chapter pose. ?ch=N picks the chapter camera, ?t=S freezes the
// ambient cycle, ?w=0..1 overrides world channels via ?light=,&candle=,&field=,&cutaway=
import * as THREE from 'three';
import { buildIsland } from '../src/world/island.js';
import { COLORS } from '../src/world/layout.js';
import { CHAPTERS, POSES } from '../src/chapters.js';

const q = new URLSearchParams(location.search);
const ch = Number(q.get('ch') ?? 0);
const t = q.has('t') ? Number(q.get('t')) : 1.5;
const tier = q.get('tier') === 'low' ? 'low' : 'high';
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = tier === 'high'; renderer.shadowMap.type = THREE.PCFShadowMap;
import('three/addons/environments/RoomEnvironment.js').then(({ RoomEnvironment }) => { const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.1; });
const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.void);
const c = CHAPTERS[Math.min(CHAPTERS.length - 1, ch)];
const pose = POSES[Math.min(POSES.length - 1, Number(q.get('pose') ?? (ch >= 5 ? ch + 1 : ch)))];
const camDef = innerWidth <= 820 && pose.mobile ? pose.mobile : pose;
const camera = new THREE.PerspectiveCamera(camDef.fov, innerWidth / innerHeight, 0.3, 120);
camera.position.set(...camDef.position);
camera.lookAt(...camDef.target);
const island = buildIsland({ tier });
if (q.has('swell')) setTimeout(() => island.field.swell(), 500);
scene.add(island.root);
const channels = { ...c.world };
for (const k of Object.keys(channels)) if (q.has(k)) channels[k] = Number(q.get(k));
const hud = document.getElementById('hud');
const timer = new THREE.Timer();
let frames = 0, acc = 0, last = 0;
function frame() {
  timer.update();
  const dt = Math.min(timer.getDelta(), 1 / 30);
  const elapsed = timer.getElapsed();
  island.update(t, elapsed, channels);
  renderer.render(scene, camera);
  frames++; acc += dt;
  if (acc > 0.5) { const i = renderer.info.render; hud.textContent = `ch=${c.id} calls=${i.calls} tris=${i.triangles} fps=${(frames / acc).toFixed(0)} field=${island.field.count} breath=${island.field.uniforms.uBreath.value.toFixed(2)} reveal=${island.field.uniforms.uReveal.value.toFixed(2)}`; frames = 0; acc = 0; }
  window.__worldReady = true;
}
renderer.setAnimationLoop(frame);
