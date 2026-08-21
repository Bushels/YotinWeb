// Chapter 3 UI (spec §4 row 3, §5, §12): "Commission the well" — a three-item commissioning list the visitor
// finishes by doing ONE thing, the surface readout whose digits appear for the first time when the reading
// lands (tabular settle, no scramble), the probe on rock (click/tap or 200 ms dwell — never a travelling
// pointer), and the session remembering that a reading arrived.
//
//   01  already true when they arrive from chapter 2; renders ticked and settles once when ch. 3 is reached.
//   02  the one invited action: a pre-lit footprint on the pad, clicked in the world or through its twin.
//   03  not an action but an arrival: a short honest wait after 02, then the digits settle, 03 ticks itself
//       and the surface-output line appears beneath as the closing beat.
//
// Reversible (§5): "Lift the receiver" returns the lease to the state before 02 — the receiver goes, the loop
// goes, the digits dissolve to dashes and 03 unticks. 01 stays ticked; it was never ours to undo.
//
// One state machine drives every path. When the world is present it also drives the receiver, the footprint
// and the loop; on the reduced-motion / no-WebGL page the same functions run with no world and the wait
// collapses to nothing, so the lesson works from first paint either way.
import '../styles/signal.css';

// The honest wait between the act and the reading (Shop's "Hold tight"). Round 12d: the wait became the show —
// the world answers the placement with the acquire sequence (world/circuit.js: the reading climbs the cased
// string, ~700 ms, then chart glyphs bloom at the wellhead, ~620 ms, settling at ~1.22 s). The reading lands as
// the bloom settles, so the caption's "acquiring…" is describing something the visitor can actually watch.
const WAIT_MS = 1500;
const SETTLE_MS = 1300;       // the existing count-tween shape: cubic-out

export function mountSignal() {
  const stage = document.querySelector('[data-signal-stage]');
  const block = document.querySelector('[data-commission-block]');
  if (!stage || !block) return null;
  const html = document.documentElement;
  const steps = new Map(Array.from(block.querySelectorAll('[data-step]')).map((li) => [li.dataset.step, li]));
  const placeBtn = block.querySelector('[data-commission-place]');
  const resetBtn = block.querySelector('[data-commission-reset]');
  const caption = block.querySelector('[data-commission-caption]');
  const readout = stage.querySelector('[data-readout]');
  const foot = stage.querySelector('[data-readout-foot]');
  const values = Array.from(stage.querySelectorAll('[data-readout-value]'));

  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The honest wait is a response to an act the visitor can SEE — the receiver planting on the pad. On the
  // stills path there is no pad to plant it on, so the wait would be a spinner for its own sake: it collapses.
  const instant = () => reduced || html.classList.contains('stills-on');

  const PLACE_LABEL = 'Place the receiver on the pad';
  const PLACED_LABEL = 'Receiver on the pad';

  let world = null, circuit = null, waitTimer = 0, landedOnce = false;
  const S = { placed: false, landed: false };

  function say(text) { if (caption && caption.textContent !== text) caption.textContent = text; }
  function stepState(id, state, label) {
    const li = steps.get(id);
    if (!li) return;
    li.dataset.state = state;
    const tag = li.querySelector('[data-step-state]');
    if (tag && label !== undefined) tag.textContent = label;
  }

  // Tabular settle for the three representative values. Under reduced motion the final value is rendered
  // directly — the arrival is the point, the tween is not.
  function settleDigits() {
    values.forEach((el) => {
      const final = Number(el.dataset.final), dec = Number(el.dataset.decimals || 0), unit = el.dataset.unit;
      if (reduced) { el.textContent = `${final.toFixed(dec)} ${unit}`; return; }
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / SETTLE_MS);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = `${(final * e).toFixed(dec)} ${unit}`;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
  function dissolveDigits() {
    values.forEach((el) => { el.textContent = `— ${el.dataset.unit}`; });
  }

  // 02 — the one action. The receiver plants with a single settle beat; nothing is claimed yet.
  function place() {
    if (S.placed) return;
    S.placed = true;
    if (circuit) {
      circuit.placeStakeAt(circuit.RECEIVER); circuit.set({ placed: true });
      // The world's answer to the act. Under reduced motion the sequence has no rise to watch, so the charts
      // arrive already settled at the wellhead rather than being skipped — the payoff is the picture, not the
      // animation (spec §7).
      if (instant()) circuit.settleAcquire(); else circuit.startAcquire();
    }
    if (placeBtn) { placeBtn.setAttribute('aria-pressed', 'true'); placeBtn.setAttribute('aria-disabled', 'true'); placeBtn.textContent = PLACED_LABEL; }
    if (resetBtn) resetBtn.hidden = false;
    stepState('02', 'done', 'placed');
    stepState('03', 'waiting', 'acquiring…');
    say('Receiver on the pad — acquiring…');
    world && world.requestRender();
    world && world.track && world.track('hotspot_activate', { id: 'receiver-placed', input: 'state' });
    clearTimeout(waitTimer);
    if (instant()) land();
    else waitTimer = setTimeout(land, WAIT_MS);
  }

  // 03 — the arrival. The checklist finishes itself out from under them.
  function land() {
    if (!S.placed || S.landed) return;
    S.landed = true;
    settleDigits();
    readout.classList.add('is-closed');
    if (foot) foot.dataset.arrived = 'true';
    stepState('03', 'done', 'reading');
    say('The reading is on SCADA. The well is commissioned.');
    if (circuit) circuit.set({ landed: true });
    if (!landedOnce) {
      landedOnce = true;
      html.classList.add('signal-received');   // the session remembers the arrival (the ChatFi launcher warms; the
                                               // brand logomark is true-colour from first paint, round 13a)
      world && world.island.field.swell();
      world && world.track && world.track('hotspot_activate', { id: 'reading-landed', input: 'state' });
    }
    world && world.requestRender();
  }

  // Reversible (§5): back to the state before 02. 01 stays ticked.
  function reset() {
    clearTimeout(waitTimer);
    S.placed = false; S.landed = false;
    if (circuit) circuit.set({ placed: false, landed: false });
    dissolveDigits();
    readout.classList.remove('is-closed');
    if (foot) delete foot.dataset.arrived;
    if (placeBtn) { placeBtn.setAttribute('aria-pressed', 'false'); placeBtn.removeAttribute('aria-disabled'); placeBtn.textContent = PLACE_LABEL; }
    if (resetBtn) resetBtn.hidden = true;
    stepState('02', 'todo', 'waiting');
    stepState('03', 'todo', 'no reading');
    say('Receiver lifted — nothing is listening on the lease.');
    if (placeBtn) placeBtn.focus({ preventScroll: true });
    world && world.requestRender();
  }

  if (placeBtn) placeBtn.addEventListener('click', () => { if (!S.placed) place(); });
  if (resetBtn) resetBtn.addEventListener('click', reset);

  // 01 settles once when the chapter is first reached — a response to arriving, not an idle animation, and it
  // is already ticked in the markup so the no-JS page tells the truth too.
  const first = steps.get('01');
  if (first && typeof IntersectionObserver === 'function') {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      first.dataset.arrived = 'true';
      io.disconnect();
    }, { rootMargin: '0px 0px -20% 0px' });
    io.observe(block);
  } else if (first) {
    first.dataset.arrived = 'true';
  }

  async function attach(w) {
    world = w;
    // world module: dynamic import so the stills path never requests a world-chunk byte (spec §6)
    const { createCircuit } = await import('../world/circuit.js');
    circuit = createCircuit(w.island, w.THREE);
    const I = w.interactions;
    const gate = [[2.6, 4.2]];
    // The footprint and its twin are the same hotspot: clicking either plants the receiver.
    I.register('receiver', {
      proxy: circuit.receiverProxy,
      twin: placeBtn,
      chapters: gate,
      apply3D(next) { circuit.highlightFootprint(next === 'hover' || next === 'focus'); w.requestRender(); },
      onActivate() { place(); },
    });
    // Carry any state the visitor already reached on the DOM-only path into the world.
    if (S.placed) { circuit.placeStakeAt(circuit.RECEIVER); circuit.set({ placed: true, landed: S.landed }); circuit.settleAcquire(); }

    // Probe on rock: click/tap, or a 200 ms dwell — never a merely travelling pointer.
    let dwellTimer = 0, lastX = 0, lastY = 0, moved = true;
    const canvas = w.renderer.domElement;
    window.addEventListener('pointerdown', (e) => { if (!inChapter(w)) return; if (overUI(e)) return; circuit.probe(w.camera, canvas, e.clientX, e.clientY); w.requestRender(); }, { passive: true });
    window.addEventListener('pointermove', (e) => {
      if (!inChapter(w) || overUI(e) || e.pointerType === 'touch') return;
      if (Math.abs(e.clientX - lastX) > 3 || Math.abs(e.clientY - lastY) > 3) { moved = true; lastX = e.clientX; lastY = e.clientY; clearTimeout(dwellTimer); dwellTimer = setTimeout(() => { if (moved) { circuit.probe(w.camera, canvas, lastX, lastY); w.requestRender(); moved = false; } }, 200); }
    }, { passive: true });

    // Per-frame: draw the loop, and light the footprint only while chapter 3 is on screen — a sand reticle on
    // the pad in the golden-hour chapters would be a control with nothing to control.
    // Real elapsed time, not an assumed 1/60: on a software renderer or a slow phone the loop had drawn only
    // ~40 % of its length by the time the caption already claimed the reading had landed (round 6).
    let lastTick = 0, footOn = null;
    const tick = (now) => {
      const dt = lastTick ? Math.min(0.25, (now - lastTick) / 1000) : 1 / 60;
      lastTick = now;
      const want = inChapter(w) && !S.placed;
      if (want !== footOn) { footOn = want; circuit.showFootprint(want); w.requestRender(); }
      if (circuit.update(dt, w.camera)) w.requestRender(); // the acquire sequence keeps the on-demand renderer awake
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function inChapter(w) { const p = w.state.exact; return p >= 2.6 && p < 4.2; }
  function overUI(e) { const t = e.target; return t && t.closest && Boolean(t.closest('a, button, input, select, textarea, label, summary, .rail, .fixed-layer, .chatfi-launcher, .chatfi-panel, .signal-stage, .commission-block, .qualifier')); }

  if (window.__yotinWorld) attach(window.__yotinWorld);
  else document.addEventListener('world:first-frame', () => attach(window.__yotinWorld), { once: true });
  return { place, reset, state: S };
}
