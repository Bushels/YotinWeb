// Motion control (spec §5, §7): one fixed-layer "Pause motion" / "Resume motion" toggle that exists from the
// first paint of the world (or of the stills page), persists in localStorage['yotin-motion'] and stops every
// ambient motion — the render loop's ambient tick (boot.js pause()/resume()), CSS idles, and the DOM reveals
// (html.motion-paused, see world.css). Other modules listen for `world:motion` {paused}.
//
// State precedence at load: stored choice → prefers-reduced-motion → running.

const KEY = 'yotin-motion';
const LABEL_PAUSE = 'Pause motion';
const LABEL_RESUME = 'Resume motion';

let button = null;
let paused = false;

function readStored() {
  try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
}
function writeStored(v) {
  try { window.localStorage.setItem(KEY, v); } catch (e) { /* private mode / quota — the choice still holds for this page */ }
}
function reduceMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
}
function track(name, params) {
  try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (e) { /* analytics never breaks the control */ }
}

// SVG glyph built with createElementNS (no innerHTML). Pause = two bars; resume = one triangle.
function svgGlyph() {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 12 12');
  svg.setAttribute('width', '12');
  svg.setAttribute('height', '12');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const bars = document.createElementNS(NS, 'path');
  bars.setAttribute('class', 'motion-toggle-bars');
  bars.setAttribute('d', 'M2 1.5h2.6v9H2zM7.4 1.5H10v9H7.4z');
  const tri = document.createElementNS(NS, 'path');
  tri.setAttribute('class', 'motion-toggle-tri');
  tri.setAttribute('d', 'M2.5 1.5 10.5 6 2.5 10.5z');
  svg.appendChild(bars);
  svg.appendChild(tri);
  return svg;
}

function render() {
  if (!button) return;
  button.setAttribute('aria-pressed', paused ? 'true' : 'false');
  button.querySelector('.motion-toggle-label').textContent = paused ? LABEL_RESUME : LABEL_PAUSE;
  button.classList.toggle('is-paused', paused);
}

function applyToWorld() {
  const w = window.__yotinWorld;
  if (!w) return;
  try {
    if (paused) {
      if (typeof w.pause === 'function') w.pause();
      else if (w.renderer) w.renderer.setAnimationLoop(null);
    } else if (typeof w.resume === 'function') {
      w.resume();
    }
  } catch (e) { /* a broken world must not break the control */ }
}

/** Set the paused state. `persist:false` applies it without overwriting the visitor's stored choice
 *  (used by the stills opt-in, which loads the world paused under reduced motion). */
export function setMotionPaused(next, { persist = true, silent = false } = {}) {
  next = Boolean(next);
  const changed = next !== paused;
  paused = next;
  document.documentElement.classList.toggle('motion-paused', paused);
  render();
  applyToWorld();
  if (persist) writeStored(paused ? 'paused' : 'running');
  if (changed && !silent) {
    document.dispatchEvent(new CustomEvent('world:motion', { detail: { paused } }));
  }
  return paused;
}

export function isMotionPaused() { return paused; }

export function mountMotionToggle() {
  const layer = document.querySelector('[data-fixed-layer]');
  const html = document.documentElement;
  // Apply the persisted state before anything paints (this runs inside the entry module's synchronous evaluation).
  const stored = readStored();
  paused = stored === 'paused' ? true : stored === 'running' ? false : reduceMotion();
  html.classList.toggle('motion-paused', paused);

  if (!layer) return null;
  if (button) return button;
  button = document.createElement('button');
  button.type = 'button';
  button.className = 'motion-toggle';
  button.dataset.motionToggle = '';
  button.setAttribute('aria-pressed', paused ? 'true' : 'false');
  button.appendChild(svgGlyph());
  const label = document.createElement('span');
  label.className = 'motion-toggle-label';
  button.appendChild(label);
  layer.appendChild(button);
  render();

  button.addEventListener('click', () => {
    setMotionPaused(!paused);
    track('motion_toggle', { on: paused ? 0 : 1 });
  });

  // The world may boot after this mounts (main.js dynamic import, or the stills opt-in): sync it on its first frame.
  document.addEventListener('world:first-frame', () => { if (paused) applyToWorld(); });
  return button;
}
