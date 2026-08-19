// 3D helpers for chapters 2 (tool) and 4 (deployment) — spec §4 rows 2/4, §12. Nothing here prints a number:
// sensor warm-ups (per-volume emissive lifts), spec dimension lines that draw on the tool (dash-draw via
// drawRange), the "gap makes the antenna" beat, the x-ray (tubing to 28 %, two ghost hairlines where the
// legs continue into rock), the fluid-level instrument (a sand ring sliding on the cased string between
// above-pump and pump-off, a pump that warms toward pump-off, a trend-ghost "earlier" ring), the benefit
// focus halo, the constant drive-head turn, and a contained orbit around the tool. All per-frame overrides
// run in a post-update hook wrapped around island.update so nothing fights the conductor's channels.
import * as THREE from 'three';
import { TOOL_LENGTH } from './wellfiTool.js';
import { RADII } from './wellPath.js';

export const SAND = '#e8dcc8';
export const EMBER = '#f27622';
export const FLOW_TINTS = { light: '#e9dcc0', heavy: '#d9c39a', gas: '#c9d4da', thermal: '#d9c39a' };
export const FLOW_STEP = '#f0e6d2'; // "one step" lighter than the sand default

const FLUID_U = { above: 0.3, pumpOff: 0.55 };
const PUMP_U = 0.5;

export function createToolViz(world) {
  const { island, camera, rig, scene } = world;
  const tool = island.tool;
  const L = TOOL_LENGTH;
  const root = new THREE.Group();
  root.name = 'tool-viz';
  island.parallax.add(root);

  // ---- per-volume materials (the four named volumes share two materials in wellfiTool.js) ----------------
  const warm = {}, warmTarget = {};
  Object.entries(tool.hotspots).forEach(([name, mesh]) => {
    mesh.material = mesh.material.clone();
    mesh.material.emissive = new THREE.Color(SAND);
    mesh.material.emissiveIntensity = 0;
    warm[name] = 0; warmTarget[name] = 0;
  });
  const baseColors = {};
  Object.entries(tool.hotspots).forEach(([name, mesh]) => { baseColors[name] = mesh.material.color.clone(); });
  const rings = tool.group.children.filter((c) => c.isMesh && c.geometry && c.geometry.type === 'TorusGeometry');
  const witness = tool.group.children.find((c) => c.isMesh && c.geometry && c.geometry.type === 'CapsuleGeometry');
  const witnessBase = witness ? witness.material.color.clone() : null;
  const witnessWarmColor = new THREE.Color('#f3d2a6');
  const collarBand = tool.group.getObjectByName('collar-band');

  // ---- dimension lines (tool-local, sand, dash-draw over 400 ms) ------------------------------------------
  const lineMat = new THREE.LineBasicMaterial({ color: SAND, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false, toneMapped: false });
  function polyline(points, sub = 6) {
    // subdivide each segment so drawRange reads as a draw, not a pop
    const out = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = new THREE.Vector3(...points[i]), b = new THREE.Vector3(...points[i + 1]);
      for (let s = 0; s < sub; s++) { out.push(a.clone().lerp(b, s / sub), a.clone().lerp(b, (s + 1) / sub)); }
    }
    return out;
  }
  function makeDim(name, segmentsList) {
    const pts = [];
    segmentsList.forEach((poly) => pts.push(...polyline(poly)));
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const l = new THREE.LineSegments(g, lineMat);
    l.name = `dim-${name}`; l.renderOrder = 30; l.visible = false;
    l.userData.total = pts.length;
    g.setDrawRange(0, 0);
    tool.group.add(l);
    return l;
  }
  const r = 0.05, zf = 0.075;
  const dims = {
    od: makeDim('od', [[[L * 0.36, -r, zf], [L * 0.36, r, zf]], [[L * 0.36, -r, zf - 0.018], [L * 0.36, -r, zf + 0.018]], [[L * 0.36, r, zf - 0.018], [L * 0.36, r, zf + 0.018]]]),
    pressure: makeDim('pressure', [[[L * 0.21, r + 0.03, 0], [L * 0.51, r + 0.03, 0]], [[L * 0.21, r + 0.012, 0], [L * 0.21, r + 0.048, 0]], [[L * 0.51, r + 0.012, 0], [L * 0.51, r + 0.048, 0]]]),
    temperature: makeDim('temperature', [ringPoly(-L * 0.05, 0.068, 36)]),
  };
  function ringPoly(x, radius, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; pts.push([x, Math.cos(a) * radius, Math.sin(a) * radius]); }
    return pts;
  }
  let dimShown = null;
  function showDim(name) {
    Object.entries(dims).forEach(([k, l]) => { if (k !== name) { l.visible = false; l.geometry.setDrawRange(0, 0); } });
    dimShown = name && dims[name] ? name : null;
    if (!dimShown) return;
    const l = dims[dimShown];
    l.visible = true;
    tween(400, (p) => { l.geometry.setDrawRange(0, Math.floor(l.userData.total * p)); }, () => {});
  }
  function hideDim(name) {
    const l = dims[name]; if (!l) return;
    if (dimShown === name) dimShown = null;
    l.visible = false; l.geometry.setDrawRange(0, 0);
  }

  // ---- x-ray: ghost hairlines where the two legs continue into rock ---------------------------------------
  const ghost = new THREE.Group(); ghost.name = 'xray-ghost'; ghost.visible = false;
  const ghostMat = new THREE.LineBasicMaterial({ color: SAND, transparent: true, opacity: 0.35, depthTest: false, depthWrite: false, toneMapped: false });
  (island.paths.boreMouths || []).forEach((m) => {
    const a = m.point.clone(), b = m.point.clone().addScaledVector(m.tangent.clone().normalize(), 1.2);
    const g = new THREE.BufferGeometry().setFromPoints([a, b]);
    const l = new THREE.Line(g, ghostMat); l.renderOrder = 29; l.name = `${m.id}-ghost`;
    ghost.add(l);
  });
  root.add(ghost);
  let xray = false;
  const shell = island.well.shell;
  const shellBaseOpacity = shell ? shell.material.opacity : 0.16;

  // ---- fluid-level instrument ---------------------------------------------------------------------------------
  const cased = island.paths.cased;
  const pumpMat = new THREE.MeshStandardMaterial({ color: '#1b1a19', roughness: 0.6, metalness: 0.5, emissive: new THREE.Color(EMBER), emissiveIntensity: 0 });
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(RADII.cased * 0.7, RADII.cased * 0.7, 0.18, 14), pumpMat);
  pump.name = 'pump';
  placeOnCased(pump, PUMP_U);
  pump.visible = false;
  root.add(pump);
  const levelMat = new THREE.MeshBasicMaterial({ color: SAND, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false, toneMapped: false });
  const earlierMat = levelMat.clone(); earlierMat.opacity = 0.4;
  const levelRing = new THREE.Mesh(new THREE.TorusGeometry(RADII.cased * 0.82, 0.012, 6, 40), levelMat); // legible at the ch4 pose distance (round 2)
  levelRing.name = 'fluid-level'; levelRing.renderOrder = 31; levelRing.visible = false;
  const earlierRing = new THREE.Mesh(new THREE.TorusGeometry(RADII.cased * 0.82, 0.008, 6, 40), earlierMat);
  earlierRing.name = 'fluid-level-earlier'; earlierRing.renderOrder = 31; earlierRing.visible = false;
  root.add(levelRing, earlierRing);
  function placeOnCased(obj, u) {
    const p = cased.getPointAt(u), t = cased.getTangentAt(u).normalize();
    obj.position.copy(p);
    obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), t); // cylinder/torus axis → tangent
    if (obj.geometry && obj.geometry.type === 'TorusGeometry') obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), t);
  }
  // a short horizontal sand tick across the string at the level — the ring alone reads as a hairline at distance
  const levelTick = new THREE.Mesh(new THREE.PlaneGeometry(RADII.cased * 3.2, 0.014), levelMat);
  levelTick.name = 'fluid-level-tick'; levelTick.renderOrder = 31; levelTick.visible = false;
  root.add(levelTick);
  let drawdown = 0, earlier = null, levelShown = false;
  function setLevel(d) { drawdown = Math.min(1, Math.max(0, d)); const u = FLUID_U.above + (FLUID_U.pumpOff - FLUID_U.above) * drawdown; placeOnCased(levelRing, u); levelTick.position.copy(cased.getPointAt(u)); levelTick.position.z += 0.16; levelTick.visible = levelShown; }
  function setEarlier(d) { earlier = d; if (d == null) { earlierRing.visible = false; return; } placeOnCased(earlierRing, FLUID_U.above + (FLUID_U.pumpOff - FLUID_U.above) * d); earlierRing.visible = levelShown; }
  setLevel(0);

  // ---- benefit focus halo (one sprite, sand, additive, ≤ .5) ---------------------------------------------------
  const haloTex = makeSoftDisc();
  const haloMat = new THREE.SpriteMaterial({ map: haloTex, color: SAND, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false });
  const halo = new THREE.Sprite(haloMat); halo.scale.setScalar(0.55); halo.renderOrder = 32; halo.visible = false; halo.name = 'benefit-halo';
  root.add(halo);
  let haloTarget = 0;
  function focusHalo(pos) { if (!pos) { haloTarget = 0; return; } halo.position.copy(pos); halo.visible = true; haloTarget = 0.5; }
  const bench = island.terrain.bench;
  const benchMat = bench && bench.material;
  if (benchMat && benchMat.emissive) { benchMat.emissive = new THREE.Color(SAND); }
  let benchLift = 0;
  const cutEdges = island.terrain.group.getObjectByName('cut-edges');
  const cutBase = cutEdges ? cutEdges.material.opacity : 0.35;
  let cutBoost = 0;

  // ---- flow chevrons ---------------------------------------------------------------------------------------------
  const trunkColor = island.materials.trunkFlow.uniforms.uFlowColor.value;
  const casedColor = island.materials.casedFlow.uniforms.uFlowColor.value;
  const legColor = island.materials.legFlow.uniforms.uFlowColor.value;
  const flowDefault = trunkColor.clone();
  let flowTint = null, flowBlink = -1000; // blink = remaining ms of a one-step blink (negative = settled)
  let flowSpeedBoostUntil = 0, flowOffset = 0; // accumulated extra phase (speed ×1.4 while boosted, no snap back)
  function setFlowTint(hex) {
    flowTint = hex ? new THREE.Color(hex) : null;
    const c = flowTint || flowDefault; trunkColor.copy(c); casedColor.copy(c); legColor.copy(c); // immediate; the hook keeps it
    world.requestRender();
  }
  function blinkFlow(ms = 500) { flowBlink = ms; pump_(); }
  function boostFlow(ms = 1000) { flowSpeedBoostUntil = performance.now() + ms; pump_(); }

  // ---- thermal haze ------------------------------------------------------------------------------------------------
  const fogBase = scene.fog ? scene.fog.color.clone() : null;
  function setThermal(on) { if (!scene.fog || !fogBase) return; scene.fog.color.set(on ? '#160b06' : fogBase); }

  // ---- vibration (tiny oscillation of the tool group) --------------------------------------------------------------
  let vibUntil = 0, vibBase = null;
  function vibrate(ms = 600) { if (!vibBase) vibBase = tool.group.position.clone(); vibUntil = performance.now() + ms; pump_(); }

  // ---- the gap makes the antenna ---------------------------------------------------------------------------------
  let desatUntil = 0;
  function gapBeat() {
    desatUntil = performance.now() + 600;
    island.field.swell();
    const cur = island.field.uniforms.uReveal.value;
    if (cur < 0.35) revealHold = performance.now() + 900; // held briefly in the per-frame hook (island.update resets reveal each frame)
    pump_();
  }
  let revealHold = 0;

  // ---- tweens + render pump ---------------------------------------------------------------------------------------
  const tweens = [];
  function tween(ms, fn, done) { tweens.push({ t0: performance.now(), ms, fn, done }); pump_();
  }
  let pumping = false;
  function pump_() {
    if (pumping) return; pumping = true;
    const loop = () => {
      if (!busy()) { pumping = false; return; }
      world.requestRender();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  function busy() {
    const now = performance.now();
    if (tweens.length) return true;
    // +160 ms so the frame that restores each timed beat (vibration base, colours, reveal) is guaranteed to run
    if (now < vibUntil + 160 || now < desatUntil + 160 || now < flowSpeedBoostUntil + 160 || flowBlink > -160 || now < revealHold + 160) return true;
    for (const k in warm) if (Math.abs(warm[k] - warmTarget[k]) > 0.005) return true;
    if (Math.abs(haloMat.opacity - haloTarget) > 0.005) return true;
    if (Math.abs(benchLift - benchTarget) > 0.005) return true;
    if (Math.abs(cutBoost - cutTarget) > 0.005) return true;
    if (ringBoost !== ringTarget || witnessWarm !== witnessTarget) return true;
    return false; // orbit drags, scroll and pointer moves dirty the frame on their own
  }
  let benchTarget = 0, cutTarget = 0, ringBoost = 0, ringTarget = 0, witnessWarm = 0, witnessTarget = 0;
  let surfaceCaption = null; // { el } projected each frame at the wellhead
  let standoffCaption = null; // { el, obj } projected each frame at the standoff line (chapter 6)
  let chapterActive = { tool: false, deployment: false };

  // ---- orbit (rotate the input rig about a pivot so the tool stays put on screen) ----------------------------------
  const orbit = { active: false, yaw: 0, pitch: 0, pivot: new THREE.Vector3(), restore: false };
  const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _ndc = new THREE.Vector3();
  const origApply = rig.apply;
  rig.apply = function (progress, dt, aspect) {
    origApply.call(rig, progress, dt, aspect);
    if (!orbit.active) {
      if (orbit.restore) { rig.inputRig.position.set(0, 0, 0); camera.position.set(0, 0, 0); orbit.restore = false; }
      return;
    }
    // pivot in pathRig-local space: q⁻¹ · (pivot − pos). Camera = pivot + R·(−pivotLocal): rotation about the pivot.
    _v.copy(orbit.pivot).sub(rig.pathRig.position).applyQuaternion(_q.copy(rig.pathRig.quaternion).invert());
    rig.inputRig.position.copy(_v);
    camera.position.copy(_v).negate();
    rig.inputRig.rotation.set(orbit.pitch, orbit.yaw, 0, 'YXZ');
    orbit.restore = true;
  };
  function startOrbit() {
    if (orbit.active) return;
    // Pivot: the tool if it is in frame, else the point on the view axis at the tool's depth.
    camera.updateMatrixWorld(true);
    tool.group.getWorldPosition(orbit.pivot);
    _ndc.copy(orbit.pivot).project(camera);
    if (Math.abs(_ndc.x) > 1.05 || Math.abs(_ndc.y) > 1.05) {
      const camPos = camera.getWorldPosition(new THREE.Vector3());
      const fwd = camera.getWorldDirection(new THREE.Vector3());
      const d = Math.max(1.5, orbit.pivot.clone().sub(camPos).dot(fwd));
      orbit.pivot.copy(camPos).addScaledVector(fwd, d);
    }
    orbit.active = true;
    rig.parallax.strength = 0;
    pump_();
  }
  function stopOrbit() {
    if (!orbit.active) return;
    orbit.active = false; orbit.restore = false;
    rig.inputRig.position.set(0, 0, 0); camera.position.set(0, 0, 0); rig.inputRig.rotation.set(0, 0, 0);
    rig.parallax.strength = 1;
    world.requestRender();
  }
  function rotateOrbit(dyaw, dpitch) {
    orbit.yaw = THREE.MathUtils.clamp(orbit.yaw + dyaw, -0.3, 0.3);
    orbit.pitch = THREE.MathUtils.clamp(orbit.pitch + dpitch, -0.15, 0.15);
    world.requestRender();
  }

  // ---- per-frame post hook ---------------------------------------------------------------------------------------------
  let lastNow = performance.now();
  const origUpdate = island.update;
  island.update = function (t, elapsed, channels, opts) {
    origUpdate.call(island, t, elapsed, channels, opts);
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastNow) / 1000); lastNow = now;
    const k = 1 - Math.exp(-10 * dt);

    // tweens
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      const p = Math.min(1, (now - tw.t0) / tw.ms);
      tw.fn(1 - Math.pow(1 - p, 3));
      if (p >= 1) { tweens.splice(i, 1); tw.done && tw.done(); }
    }
    // volume warms
    for (const name in warm) {
      warm[name] += (warmTarget[name] - warm[name]) * k;
      tool.hotspots[name].material.emissiveIntensity = warm[name] * 0.42;
    }
    // the gap beat: desaturate both tubing sections (battery/sensors on one side, sleeve on the other) for 600 ms
    const desat = now < desatUntil;
    ['battery', 'sensors', 'sleeve'].forEach((n) => {
      const m = tool.hotspots[n].material;
      if (desat) { const g = baseColors[n].clone(); const lum = 0.3 * g.r + 0.59 * g.g + 0.11 * g.b; m.color.setRGB(lum, lum, lum); m.color.lerp(baseColors[n], 0.25); }
      else m.color.copy(baseColors[n]);
    });
    if (tool.hotspots.gap) tool.hotspots.gap.material.emissiveIntensity = Math.max(tool.hotspots.gap.material.emissiveIntensity, desat ? 0.18 : 0);
    if (revealHold) { if (now < revealHold) island.field.setReveal(Math.max(channels.field, 0.35)); else { revealHold = 0; island.field.setReveal(channels.field); } }
    // collar rings (pressure) — override tool.update's per-frame opacity
    ringBoost += (ringTarget - ringBoost) * k; if (Math.abs(ringBoost - ringTarget) < 0.005) ringBoost = ringTarget;
    if (ringBoost > 0) rings.forEach((rg) => { rg.material.opacity = Math.min(1, rg.material.opacity + 0.55 * ringBoost); });
    // witness capsule warm tint (temperature)
    witnessWarm += (witnessTarget - witnessWarm) * k; if (Math.abs(witnessWarm - witnessTarget) < 0.005) witnessWarm = witnessTarget;
    if (witness && witnessBase) witness.material.color.copy(witnessBase).lerp(witnessWarmColor, witnessWarm);
    // vibration
    if (vibBase) {
      if (now < vibUntil) { const up = new THREE.Vector3(0, 1, 0).applyQuaternion(tool.group.quaternion); tool.group.position.copy(vibBase).addScaledVector(up, Math.sin(now * 0.07) * 0.004); }
      else { tool.group.position.copy(vibBase); vibBase = null; }
    }
    // flow: tint / blink / speed
    const tint = flowTint || flowDefault;
    if (flowBlink > 0) { flowBlink -= dt * 1000; trunkColor.set(FLOW_STEP); casedColor.set(FLOW_STEP); legColor.set(FLOW_STEP); }
    else { if (flowBlink > -1000) flowBlink -= dt * 1000; trunkColor.copy(tint); casedColor.copy(tint); legColor.copy(tint); }
    if (now < flowSpeedBoostUntil) flowOffset += dt * 0.4;
    if (flowOffset > 0) { const u = island.materials.trunkFlow.uniforms.uTime; u.value = u.value + flowOffset; island.materials.casedFlow.uniforms.uTime.value += flowOffset; island.materials.legFlow.uniforms.uTime.value += flowOffset; }
    // x-ray: tubing to 28 %, shell nearly gone, ghost hairlines
    if (xray) { island.materials.casedFlow.setCutaway(0.28, false); if (shell) shell.material.opacity = 0.05; }
    ghost.visible = xray && chapterActive.deployment;
    // fluid level + pump warm (+ visibility gated to chapter 4)
    pump.visible = levelRing.visible = chapterActive.deployment; levelTick.visible = chapterActive.deployment && levelShown;
    earlierRing.visible = chapterActive.deployment && earlier != null;
    pumpMat.emissiveIntensity = THREE.MathUtils.smoothstep(drawdown, 0.55, 1) * 0.9;
    // drive head keeps turning at one constant rate (chapter 4)
    if (chapterActive.deployment && !world.paused && island.pad && island.pad.drive && island.pad.drive.children[1]) island.pad.drive.children[1].rotateY(dt * 1.6);
    // halo / bench / cut edges
    haloMat.opacity += (haloTarget - haloMat.opacity) * k; if (haloMat.opacity < 0.01 && haloTarget === 0) halo.visible = false;
    benchLift += (benchTarget - benchLift) * k; if (benchMat && benchMat.emissive) benchMat.emissiveIntensity = benchLift * 0.14;
    cutBoost += (cutTarget - cutBoost) * k; if (cutEdges) cutEdges.material.opacity = cutBase + 0.5 * cutBoost;
    // projected captions: the surface caption (wellhead) and the standoff caption (the 0.9 line, chapter 6)
    for (const cap of [surfaceCaption, standoffCaption]) {
      if (!cap) continue;
      rig.root.updateMatrixWorld(true); camera.updateMatrixWorld(true);
      if (cap.obj) { cap.obj.getWorldPosition(_v); _v.y += 0.12; } else { island.well.wellhead.getWorldPosition(_v); _v.y += 0.4; }
      _ndc.copy(_v).project(camera);
      // Clamp into the viewport (inside the rail gutter / header) — when the pad is out of frame the caption holds
      // the edge nearest the wellhead, which still says where "surface" is.
      const W = window.innerWidth, H = window.innerHeight;
      const behind = _ndc.z > 1;
      let x = (_ndc.x * 0.5 + 0.5) * W, y = (-_ndc.y * 0.5 + 0.5) * H;
      if (behind) { x = W - x; y = H - y; }
      const minX = (W > 1100 ? 210 : 16) + 90, maxX = W - 110, minY = 84 + 40, maxY = H - 24;
      const cx = Math.min(maxX, Math.max(minX, x)), cy = Math.min(maxY, Math.max(minY, y));
      const el = cap.el;
      el.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px) translate(-50%, -100%)`;
      el.classList.toggle('is-clamped', cx !== x || cy !== y);
    }
  };

  function dispose() { rig.apply = origApply; island.update = origUpdate; }

  return {
    root, pump, levelRing, earlierRing, halo, dims, ghost,
    warmVolume(name, on) { if (name in warmTarget) { warmTarget[name] = on ? 1 : 0; pump_(); } },
    warmCollar(on) { ringTarget = on ? 1 : 0; pump_(); },
    warmWitness(on) { witnessTarget = on ? 1 : 0; pump_(); },
    vibrate, blinkFlow, boostFlow, setFlowTint, setThermal, gapBeat,
    showDim, hideDim,
    setXray(on) { xray = Boolean(on); if (!xray && shell) shell.material.opacity = shellBaseOpacity; world.requestRender(); pump_(); },
    get xray() { return xray; },
    setLevel(d) { setLevel(d); pump_(); },
    get drawdown() { return drawdown; },
    setEarlier(d) { setEarlier(d); pump_(); },
    setLevelShown(v) { levelShown = Boolean(v); earlierRing.visible = levelShown && earlier != null; levelTick.visible = levelShown && chapterActive.deployment; pump_(); },
    focusHalo(pos) { focusHalo(pos); pump_(); },
    liftBench(on) { benchTarget = on ? 1 : 0; pump_(); },
    brightenCut(on) { cutTarget = on ? 1 : 0; pump_(); },
    setSurfaceCaption(el) { surfaceCaption = el ? { el } : null; if (el) pump_(); },
    setStandoffCaption(el, obj) { standoffCaption = el && obj ? { el, obj } : null; if (el) pump_(); },
    setChapter(name, on) { chapterActive[name] = Boolean(on); world.requestRender(); pump_(); },
    points: {
      pump: () => pump.position.clone(),
      trunk: () => island.paths.openHole.getPointAt(0.5),
      level: () => levelRing.position.clone(),
      collar: () => tool.group.getWorldPosition(new THREE.Vector3()),
    },
    orbit, startOrbit, stopOrbit, rotateOrbit,
    tween, dispose,
  };
}

function makeSoftDisc() {
  const size = 96;
  const c = document.createElement('canvas'); c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.8)'); g.addColorStop(0.35, 'rgba(255,255,255,0.25)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
