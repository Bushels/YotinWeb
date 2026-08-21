// 3D helpers for chapters 2 (tool) and 4 (deployment) — spec §4 rows 2/4, §12. Nothing here prints a number:
// sensor warm-ups (per-volume emissive lifts), spec dimension lines that draw on the tool (dash-draw via
// drawRange), the "gap makes the antenna" beat, the x-ray (tubing to 28 %, two ghost hairlines where the
// legs continue into rock), the fluid-level instrument (a sand ring sliding on the cased string between
// above-pump and pump-off, a pump that warms toward pump-off, a trend-ghost "earlier" ring), the benefit
// focus halo, the constant drive-head turn, and a contained orbit around the tool. All per-frame overrides
// run in a post-update hook wrapped around island.update so nothing fights the conductor's channels.
import * as THREE from 'three';
import { TOOL_LENGTH } from './wellfiTool.js';
import { RADII, PUMP_U as PUMP_BANDS } from './wellPath.js';
import { mergeIndexed } from './forest.js';

export const SAND = '#e8dcc8';
export const EMBER = '#f27622';
export const FLOW_TINTS = { light: '#e9dcc0', heavy: '#d9c39a', gas: '#c9d4da', thermal: '#d9c39a' };
export const FLOW_STEP = '#f0e6d2'; // "one step" lighter than the sand default

// Instrument on the part of the cased string that rides the FRONT FACE (z ≥ 5): below that the string is buried
// in rock and the level marker leaves the casing (round 4). Pump-off is AT the pump.
// Round 9 (engineering truth): the pump sat at u = 0.42, which on the authored cased curve is past the KOP.
// WCSB heavy-oil PCP and rod installs land the pump in the vertical or a low-angle tangent above it, so it
// moves up to the datum (u = 0.27, measured 17.8° from vertical, still on the front face at z = 5.0).
// Round 13: that datum now lives in wellPath.js and chapter 6's two bands bracket it, so the pump does not
// move on the same well when the visitor scrolls from Deployment to Fit.
const FLUID_U = { above: 0.14, pumpOff: 0.26 };
const PUMP_U = PUMP_BANDS.datum;

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
  // The pump body: at 1× on a laptop the old ≈ 18 × 10 px plain cylinder was not identifiable as anything, so the
  // micro-beat's payload ("pump body warms" / "surface looks the same") had no visible subject (round 9). It is
  // ~1.6× in radius now and it has a silhouette — tapered shoulders top and bottom, the drive head's own language
  // at surface — merged into ONE mesh so the draw-call budget is untouched. Slightly warmer than the casing steel,
  // which is on-message here: this is the one element in chapter 4 licensed to warm.
  const pumpMat = new THREE.MeshStandardMaterial({ color: '#6b5c4c', roughness: 0.58, metalness: 0.5, emissive: new THREE.Color(EMBER), emissiveIntensity: 0.12 });
  const R_PUMP = RADII.cased * 1.12; // 1.6 × the old 0.7 R_CASED
  const pumpGeoms = [];
  { // barrel + a shoulder collar at each end (the flange/bonnet taper the wellhead stack uses)
    const barrel = new THREE.CylinderGeometry(R_PUMP, R_PUMP, 0.24, 14); pumpGeoms.push(barrel);
    const top = new THREE.CylinderGeometry(R_PUMP * 0.66, R_PUMP * 1.18, 0.05, 14); top.translate(0, 0.145, 0); pumpGeoms.push(top);
    const bot = new THREE.CylinderGeometry(R_PUMP * 1.18, R_PUMP * 0.66, 0.05, 14); bot.translate(0, -0.145, 0); pumpGeoms.push(bot);
  }
  const pump = new THREE.Mesh(mergeIndexed(pumpGeoms), pumpMat);
  pumpGeoms.forEach((g) => g.dispose());
  pump.name = 'pump';
  placeOnCased(pump, PUMP_U);
  pump.visible = false;
  root.add(pump);
  const levelMat = new THREE.MeshBasicMaterial({ color: SAND, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false, toneMapped: false });
  const earlierMat = levelMat.clone(); earlierMat.opacity = 0.4;
  const levelRing = new THREE.Mesh(new THREE.TorusGeometry(RADII.cased * 0.82, 0.008, 6, 40), levelMat); // the ring reads edge-on; the horizontal line + projected label carry it (round 3)
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
  const levelTick = new THREE.Mesh(new THREE.PlaneGeometry(RADII.cased * 4.2, 0.026), levelMat);
  levelTick.name = 'fluid-level-tick'; levelTick.renderOrder = 31; levelTick.visible = false;
  const earlierTick = new THREE.Mesh(new THREE.PlaneGeometry(RADII.cased * 4.2, 0.016), earlierMat);
  earlierTick.name = 'fluid-level-earlier-tick'; earlierTick.renderOrder = 31; earlierTick.visible = false;
  root.add(levelTick, earlierTick);
  let drawdown = 0, earlier = null, levelShown = false;
  function placeRule(obj, u) {
    // a horizontal rule across the string, lying in the front face plane (z = face + ε), perpendicular to the tangent
    const pt = cased.getPointAt(u), t = cased.getTangentAt(u).normalize();
    obj.position.copy(pt); obj.position.z += 0.16;
    const across = new THREE.Vector3().crossVectors(t, new THREE.Vector3(0, 0, 1)).normalize(); // in-plane, perpendicular to the string
    if (across.lengthSq() < 1e-6) across.set(1, 0, 0);
    obj.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), across);
  }
  function setLevel(d) { drawdown = Math.min(1, Math.max(0, d)); const u = FLUID_U.above + (FLUID_U.pumpOff - FLUID_U.above) * drawdown; placeOnCased(levelRing, u); placeRule(levelTick, u); levelTick.visible = levelShown; }
  function setEarlier(d) { earlier = d; if (d == null) { earlierRing.visible = false; earlierTick.visible = false; return; } const u = FLUID_U.above + (FLUID_U.pumpOff - FLUID_U.above) * d; placeOnCased(earlierRing, u); placeRule(earlierTick, u); earlierRing.visible = levelShown; earlierTick.visible = levelShown; }
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
  // The buried-casing ghost hairline is drawn with depthTest off so it reads through rock at chapter distance —
  // which means it also draws straight through the chapter-2 tool close-up and its DOM panel. Fade it out as the
  // camera closes on the tool, and kill it in orbit (round 5).
  const casedGhost = island.well.group.getObjectByName('cased-ghost');
  // Same problem, same fix, for the bore mouths (round 12): the collar now sits on the exposed face run, a
  // quarter-unit from the 'cased-dive' mouth, so at chapter-2 range that mouth's black disc and sand rim are a
  // 300 px hole floating beside the tool. They are chapter-distance landmarks — fade them as the camera closes.
  const boreMouths = island.well.mouths || null;
  const mouthMats = [];
  if (boreMouths) boreMouths.traverse((o) => { if (o.isMesh && o.material && o.material.transparent) mouthMats.push({ m: o.material, base: o.material.opacity }); });
  const _ghostA = new THREE.Vector3(), _ghostB = new THREE.Vector3();
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
  let levelCaption = null, earlierCaption = null; // { el, obj } projected at the fluid level / its earlier ghost (chapter 4)
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
    // x-ray: tubing to 28 %, shell nearly gone, ghost hairlines. Otherwise in chapter 4 the cased string is held
    // LEGIBLE (0.6) so the instrument sits on a visible tube — the chapter's cutaway 0.95 had made it vanish (round 3)
    if (xray) { island.materials.casedFlow.setCutaway(0.28, false); if (shell) shell.material.opacity = 0.05; }
    else if (chapterActive.deployment) { island.materials.casedFlow.setCutaway(0.6, false); }
    ghost.visible = xray && chapterActive.deployment;
    // fluid level + pump warm (+ visibility gated to chapter 4)
    pump.visible = chapterActive.deployment; levelRing.visible = false; earlierRing.visible = false; // the rules carry the level; the rings stay as proxies only
    levelTick.visible = chapterActive.deployment && levelShown; earlierTick.visible = chapterActive.deployment && levelShown && earlier != null;
    pumpMat.emissiveIntensity = 0.10 + THREE.MathUtils.smoothstep(drawdown, 0.55, 1) * 0.55; // a readable body before pump-off; the warm lift is smaller now that the body is 1.6× (round 9)
    // drive head keeps turning at one constant rate (chapter 4)
    if (chapterActive.deployment && !world.paused && island.pad && island.pad.motor) island.pad.motor.rotateY(dt * 1.6);
    if (casedGhost || mouthMats.length) {
      const d = camera.getWorldPosition(_ghostA).distanceTo(tool.group.getWorldPosition(_ghostB));
      const near = THREE.MathUtils.smoothstep(d, 4.5, 9);
      if (casedGhost) {
        casedGhost.material.opacity = orbit.active ? 0 : 0.38 * near;
        casedGhost.visible = casedGhost.material.opacity > 0.01;
      }
      for (const e of mouthMats) e.m.opacity = e.base * (orbit.active ? 0 : near);
      if (boreMouths) boreMouths.visible = (orbit.active ? 0 : near) > 0.02;
    }
    // halo / bench / cut edges
    haloMat.opacity += (haloTarget - haloMat.opacity) * k; if (haloMat.opacity < 0.01 && haloTarget === 0) halo.visible = false;
    benchLift += (benchTarget - benchLift) * k; if (benchMat && benchMat.emissive) benchMat.emissiveIntensity = benchLift * 0.14;
    cutBoost += (cutTarget - cutBoost) * k; if (cutEdges) cutEdges.material.opacity = cutBase + 0.5 * cutBoost;
    // projected captions: the surface caption (wellhead) and the standoff caption (the 0.9 line, chapter 6)
    // One rect per frame, shared by both side chips: the union of chapter 4's FOREGROUND panels — the heading,
    // the device figure card and the deployment controls — which the level chips must not land on (round 14;
    // see the cap.side branch below). Deliberately not `#insight .shell`: that box runs to x≈1270 at 1366, i.e.
    // most of the world, and testing against it would hide the chips everywhere. The panels end at x≈772.
    let sideRect = null;
    for (const el of document.querySelectorAll('#insight .insight-head, #insight .device-banner, #insight .deploy-controls')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      sideRect = sideRect
        ? { left: Math.min(sideRect.left, r.left), top: Math.min(sideRect.top, r.top), right: Math.max(sideRect.right, r.right), bottom: Math.max(sideRect.bottom, r.bottom) }
        : { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    }
    for (const cap of [surfaceCaption, standoffCaption, levelCaption, earlierCaption]) {
      if (!cap) continue;
      rig.root.updateMatrixWorld(true); camera.updateMatrixWorld(true);
      // Side captions (the fluid level's "now" and its trend ghost's "earlier") sit ON the rule they name — no
      // world-space lift. The 0.12 lift is depth-dependent once projected, so it pushed the two chips off their
      // own lines by different amounts (24 px vs 35 px) and made the pair read as two anchoring behaviours
      // rather than one (round 9). Same object, same offset, both chips.
      if (cap.obj) { cap.obj.getWorldPosition(_v); if (!cap.side) _v.y += 0.12; } else { island.well.wellhead.getWorldPosition(_v); _v.y += 0.4; }
      _ndc.copy(_v).project(camera);
      // Clamp into the viewport (inside the rail gutter / header) — when the pad is out of frame the caption holds
      // the edge nearest the wellhead, which still says where "surface" is.
      const W = window.innerWidth, H = window.innerHeight;
      const behind = _ndc.z > 1;
      let x = (_ndc.x * 0.5 + 0.5) * W, y = (-_ndc.y * 0.5 + 0.5) * H;
      if (behind) { x = W - x; y = H - y; }
      const minX = (W > 1100 ? 210 : 16) + 90, maxX = W - 110, minY = 84 + 40, maxY = H - 24;
      const el = cap.el;
      // The standoff caption labels a specific line: if that line is not on screen the label is pointing at
      // nothing, so it hides rather than clamping to an edge (round 6).
      if (cap === standoffCaption) {
        const off = behind || x < minX - 40 || x > maxX + 40 || y < minY || y > maxY;
        el.style.visibility = off ? 'hidden' : '';
        if (off) continue;
      }
      if (cap.side) {
        // level labels: flush right of the rule's end, never clamped — hidden when the point is off-screen or behind
        // The level chips label a rule out in the world. When the rule's end projects behind the chapter's copy
        // column the chip lands on the device figure and reads as a caption on the product photograph (round 14:
        // at pump-off "fluid level · now" sat at x 411–543, y 200–220, inside the .device-banner card and 170 px
        // above the rule it names). Same rule as the standoff caption: a label pointing at nothing hides rather
        // than clamps — clamping x would move the chip off a rule that is not screen-horizontal in this camera.
        const occluded = !!sideRect && (x + 42) < sideRect.right + 12 && y > sideRect.top - 8 && y < sideRect.bottom + 8;
        const off = behind || occluded || x < minX - 60 || x > maxX || y < minY || y > maxY;
        el.style.visibility = off ? 'hidden' : '';
        if (!off) el.style.transform = `translate(${(x + 42).toFixed(1)}px, ${y.toFixed(1)}px) translate(0, -50%)`;
        continue;
      }
      const cx = Math.min(maxX, Math.max(minX, x)), cy = Math.min(maxY, Math.max(minY, y));
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
    setLevelShown(v) { levelShown = Boolean(v); levelTick.visible = levelShown && chapterActive.deployment; earlierTick.visible = levelShown && chapterActive.deployment && earlier != null; pump_(); },
    focusHalo(pos) { focusHalo(pos); pump_(); },
    liftBench(on) { benchTarget = on ? 1 : 0; pump_(); },
    brightenCut(on) { cutTarget = on ? 1 : 0; pump_(); },
    setSurfaceCaption(el) { surfaceCaption = el ? { el } : null; if (el) pump_(); },
    setStandoffCaption(el, obj) { standoffCaption = el && obj ? { el, obj } : null; if (el) pump_(); },
    setLevelCaptions(nowEl, earlierEl) { levelCaption = nowEl ? { el: nowEl, obj: levelTick, side: true } : null; earlierCaption = earlierEl ? { el: earlierEl, obj: earlierTick, side: true } : null; pump_(); },
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
