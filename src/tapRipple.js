// Tap ripple (spec §5 "Tap ripple", §12 "The world answers the thumb" — Kyle, round 18).
//
// Desktop's pointer parts the spruce and the wind in the hero and About spans (boot.js pointermove). Touch has
// no hover and the finger owns the scroll, so the translation is a TAP: one radial gust from the tap point,
// risen in ~140 ms and fully decayed under two seconds. It drives the EXISTING forest/wind pointer uniforms
// (island.setForestPointer) — no new geometry, no new draw calls, no colour, no DOM, no analytics.
//
// §13b binding lessons honoured here: the envelope is computed from REAL ELAPSED TIME (a per-frame `* k` decay
// runs ~20× slow under SwiftShader), and it is a RESPONSE, never ambient — when it reaches zero it releases the
// uniform and stops marking frames dirty.
import { createOverUI, TEXT, SECTIONS, DIALOG } from './ui/overUI.js';

export const TAP_MAX_MS = 350;   // longer than this is a press, not a tap
export const TAP_MAX_PX = 12;    // further than this is a scroll drag, not a tap
export const ATTACK_S = 0.14;    // rise
export const DECAY_S = 1.35;     // fall — total 1.49 s, inside the ≤ 2 s the spec promises

// The pointer-part chapter gate, shared verbatim with the desktop path in boot.js so the two can never drift.
export function inPartSpan(p) { return p < 0.7 || (p > 4.7 && p < 5.8); }

// Pure classifier (unit-tested): a tap is one finger, brief, and still.
export function isTapGesture({ elapsedMs, movedPx, pointers }) {
  return pointers === 1 && elapsedMs >= 0 && elapsedMs <= TAP_MAX_MS && movedPx <= TAP_MAX_PX;
}

// Envelope, in seconds since the tap. Smoothstep up, smoothstep down, zero (and stays zero) past the end.
export function rippleStrength(t) {
  if (!(t >= 0)) return 0;
  if (t < ATTACK_S) { const u = t / ATTACK_S; return u * u * (3 - 2 * u); }
  const v = (t - ATTACK_S) / DECAY_S;
  if (v >= 1) return 0;
  return 1 - v * v * (3 - 2 * v);
}

// "Is this tap on copy or controls?" — the shared over-UI discipline (src/ui/overUI.js) at its widest:
// text, sections and dialogs all stand the gust down. The canvas and the bare document are open world.
export const overUI = createOverUI(TEXT, SECTIONS, DIALOG);

/**
 * @param coarse       gate.coarse — fine pointers never get here (desktop behaviour is untouched)
 * @param isLive       () => the world has painted a frame (html.world-live)
 * @param isPaused     () => the motion toggle is paused
 * @param getExact     () => conductor exact progress
 * @param hotspotHit   () => a hotspot took this pointerdown (interactions.hovered) — hotspots win
 * @param project      (clientX, clientY) => {x, z} on the ground plane in parallax-local space, or null
 * @param requestRender mark the world dirty
 */
export function createTapRipple({ coarse, isLive, isPaused, getExact, hotspotHit, project, requestRender, now = () => performance.now() }) {
  const down = new Map();
  let rx = 0, rz = 0, t0 = 0, live = false;

  function eligible() {
    return coarse && isLive() && !isPaused() && inPartSpan(getExact());
  }

  function onDown(e) {
    // Registered AFTER createInteractions' own window pointerdown listener (boot.js), so interactions.js has
    // already resolved and activated any hotspot under this tap by the time we read hotspotHit().
    if (down.size) down.forEach((d) => { d.solo = false; });
    down.set(e.pointerId, {
      x: e.clientX, y: e.clientY, t: now(), solo: down.size === 0,
      ok: eligible() && !overUI(e.target) && !hotspotHit(),
    });
  }
  function onUp(e) {
    const d = down.get(e.pointerId);
    down.delete(e.pointerId);
    if (!d || !d.ok || !d.solo || down.size) return;
    if (!eligible()) return;
    const movedPx = Math.hypot(e.clientX - d.x, e.clientY - d.y);
    if (!isTapGesture({ elapsedMs: now() - d.t, movedPx, pointers: 1 })) return;
    const hit = project(e.clientX, e.clientY);
    if (!hit) return;
    rx = hit.x; rz = hit.z; t0 = now(); live = true; // a second tap mid-ripple restarts the envelope at the new point
    requestRender();
  }
  function onCancel(e) { down.delete(e.pointerId); }

  if (coarse) {
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onCancel, { passive: true });
  }
  // A pause mid-ripple ends it: paused means no motion, not a frozen gust.
  document.addEventListener('world:motion', (e) => { if (e.detail && e.detail.paused) live = false; });

  return {
    get active() { return live; },
    // One sample per frame: {x, z, strength} while the gust is alive, a single zeroing sample on the frame it
    // ends, then null forever (the uniform is handed back to the desktop path / to rest).
    sample() {
      if (!live) return null;
      const s = rippleStrength((now() - t0) / 1000);
      if (s <= 0) { live = false; return { x: 0, z: 0, strength: 0 }; }
      return { x: rx, z: rz, strength: s };
    },
  };
}
