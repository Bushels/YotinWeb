// Chapter 3 UI (spec §4 row 3, §12): journey steps as hotspot twins that replay their beat; Close the Circuit
// with "no difference, no reading"; the surface readout whose digits appear for the first time when the loop
// closes (tabular settle, no scramble); the conductive-bed chip on the seal; the probe on rock (click/tap or
// 200 ms dwell — never a travelling pointer); and the logomark receiving the signal.
import '../styles/signal.css';

export function mountSignal() {
  const stage = document.querySelector('[data-signal-stage]');
  if (!stage) return null;
  const html = document.documentElement;
  const refWell = stage.querySelector('[data-hotspot="ref-wellhead"]');
  const refGround = stage.querySelector('[data-hotspot="ref-ground"]');
  const stakeLabel = stage.querySelector('[data-hotspot="stake"]');
  const stakeRange = stakeLabel && stakeLabel.querySelector('input');
  const caption = stage.querySelector('[data-circuit-caption]');
  const readout = stage.querySelector('[data-readout]');
  const diff = stage.querySelector('[data-readout-diff]');
  const values = Array.from(stage.querySelectorAll('[data-readout-value]'));
  const sealChip = stage.querySelector('[data-seal-chip]');
  const steps = Array.from(document.querySelectorAll('.journey-list > li'));

  let world = null, circuit = null, closedOnce = false, digitsShown = false;

  function say(text) { if (caption && caption.textContent !== text) caption.textContent = text; }

  // Tabular settle for the three representative values (the existing count tween shape: cubic-out, 1300 ms).
  function settleDigits() {
    values.forEach((el) => {
      const final = Number(el.dataset.final), dec = Number(el.dataset.decimals || 0), unit = el.dataset.unit;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / 1300);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = `${(final * e).toFixed(dec)} ${unit}`;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    digitsShown = true;
  }
  function dissolveDigits() {
    values.forEach((el) => { el.textContent = `— ${el.dataset.unit}`; });
    digitsShown = false;
  }

  // DOM-only fallback so the lesson works on the stills path too. The Close-the-Circuit beat is a state machine
  // about voltage, not about three.js: on the reduced-motion / no-WebGL page the two references and the separation
  // slider used to render as dead controls under an aria-live caption describing a state nobody could reach
  // (round 7). This stands in for `circuit` when there is no world; the world path overwrites it in attach().
  function makeDomCircuit() {
    const st = { wellhead: false, ground: false, closed: false };
    let sep = stakeRange ? Number(stakeRange.value) / 100 : 0.6;
    return {
      state: st,
      get sep() { return sep; },
      placeStake(t) { sep = Math.max(0, Math.min(1, t)); },
      updateLoop() {},
      set(next) { Object.assign(st, next); st.closed = st.wellhead && st.ground && sep > 0.06; },
    };
  }

  function reflect() {
    if (!circuit) return;
    const s = circuit.state;
    refWell.setAttribute('aria-pressed', String(s.wellhead));
    refGround.setAttribute('aria-pressed', String(s.ground));
    readout.classList.toggle('is-closed', s.closed);
    if (s.closed) {
      if (!digitsShown) settleDigits();
      if (diff) diff.textContent = 'V₁ − V₂';
      say('Both references placed — the loop closes and the reading resolves at surface.');
      if (!closedOnce) { closedOnce = true; html.classList.add('signal-received'); world && world.island.field.swell(); world && world.track && world.track('hotspot_activate', { id: 'circuit-closed', input: 'state' }); }
    } else if (s.wellhead && s.ground && circuit.sep <= 0.06) {
      if (digitsShown) dissolveDigits();
      say('Both references in the same place: no difference, no reading.');
    } else if (s.wellhead || s.ground) {
      if (digitsShown) dissolveDigits();
      say('One point is not a measurement — voltage is a difference.');
    } else {
      if (digitsShown) dissolveDigits();
      say(''); // the lede above already says "place both" — no duplicate line at rest (round 1)
    }
    world && world.requestRender();
  }

  // Wire the DOM controls at first paint on every path. If the world arrives, attach() aborts these listeners and
  // re-registers the same controls as raycast twins, so the behaviour is identical and never doubled.
  const domCtl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const domOpts = domCtl ? { signal: domCtl.signal } : undefined;
  function wireDom() {
    if (!circuit) circuit = makeDomCircuit();
    refWell.addEventListener('click', () => { circuit.set({ wellhead: !circuit.state.wellhead }); reflect(); }, domOpts);
    refGround.addEventListener('click', () => { circuit.set({ ground: !circuit.state.ground }); reflect(); }, domOpts);
    if (stakeRange) stakeRange.addEventListener('input', () => { circuit.placeStake(Number(stakeRange.value) / 100); circuit.updateLoop(); circuit.set({}); reflect(); }, domOpts);
    reflect();
  }

  async function attach(w) {
    world = w;
    if (domCtl) domCtl.abort();   // hand the same controls over to the world's twins
    circuit = null;
    // world module: dynamic import so the stills path never requests a world-chunk byte (spec §6)
    const { createCircuit } = await import('../world/circuit.js');
    circuit = createCircuit(w.island, w.THREE);
    const I = w.interactions;
    const gate = [[2.6, 4.2]];
    I.register('ref-wellhead', { proxy: circuit.whProxy, twin: refWell, chapters: gate, apply3D() {}, onActivate() { circuit.set({ wellhead: !circuit.state.wellhead }); reflect(); } });
    I.register('ref-ground', { proxy: circuit.stakeProxy, twin: refGround, chapters: gate, apply3D() {}, onActivate() { circuit.set({ ground: !circuit.state.ground }); reflect(); } });

    // The 3D references toggle themselves; the interactions FSM's "active" state is not what we mean here, so
    // reflect aria-pressed from circuit state instead of the FSM's active flag.
    if (stakeRange) {
      stakeRange.addEventListener('input', () => { circuit.placeStake(Number(stakeRange.value) / 100); circuit.updateLoop(); circuit.set({}); reflect(); });
    }
    // Journey steps: replay their beat on hover/focus/tap (twins only; the beats are visual, not claims).
    const beats = [
      () => { w.island.field.swell(); },                                              // 01 gap
      () => { w.island.field.swell(); },                                              // 02 transmit
      () => { refWell.focus({ preventScroll: true }); },                              // 03 decode → look at the references
      () => { if (circuit.state.closed) settleDigits(); else say('Close the circuit first — then the reading lands on RS-485 / 4-20 mA.'); }, // 04 connect
    ];
    steps.forEach((li, i) => {
      li.setAttribute('tabindex', '0');
      li.dataset.hotspot = `journey-0${i + 1}`;
      I.register(`journey-0${i + 1}`, { proxy: null, twin: li, chapters: gate, apply3D() {}, onActivate: () => beats[i] && beats[i]() });
    });
    // Seal chip: the rail legend's Colorado Shale twin fires world:focus-stratum; also expose on the chip.
    document.addEventListener('world:focus-stratum', (e) => {
      const name = e.detail && e.detail.name;
      if (sealChip) sealChip.hidden = !(name === 'colorado' && (w.state.exact >= 2.6 && w.state.exact < 4.4));
    });
    // Probe on rock: click/tap, or a 200 ms dwell — never a merely travelling pointer.
    let dwellTimer = 0, lastX = 0, lastY = 0, moved = true;
    const canvas = w.renderer.domElement;
    window.addEventListener('pointerdown', (e) => { if (!inChapter(w)) return; if (overUI(e)) return; circuit.probe(w.camera, canvas, e.clientX, e.clientY); w.requestRender(); }, { passive: true });
    window.addEventListener('pointermove', (e) => {
      if (!inChapter(w) || overUI(e) || e.pointerType === 'touch') return;
      if (Math.abs(e.clientX - lastX) > 3 || Math.abs(e.clientY - lastY) > 3) { moved = true; lastX = e.clientX; lastY = e.clientY; clearTimeout(dwellTimer); dwellTimer = setTimeout(() => { if (moved) { circuit.probe(w.camera, canvas, lastX, lastY); w.requestRender(); moved = false; } }, 200); }
    }, { passive: true });
    // Per-frame loop draw
    // Real elapsed time, not an assumed 1/60: on a software renderer or a slow phone the loop had drawn only ~40 %
    // of its length by the time the caption already claimed the circuit was closed (round 6).
    let lastTick = 0;
    const tick = (now) => {
      const dt = lastTick ? Math.min(0.25, (now - lastTick) / 1000) : 1 / 60;
      lastTick = now;
      circuit.update(dt);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    reflect();
  }

  function inChapter(w) { const p = w.state.exact; return p >= 2.6 && p < 4.2; }
  function overUI(e) { const t = e.target; return t && t.closest && Boolean(t.closest('a, button, input, select, textarea, label, summary, .rail, .fixed-layer, .chatfi-launcher, .chatfi-panel, .signal-stage, .qualifier')); }

  // Detent (round 9, Mobbin #3): the track's one marked position is separation 0 — the stake back on the
  // wellhead, no difference to read (spec §12). Arrowing down from just above it lands ON it instead of skating
  // past in ones, so the reversible state is reachable from the DOM twin and not only by dragging in 3D. The
  // input event is re-dispatched, so both the world path and the reduced-motion DOM twin see the same change.
  if (stakeRange) {
    stakeRange.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowDown') return;
      const v = Number(stakeRange.value);
      if (!(v > 0 && v <= 7)) return;
      e.preventDefault();
      stakeRange.value = '0';
      stakeRange.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  wireDom(); // the lesson works from first paint, world or not
  if (window.__yotinWorld) attach(window.__yotinWorld);
  else document.addEventListener('world:first-frame', () => attach(window.__yotinWorld), { once: true });
  return { reflect };
}
