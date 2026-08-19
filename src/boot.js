// World boot (spec §2): renderer, scene, the world, the scroll conductor and camera rig, world channels,
// on-demand rendering with visibility pausing. Loaded only after the capability gate passes.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildIsland } from './world/island.js';
import { COLORS } from './world/layout.js';
import { CHAPTERS, POSES, chapterElements, worldAt, poseProgress } from './chapters.js';
import { createScrollConductor } from './conductor.js';
import { createCameraRig } from './cameraRig.js';
import { gate } from './gate.js';
import { createInteractions } from './interactions.js';

export function bootWorld() {
  const host = document.getElementById('world');
  const canvas = host && host.querySelector('canvas');
  if (!canvas) return null;
  const html = document.documentElement;
  const isMobile = () => window.innerWidth <= 820;
  const dprCap = gate.tier >= 3 ? 1.75 : gate.tier === 2 ? 1.5 : 1.35;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  if (gate.tier >= 3) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.void);
  // Zero-download environment for the steel/PBR response (RoomEnvironment → PMREM), kept dim so it never
  // competes with the authored key.
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.1;
    pmrem.dispose();
  } catch (e) { /* environment is a nicety */ }
  scene.fog = new THREE.FogExp2(COLORS.void, 0);
  const camera = new THREE.PerspectiveCamera(20, 1, 0.3, 120);
  const rig = createCameraRig(camera, POSES, { mobile: isMobile() });
  scene.add(rig.root);

  const island = buildIsland({ tier: gate.tier <= 1 ? 'low' : 'high' });
  island.setCompact(isMobile());
  scene.add(island.root);

  // Conductor over the chapter anchor elements.
  const sections = chapterElements();
  let lastState = null, dirty = true, running = true, firstFrame = false;
  const conductor = createScrollConductor({
    sections,
    damping: 5.2,
    reducedMotion: false,
    onUpdate(st) {
      lastState = st; dirty = true;
      document.dispatchEvent(new CustomEvent('world:progress', { detail: { exact: st.exact, smooth: st.smooth, index: st.index } }));
    },
    onChapterChange(i, st) {
      html.dataset.chapter = CHAPTERS[i].id;
      document.dispatchEvent(new CustomEvent('world:chapter', { detail: { index: i, id: CHAPTERS[i].id } }));
      if (CHAPTERS[i].id === 'signal') island.field.swell(); // one swell on entry — never periodic
    },
  });

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    rig.setMobile(isMobile());
    island.setCompact(isMobile());
    dirty = true;
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  // Pointer parallax (fine pointers) — additive micro-parallax only; the probe is a separate module.
  window.addEventListener('pointermove', (e) => {
    if (gate.coarse) return;
    rig.parallax.x = (e.clientX / window.innerWidth) * 2 - 1;
    rig.parallax.y = -((e.clientY / window.innerHeight) * 2 - 1);
    island.pointer.x = rig.parallax.x; island.pointer.y = rig.parallax.y;
    dirty = true;
  }, { passive: true });

  // Formation legend twins → light the stratum (emissive lift on the band's shared material).
  const stratumMats = new Map();
  Object.entries(island.terrain.byName).forEach(([name, meshes]) => stratumMats.set(name, meshes[0].material));
  let focusedStratum = null;
  document.addEventListener('world:focus-stratum', (e) => {
    const name = e.detail && e.detail.name;
    if (focusedStratum && stratumMats.get(focusedStratum)) { const m = stratumMats.get(focusedStratum); m.emissive.setRGB(0, 0, 0); m.emissiveIntensity = 0; }
    focusedStratum = name && stratumMats.has(name) ? name : null;
    if (focusedStratum) { const m = stratumMats.get(focusedStratum); m.emissive.set('#e8dcc8'); m.emissiveIntensity = 0.16; }
    dirty = true;
  });

  // Interactions: hotspot registry + raycast FSM + DOM twins. Chapter modules register into it.
  const track = (name, params) => { try { if (window.gtag) window.gtag('event', name, params); } catch (e) { /* analytics never breaks the world */ } };
  const interactions = createInteractions({ camera, canvas, world: island, getExact: () => (lastState || conductor.getState()).exact, requestRender: () => { dirty = true; }, track });
  document.addEventListener('world:progress', () => interactions.updateAvailability());

  const timer = new THREE.Timer();
  timer.connect(document);
  let idleFrames = 0;
  // Motion control (spec §5, §7): paused = no ambient tick and frozen world time (timescale 0); the world still
  // re-renders on demand (scroll, resize) so the pose always matches the copy. html.motion-paused may already be
  // set by ui/motionToggle.js (persisted choice / reduced-motion opt-in) before we boot.
  let paused = html.classList.contains('motion-paused');
  if (paused) timer.setTimescale(0);
  function frame() {
    if (!running) return;
    // On-demand: after 90 quiet frames (no scroll/pointer/resize), drop to a low ambient tick (every 4th frame).
    idleFrames = dirty ? 0 : idleFrames + 1;
    if (paused ? !dirty : (idleFrames > 90 && (idleFrames % 4) !== 0)) return;
    timer.update();
    const dt = Math.min(timer.getDelta(), 1 / 30);
    const elapsed = timer.getElapsed();
    const st = lastState || conductor.getState();
    const p = st.smooth;
    const w = worldAt(p);
    interactions.update();
    rig.apply(poseProgress(p), dt, camera.aspect);
    island.update(elapsed % 12, elapsed, w);
    scene.fog.density = (w.fog || 0) * 0.6;
    renderer.render(scene, camera);
    if (!firstFrame) {
      firstFrame = true;
      html.classList.add('world-live');
      document.dispatchEvent(new CustomEvent('world:first-frame'));
    }
    dirty = false;
  }
  renderer.setAnimationLoop(frame);
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { timer.reset?.(); renderer.setAnimationLoop(frame); } else { renderer.setAnimationLoop(null); }
  });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); running = false; renderer.setAnimationLoop(null); html.classList.remove('world-live'); html.classList.add('world-lost'); });
  conductor.start();

  const api = {
    renderer, scene, camera, rig, island, conductor,
    get state() { return lastState || conductor.getState(); },
    requestRender() { dirty = true; },
    get paused() { return paused; },
    pause() { if (paused) return; paused = true; timer.setTimescale(0); dirty = true; },
    resume() { if (!paused) return; paused = false; timer.reset?.(); timer.setTimescale(1); dirty = true; },
  };
  window.__yotinWorld = api;
  return api;
}
