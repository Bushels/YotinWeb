// Chapter 4 UI (spec §4 row 4, §12): x-ray toggle (tubing to 28 %, collar/sensor package read through, two ghost
// hairlines where the legs continue into rock), application chips that retint the schematic flow (Thermal · in
// development), the chapter's one invited action — the fluid-level instrument (a line between above-pump and
// pump-off; the pump warms; trend ghost "earlier · now"; at pump-off "surface looks the same" at the pad while
// the drive head keeps turning) — and six benefits on ONE focus rig. Qualitative throughout: no values.
import '../styles/tool.css';
import { getToolViz } from './tool.js';

// Flow chevron tints per application (sand family — no cyan; thermal keeps the sand and adds a warm haze).
const FLOW_TINTS = { light: '#e9dcc0', heavy: '#d9c39a', gas: '#c9d4da', thermal: '#d9c39a' };

export const DEPLOY_GATE = [[3.6, 4.998]]; // ends where the yôtin chapter arrives (the #company top at the header) — its labels, pump and x-ray must not outlive chapter 4 (round 3)

export function mountDeployment() {
  const insight = document.getElementById('insight');
  const benefitsList = document.querySelector('[data-drill-benefits]');
  if (!insight) return null;
  const xrayBtn = insight.querySelector('[data-hotspot="xray"]');
  const xrayCaption = insight.querySelector('[data-xray-caption]');
  const appChips = Array.from(insight.querySelectorAll('.app-chip[data-hotspot]'));
  const appNote = insight.querySelector('[data-app-note]');
  const range = insight.querySelector('[data-hotspot="fluid-level"]');
  const trend = insight.querySelector('[data-fluid-trend]');
  const surface = insight.querySelector('[data-surface-caption]');
  const benefits = benefitsList ? Array.from(benefitsList.querySelectorAll('li[data-hotspot]')) : [];

  benefits.forEach((li) => li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); li.click(); } }));

  function levelText(d) { return d >= 0.97 ? 'pump-off' : d <= 0.08 ? 'above pump' : 'between above-pump and pump-off'; }

  /* ---- the readout the slider settles into (Kyle, 2026-08-20) ---------------------------------------
     Move the fluid level, stop, and 400 ms later the card says what a tool down there would be reading —
     plus what changed since the last time it settled. The value model is a straight line between the two
     ends of the instrument the visitor is already holding: more fluid over the pump = more head on the
     gauge and a marginally warmer tool; at pump-off it lands exactly on the chapter-3 readout (158 kPa,
     26 °C) so the two never contradict each other. Representative throughout: no live data, no WellFi
     figure, and the readout says so on every line.

     Deliberately mounted OUT here rather than inside attach(): on the reduced-motion / no-WebGL path the
     world never arrives, but the slider still moves and must still answer. */
  const valuesEl = insight.querySelector('[data-fluid-values]');
  const deltaEl = insight.querySelector('[data-fluid-delta]');
  const P_ABOVE = 420, P_PUMPOFF = 158;   // kPa, representative
  const T_ABOVE = 26.9, T_PUMPOFF = 26.0; // °C, representative
  const readingFor = (d) => ({ p: P_ABOVE + (P_PUMPOFF - P_ABOVE) * d, t: T_ABOVE + (T_PUMPOFF - T_ABOVE) * d });
  const signed = (n, dec) => (n > 0 ? '+' : n < 0 ? '−' : '±') + Math.abs(n).toFixed(dec);

  if (range && valuesEl && deltaEl) {
    let previous = null, settleTimer = 0;
    const printReading = () => {
      const r = readingFor(Number(range.value) / 100);
      const p = Math.round(r.p), t = Number(r.t.toFixed(1));
      valuesEl.hidden = false;
      valuesEl.textContent = '';
      const line = document.createElement('span');
      line.className = 'fluid-readout-figures';
      line.textContent = `${p} kPa · ${t.toFixed(1)} °C`;
      const chip = document.createElement('span');
      chip.className = 'tool-chip';
      chip.textContent = 'representative values';
      valuesEl.append(line, document.createTextNode(' at the tool '), chip);
      // Only the figures that actually moved are named: "±0.0 °C" is noise, not a delta.
      if (previous) {
        const parts = [];
        if (p !== previous.p) parts.push(`${signed(p - previous.p, 0)} kPa`);
        if (t !== previous.t) parts.push(`${signed(t - previous.t, 1)} °C`);
        if (parts.length) {
          deltaEl.hidden = false;
          deltaEl.textContent = `Δ ${parts.join(' · ')} since the last reading`;
        }
      }
      previous = { p, t };
    };
    // One schedule for both events: a range fires `change` per key press in some browsers, and a reading
    // per arrow key would be a stream of one-unit deltas rather than "you moved it, here is what changed".
    const schedule = () => { window.clearTimeout(settleTimer); settleTimer = window.setTimeout(printReading, 400); };
    range.addEventListener('input', schedule);
    range.addEventListener('change', schedule);
  }

  async function attach(w) {
    const viz = await getToolViz(w);
    const I = w.interactions;
    const on = (s) => s === 'hover' || s === 'focus' || s === 'active';
    let inChapter = false;

    // X-ray toggle. The registry keeps one "active" hotspot per world, so toggles own their state and hand the
    // FSM back to idle after each activation (the same pattern as the chapter-3 references).
    let xrayOn = false;
    function setXray(v) {
      xrayOn = Boolean(v);
      viz.setXray(xrayOn);
      xrayBtn.setAttribute('aria-pressed', String(xrayOn));
      if (xrayCaption) xrayCaption.hidden = !xrayOn;
      document.documentElement.classList.toggle('xray-on', xrayOn); // x-ray state on <html> (the figure lifts contrast only — it never shows its native cyan: one-candle rule)
    }
    I.register('xray', {
      proxy: null, twin: xrayBtn, chapters: DEPLOY_GATE,
      apply3D(state) { if (state === 'unavailable' && xrayOn) setXray(false); },
      onActivate(item, source) { setXray(!xrayOn); I.set('xray', 'idle', source); },
    });

    // Application chips retint the flow; thermal adds a warm haze and the "in development" chip.
    const tintFor = { 'app-light': FLOW_TINTS.light, 'app-heavy': FLOW_TINTS.heavy, 'app-gas': FLOW_TINTS.gas, 'app-thermal': FLOW_TINTS.thermal };
    let selectedApp = null;
    function selectApp(id) {
      selectedApp = id;
      appChips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.hotspot === id)));
      viz.setFlowTint(id ? tintFor[id] : null);
      viz.setThermal(id === 'app-thermal');
      if (appNote) appNote.hidden = id !== 'app-thermal';
    }
    appChips.forEach((chip) => {
      const id = chip.dataset.hotspot;
      I.register(id, {
        proxy: null, twin: chip, chapters: DEPLOY_GATE,
        apply3D(state) { if (state === 'unavailable' && selectedApp === id) selectApp(null); },
        onActivate(item, source) { selectApp(selectedApp === id ? null : id); I.set(id, 'idle', source); },
      });
    });

    // Fluid-level instrument — the invited action. Slider 0 = above pump, 1 = pump-off. Trend ghost on release.
    let lastReleased = range ? Number(range.value) / 100 : 0;
    // projected world labels at the level line ("now") and its trend ghost ("earlier") — the DOM caption alone
    // left the drag without a world-side consequence (round 3)
    const mkLabel = (text, cls) => { const el = document.createElement('p'); el.className = 'surface-caption level-caption ' + cls; el.textContent = text; el.hidden = true; el.setAttribute('aria-hidden', 'true'); document.body.appendChild(el); return el; };
    const nowLabel = mkLabel('fluid level · now', 'is-now');
    const earlierLabel = mkLabel('earlier', 'is-earlier');
    const wide = () => window.matchMedia('(min-width: 1101px)').matches; // on phones the range + its own caption carry now/earlier
    const showLabels = (on, withEarlier) => { on = on && wide(); nowLabel.hidden = !on; earlierLabel.hidden = !(on && withEarlier); viz.setLevelCaptions(on ? nowLabel : null, on && withEarlier ? earlierLabel : null); };
    if (range) {
      viz.setLevel(lastReleased);
      I.register('fluid-level', { proxy: viz.levelRing, twin: range, chapters: DEPLOY_GATE, cursor: 'ns-resize', apply3D() {} });
      const reflectLevel = () => {
        const d = Number(range.value) / 100;
        viz.setLevel(d);
        range.setAttribute('aria-valuetext', levelText(d));
        const pumpOff = d >= 0.97;
        if (surface) { if (pumpOff && inChapter) { surface.hidden = false; viz.setSurfaceCaption(surface); } else { surface.hidden = true; viz.setSurfaceCaption(null); } }
        showLabels(inChapter, trend && !trend.hidden);
      };
      range.addEventListener('input', reflectLevel);
      range.addEventListener('change', () => {
        const d = Number(range.value) / 100;
        if (Math.abs(d - lastReleased) > 0.005) { viz.setEarlier(lastReleased); if (trend) trend.hidden = false; }
        lastReleased = d;
        reflectLevel();
      });
      reflectLevel();
    }

    // Six benefits → one focus rig. Hover/focus/tap moves one highlight; keyboard follows list order.
    const rig = {
      'benefit-pump': (lit) => viz.focusHalo(lit ? viz.points.pump() : null),
      'benefit-production': (lit) => viz.focusHalo(lit ? viz.points.trunk() : null),
      'benefit-drawdown': (lit) => viz.focusHalo(lit ? viz.points.level() : null),
      'benefit-reservoir': (lit) => viz.liftBench(lit),
      'benefit-fluid': (lit) => { if (lit) viz.blinkFlow(500); },
      'benefit-optimization': (lit) => viz.brightenCut(lit),
    };
    let focused = null;
    benefits.forEach((li) => {
      const id = li.dataset.hotspot;
      I.register(id, {
        proxy: null, twin: li, chapters: DEPLOY_GATE,
        apply3D(state) {
          const lit = on(state);
          if (lit) { if (focused && focused !== id) rig[focused](false); focused = id; rig[id](true); }
          else if (focused === id) { rig[id](false); focused = null; }
        },
      });
    });

    document.addEventListener('world:progress', (e) => {
      const p = e.detail.exact;
      const inside = p >= DEPLOY_GATE[0][0] && p < DEPLOY_GATE[0][1];
      if (inside === inChapter) return;
      inChapter = inside;
      viz.setChapter('deployment', inside);
      viz.setLevelShown(inside);
      if (!inside) { if (surface) surface.hidden = true; viz.setSurfaceCaption(null); setXray(false); }
      else if (range && Number(range.value) / 100 >= 0.97 && surface) { surface.hidden = false; viz.setSurfaceCaption(surface); }
      showLabels(inside, trend && !trend.hidden);
    });
  }

  if (window.__yotinWorld) attach(window.__yotinWorld);
  else document.addEventListener('world:first-frame', () => attach(window.__yotinWorld), { once: true });
  return { xrayBtn, appChips, range, benefits };
}
