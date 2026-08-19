// Chapter 2 UI (spec §4 row 2, §5, §12): the five channel cards and six spec tiles as hotspot twins (sensor
// warms + a HUD value that settles in the card — tabular, "representative values"; dimension lines that draw on
// the tool for the public specs), the four chip-buttons that twin the tool's named volumes ("the gap makes the
// antenna"), and the chapter's one invited action — "Inspect tool": a contained orbit around the tool whose pose
// persists until Close or Esc (no hold-to-orbit, no spring-back; two-stage tap on touch only here).
import '../styles/tool.css';

export const TOOL_GATE = [[1.6, 3.4]];
const CAPTIONS = {
  collar: 'the collar is the candle — the emissive band that transmits',
  gap: 'electrical separation creates the transmitting geometry',
  sensors: 'pressure · temperature · vibration live in this package',
  battery: 'the battery volume — rated 5+ years, no cable to surface',
};
const DEFAULT_CAPTION = CAPTIONS.gap;

// One viz per world — deployment.js shares it (the same rig/update hooks, the same halo). The 3D helpers import
// three, so they load dynamically only once the world is live (the stills path never downloads them).
let sharedViz = null;
export function getToolViz(world) {
  if (!sharedViz || sharedViz.world !== world) {
    sharedViz = import('../world/toolViz.js').then(({ createToolViz }) => createToolViz(world));
    sharedViz.world = world;
  }
  return sharedViz;
}

export function mountTool() {
  const stage = document.querySelector('[data-chapter="tool"]');
  if (!stage) return null;
  const html = document.documentElement;
  const cards = Array.from(stage.querySelectorAll('.channel-card[data-hotspot]'));
  const tiles = Array.from(stage.querySelectorAll('.spec-grid > div[data-hotspot]'));
  const chips = Array.from(stage.querySelectorAll('.tool-hotspot[data-hotspot]'));
  const caption = stage.querySelector('[data-tool-caption]');
  const inspectBtn = stage.querySelector('[data-hotspot="inspect"]');
  const closeBtn = stage.querySelector('[data-tool-close]');
  const hint = stage.querySelector('[data-tool-hint]');

  // Non-native twins (role=button) activate on Enter/Space.
  [...cards, ...tiles].forEach((el) => {
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
  });

  // Icon settle — once per enter, opacity + scale (Phosphor glyphs are a webfont, not strokes).
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
    }, { threshold: 0.4 });
    cards.forEach((c) => io.observe(c));
  } else cards.forEach((c) => c.classList.add('is-visible'));

  // HUD value settle: tabular count-up over 1.3 s (cubic-out, the site's existing tween shape; no scramble).
  const hudTimers = new WeakMap();
  function settleHud(card) {
    const el = card.querySelector('[data-hud-value]');
    if (!el) return;
    if (hudTimers.get(card)) cancelAnimationFrame(hudTimers.get(card));
    const final = Number(el.dataset.final), dec = Number(el.dataset.decimals || 0), unit = el.dataset.unit;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 1300);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = `≈ ${(final * e).toFixed(dec)} ${unit}`;
      if (p < 1) hudTimers.set(card, requestAnimationFrame(step)); else { hudTimers.delete(card); card.classList.add('has-value'); }
    };
    hudTimers.set(card, requestAnimationFrame(step));
  }

  function say(text, lit) { if (!caption) return; caption.textContent = text; caption.classList.toggle('is-lit', Boolean(lit)); }

  async function attach(w) {
    const viz = await getToolViz(w);
    const I = w.interactions;
    const on = (s) => s === 'hover' || s === 'focus' || s === 'active';

    // Channel cards → sensor warms + per-channel emphasis + HUD value.
    const emphasis = {
      'ch-01': (st) => viz.warmCollar(on(st)),                       // pressure → collar rings brighten
      'ch-02': (st) => viz.warmWitness(on(st)),                      // temperature → witness capsule warm tint
      'ch-03': (st) => { if (on(st)) viz.vibrate(600); },            // vibration → tiny oscillation
      'ch-04': (st) => viz.setFlowTint(on(st) ? '#f0e6d2' : null),   // fluid → chevron colour one step
      'ch-05': (st) => { if (on(st)) viz.boostFlow(1000); },         // flow → chevron speed ×1.4 for 1 s
    };
    cards.forEach((card) => {
      const id = card.dataset.hotspot;
      I.register(id, {
        proxy: null, twin: card, chapters: TOOL_GATE,
        apply3D(state) {
          viz.warmVolume('sensors', on(state));
          emphasis[id] && emphasis[id](state);
          if (on(state)) settleHud(card);
        },
      });
    });

    // Surface output → the wellhead lifts briefly (sand emissive — no cyan before the circuit closes).
    const wellheadMeshes = [];
    w.island.well.wellhead.traverse((o) => { if (o.isMesh && o.material && o.material.emissive) { o.material.emissive.set('#e8dcc8'); wellheadMeshes.push(o); } });
    const pulseWellhead = () => viz.tween(700, (p) => wellheadMeshes.forEach((m) => { m.material.emissiveIntensity = 0.35 * Math.sin(p * Math.PI); }));

    // Spec tiles → a dimension line draws on the tool (the value stays in the DOM).
    const dimFor = { 'spec-pressure': 'pressure', 'spec-temperature': 'temperature', 'spec-od': 'od' };
    tiles.forEach((tile) => {
      const id = tile.dataset.hotspot;
      I.register(id, {
        proxy: null, twin: tile, chapters: TOOL_GATE,
        apply3D(state) {
          const dim = dimFor[id];
          if (dim) { if (on(state)) viz.showDim(dim); else viz.hideDim(dim); return; }
          if (id === 'spec-battery') viz.warmVolume('battery', on(state));
          else if (id === 'spec-installs') { if (on(state)) viz.tween(700, (p) => { w.island.tool.halo.material.opacity = Math.max(w.island.tool.halo.material.opacity, 0.55 * Math.sin(p * Math.PI)); }); }
          else if (id === 'spec-output') { if (on(state)) pulseWellhead(); }
        },
      });
    });

    // Tool volume chips → the named volume warms; the gap beat (spec §12: the gap makes the antenna).
    const volumeFor = { collar: 'gap', gap: 'gap', sensors: 'sensors', battery: 'battery' };
    chips.forEach((chip) => {
      const id = chip.dataset.hotspot;
      I.register(id, {
        proxy: (id === 'collar' ? w.island.tool.group.getObjectByName('collar-band') : w.island.tool.hotspots[volumeFor[id]]) || null, twin: chip, chapters: TOOL_GATE,
        apply3D(state) {
          const lit = on(state);
          if (id === 'collar') viz.warmCollar(lit); else viz.warmVolume(volumeFor[id], lit);
          if (lit) say(CAPTIONS[id], true);
          else if (!chips.some((c) => c !== chip && (c.classList.contains('is-hover') || c.classList.contains('is-active')))) say(DEFAULT_CAPTION, false);
          if (id === 'gap' && lit) viz.gapBeat();
        },
      });
    });

    // Inspect tool — the invited action: contained orbit; pose persists until Close / Esc.
    let orbitOn = false, armed = false, dragging = false, lastX = 0, lastY = 0;

    function openOrbit(source) {
      if (orbitOn) return;
      orbitOn = true;
      viz.startOrbit();
      if (w.island.setToolFocus) w.island.setToolFocus(1); // inspection sleeve + rings only while inspecting
      html.classList.add('tool-orbit');
      inspectBtn.setAttribute('aria-pressed', 'true');
      if (closeBtn) closeBtn.hidden = false;
      if (hint) hint.hidden = false;
      if (source === 'key') closeBtn && closeBtn.focus({ preventScroll: true });
    }
    function closeOrbit() {
      if (!orbitOn) return;
      orbitOn = false; dragging = false;
      viz.stopOrbit();
      if (w.island.setToolFocus) w.island.setToolFocus(0);
      html.classList.remove('tool-orbit', 'tool-orbit-drag');
      inspectBtn.setAttribute('aria-pressed', 'false');
      if (closeBtn) closeBtn.hidden = true;
      if (hint) hint.hidden = true;
      inspectBtn.focus({ preventScroll: true });
    }
    // Two-stage tap on touch only (spec §5): first tap arms/highlights, second activates. Registered BEFORE the
    // interactions twin listener so stopImmediatePropagation keeps the first tap from activating.
    let lastPointerType = 'mouse';
    inspectBtn.addEventListener('pointerdown', (e) => { lastPointerType = e.pointerType || 'mouse'; }, { passive: true });
    inspectBtn.addEventListener('click', (e) => {
      if (lastPointerType === 'touch' && !armed && !orbitOn) {
        armed = true; inspectBtn.classList.add('is-armed');
        I.set('inspect', 'focus', 'touch');
        e.stopImmediatePropagation(); e.preventDefault();
        setTimeout(() => { armed = false; inspectBtn.classList.remove('is-armed'); }, 4000);
        return;
      }
      armed = false; inspectBtn.classList.remove('is-armed');
    });
    // The orbit owns its state (it persists until Close / Esc — spec §4), so the FSM is handed back to idle after
    // each activation instead of riding the registry's one-active-per-world rule.
    I.register('inspect', {
      proxy: null, twin: inspectBtn, chapters: TOOL_GATE, cursor: 'grab',
      apply3D(state) { if (state === 'unavailable' && orbitOn) closeOrbit(); },
      onActivate(item, source) { if (orbitOn) closeOrbit(); else openOrbit(source); I.set('inspect', 'idle', source); },
    });
    closeBtn && closeBtn.addEventListener('click', closeOrbit);
    window.addEventListener('keydown', (e) => {
      if (!orbitOn) return;
      if (e.key === 'Escape') { e.preventDefault(); closeOrbit(); return; }
      const active = document.activeElement;
      const focusedControl = active === inspectBtn || active === closeBtn;
      if (!focusedControl) return;
      const step = 0.05;
      if (e.key === 'ArrowLeft') { viz.rotateOrbit(-step, 0); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { viz.rotateOrbit(step, 0); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { viz.rotateOrbit(0, -step); e.preventDefault(); }
      else if (e.key === 'ArrowDown') { viz.rotateOrbit(0, step); e.preventDefault(); }
    });
    const overUI = (t) => t && t.closest && Boolean(t.closest('a, button, input, select, textarea, label, summary, .rail, .fixed-layer, .chatfi-launcher, .chatfi-panel'));
    window.addEventListener('pointerdown', (e) => {
      if (!orbitOn || overUI(e.target)) return;
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      html.classList.add('tool-orbit-drag');
    }, { passive: true });
    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
      viz.rotateOrbit(dx * 0.0025, dy * 0.002);
    }, { passive: true });
    const endDrag = () => { if (dragging) { dragging = false; html.classList.remove('tool-orbit-drag'); } };
    window.addEventListener('pointerup', endDrag, { passive: true });
    window.addEventListener('pointercancel', endDrag, { passive: true });

    // Chapter gating for the viz (dimension lines only live in chapter 2; orbit closes when the chapter leaves).
    document.addEventListener('world:progress', (e) => {
      const p = e.detail.exact;
      const inside = p >= TOOL_GATE[0][0] && p < TOOL_GATE[0][1];
      viz.setChapter('tool', inside);
      if (!inside && orbitOn) closeOrbit();
    });
    say(DEFAULT_CAPTION, false);
  }

  if (window.__yotinWorld) attach(window.__yotinWorld);
  else document.addEventListener('world:first-frame', () => attach(window.__yotinWorld), { once: true });
  return { cards, tiles, chips };
}
