// Chapter 4 UI (spec §4 row 4, §12): x-ray toggle (tubing to 28 %, collar/sensor package read through, two ghost
// hairlines where the legs continue into rock), application chips that retint the schematic flow (Thermal · in
// development), the chapter's one invited action — the fluid-level instrument (a line between above-pump and
// pump-off; the pump warms; trend ghost "earlier · now"; at pump-off "surface looks the same" at the pad while
// the drive head keeps turning) — and six benefits on ONE focus rig. Qualitative throughout: no values.
import '../styles/tool.css';
import { getToolViz } from './tool.js';

// Flow chevron tints per application (sand family — no cyan; thermal keeps the sand and adds a warm haze).
const FLOW_TINTS = { light: '#e9dcc0', heavy: '#d9c39a', gas: '#c9d4da', thermal: '#d9c39a' };

export const DEPLOY_GATE = [[3.6, 5.2]];

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
    if (range) {
      viz.setLevel(lastReleased);
      I.register('fluid-level', { proxy: viz.levelRing, twin: range, chapters: DEPLOY_GATE, cursor: 'ns-resize', apply3D() {} });
      const reflectLevel = () => {
        const d = Number(range.value) / 100;
        viz.setLevel(d);
        range.setAttribute('aria-valuetext', levelText(d));
        const pumpOff = d >= 0.97;
        if (surface) { if (pumpOff && inChapter) { surface.hidden = false; viz.setSurfaceCaption(surface); } else { surface.hidden = true; viz.setSurfaceCaption(null); } }
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
    });
  }

  if (window.__yotinWorld) attach(window.__yotinWorld);
  else document.addEventListener('world:first-frame', () => attach(window.__yotinWorld), { once: true });
  return { xrayBtn, appChips, range, benefits };
}
