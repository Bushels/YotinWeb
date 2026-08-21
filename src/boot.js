// World boot (spec §2): renderer, scene, the world, the scroll conductor and camera rig, world channels,
// on-demand rendering with visibility pausing. Loaded only after the capability gate passes.
import * as THREE from 'three';
const _camWorld = new THREE.Vector3();
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
  // Cached at resize (the frame loop reads it every tick): phones get the chapter-2 pose/light hold in
  // chapters.js, because the tool chapter is one screen of copy on a laptop and two and a quarter on a phone.
  let mobileNow = isMobile();
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
    mobileNow = isMobile();
    rig.setMobile(mobileNow);
    island.setCompact(mobileNow);
    dirty = true;
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  // Pointer parallax (fine pointers) — additive micro-parallax only; the probe is a separate module.
  // The same pointer parts the wind and the spruce at the surface (chapters 0 and 5): project it onto the
  // ground plane y = 0 in parallax-local space.
  const groundRay = new THREE.Raycaster(), groundNdc = new THREE.Vector2(), groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), groundHit = new THREE.Vector3(), groundInv = new THREE.Matrix4();
  let partStrength = 0, partTarget = 0;
  window.addEventListener('pointermove', (e) => {
    if (gate.coarse) return;
    rig.parallax.x = (e.clientX / window.innerWidth) * 2 - 1;
    rig.parallax.y = -((e.clientY / window.innerHeight) * 2 - 1);
    island.pointer.x = rig.parallax.x; island.pointer.y = rig.parallax.y;
    const p = (lastState || conductor.getState()).exact;
    if (p < 0.7 || (p > 4.7 && p < 5.8)) {
      const r = canvas.getBoundingClientRect();
      groundNdc.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * -2 + 1);
      groundRay.setFromCamera(groundNdc, camera);
      groundInv.copy(island.parallax.matrixWorld).invert();
      const lr = groundRay.ray.clone().applyMatrix4(groundInv);
      if (lr.intersectPlane(groundPlane, groundHit)) { partTarget = 1; island.setForestPointer(groundHit.x, groundHit.z, partStrength); }
    } else partTarget = 0;
    dirty = true;
  }, { passive: true });
  window.addEventListener('pointerleave', () => { partTarget = 0; });
  document.addEventListener('world:candle', (e) => { island.state.candleBoost = Math.max(island.state.candleBoost, (e.detail && e.detail.boost) || 1); dirty = true; });

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
    // Boot has no fly-in (round 13a): until the first frame has painted, smooth is pinned to exact, so the
    // FIRST visible frame is already the authored pose for wherever the page actually is — including a reload
    // that restores a mid-page scroll, and including the anchor re-measure that fonts/images trigger.
    if (arriving > 0 || !firstFrame) { if (arriving > 0) arriving--; conductor.jumpTo(); lastState = conductor.getState(); }
    const st = lastState || conductor.getState();
    const p = st.smooth;
    const w = worldAt(p, mobileNow);
    interactions.update();
    // spring the parting strength toward its target so the wind/spruce ease in and out
    partStrength += (partTarget - partStrength) * (1 - Math.exp(-4 * dt));
    if (partStrength > 0.001) island.setForestPointer(island.forest.uniforms.pointer.value.x, island.forest.uniforms.pointer.value.z, partStrength); else island.setForestPointer(0, 0, 0);
    rig.apply(poseProgress(p, mobileNow), dt, camera.aspect);
    island.wind.setCameraHeight(camera.getWorldPosition(_camWorld).y); // WORLD height (the camera sits inside the rig): the wind is only seen from above ground
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
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { timer.reset?.(); renderer.setAnimationLoop(frame); } else { renderer.setAnimationLoop(null); }
  });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); running = false; renderer.setAnimationLoop(null); html.classList.remove('world-live'); html.classList.add('world-lost'); });
  // Anchor / deep-link arrival (spec §5): hard cut — set exact & smooth together, fade the canvas 240 ms.
  let arriving = 0;
  function hardCut() {
    html.classList.add('world-cut');
    arriving = 40; // frames during which smooth is pinned to exact (the browser's scroll may take a few frames)
    setTimeout(() => html.classList.remove('world-cut'), 60);
  }
  document.addEventListener('click', (e) => {
    const a = e.target && e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id && id.length > 1 && document.querySelector(id)) hardCut();
  }, true);
  window.addEventListener('hashchange', hardCut);
  if (location.hash && location.hash.length > 1) hardCut();
  // Order matters (round 13a): the conductor measures the anchors and reads the scroll position BEFORE the
  // render loop is armed, so the first frame() call already has a real state to pose from instead of the
  // zero-state default. Previously this depended on rAF callback ordering.
  conductor.start();
  // Scroll restoration and the load event can land AFTER boot on a reload. Re-measure and hard-set (no damped
  // glide) if that happens before the world has settled — otherwise the world flies from chapter 0 to wherever
  // the browser put the page.
  const bootAt = performance.now();
  const restore = () => {
    if (firstFrame && performance.now() - bootAt > 700) return;
    conductor.measure(); conductor.jumpTo(); lastState = conductor.getState(); dirty = true;
  };
  addEventListener('load', restore);
  addEventListener('pageshow', restore);
  renderer.setAnimationLoop(frame);

  const api = {
    renderer, scene, camera, rig, island, conductor, interactions, track, THREE,
    get state() { return lastState || conductor.getState(); },
    requestRender() { dirty = true; },
    get paused() { return paused; },
    pause() { if (paused) return; paused = true; timer.setTimescale(0); dirty = true; },
    resume() { if (!paused) return; paused = false; timer.reset?.(); timer.setTimescale(1); dirty = true; },
  };
  window.__yotinWorld = api;
  return api;
}
