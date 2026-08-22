// Probe cursor (spec §5): an additive sand ring that behaves as an instrument. Gates: ≥ 1100 px, fine pointer,
// world live, only over canvas zones (never over copy/controls), suppressed while scrolling, self-disables on
// blur/hidden and after any frame over ~40 ms. The native cursor is never hidden. "Probe earns cyan": a short
// inner arc turns cyan only where the pointer intersects the field above threshold (chapter 3, near the collar).
import '../styles/probe.css';
import { createOverUI, TEXT, SECTIONS } from './overUI.js';

export function mountProbe() {
  if (!window.matchMedia('(pointer: fine)').matches || window.innerWidth < 1100) return null;
  const html = document.documentElement;
  const el = document.createElement('div');
  el.className = 'probe';
  el.setAttribute('aria-hidden', 'true');
  const arc = document.createElement('span');
  arc.className = 'probe-arc';
  el.appendChild(arc);
  document.body.appendChild(el);
  let x = -100, y = -100, tx = -100, ty = -100, visible = false, scrolling = 0, disabled = false, slow = 0, last = performance.now();
  const show = (v) => { if (visible !== v) { visible = v; el.classList.toggle('is-on', v); } };
  const overUI = createOverUI(TEXT, SECTIONS);
  window.addEventListener('pointermove', (e) => {
    if (disabled || !html.classList.contains('world-live')) { show(false); return; }
    tx = e.clientX; ty = e.clientY;
    show(!overUI(e.target) && !scrolling);
  }, { passive: true });
  window.addEventListener('scroll', () => { scrolling = 1; show(false); clearTimeout(window.__probeScrollT); window.__probeScrollT = setTimeout(() => { scrolling = 0; }, 140); }, { passive: true });
  window.addEventListener('blur', () => show(false));
  document.addEventListener('visibilitychange', () => { if (document.hidden) show(false); });
  document.addEventListener('world:motion', (e) => { if (e.detail && e.detail.paused) show(false); });
  function tick(now) {
    const dt = now - last; last = now;
    if (dt > 40) { slow++; if (slow > 12) { disabled = true; show(false); el.remove(); return; } } else slow = Math.max(0, slow - 1);
    x += (tx - x) * 0.35; y += (ty - y) * 0.35;
    el.style.transform = `translate3d(${x - 14}px, ${y - 14}px, 0)`;
    // earn cyan: chapter 3 and the pointer near the candle in screen space
    const w = window.__yotinWorld;
    if (w && visible) {
      const p = w.state.exact;
      let near = false;
      if (p > 2.6 && p < 4.2) {
        const v = w.island.tool.group.position.clone();
        w.island.parallax.localToWorld(v);
        v.project(w.camera);
        const sx = (v.x * 0.5 + 0.5) * window.innerWidth, sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
        near = Math.hypot(sx - x, sy - y) < 220;
      }
      el.classList.toggle('is-field', near);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  return el;
}
