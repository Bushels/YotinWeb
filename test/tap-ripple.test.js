/**
 * Tap ripple (spec §5 "Tap ripple", §12 "The world answers the thumb" — Kyle, round 18).
 *
 * Two pure pieces are worth locking: the classifier (a tap must never eat a scroll gesture, a long press, or a
 * pinch) and the envelope (§13b: time-based, peaks fast, and is GONE — exactly zero, not asymptotically small —
 * well inside the two seconds the spec promises).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { isTapGesture, rippleStrength, inPartSpan, overUI, TAP_MAX_MS, TAP_MAX_PX, ATTACK_S, DECAY_S } from '../src/tapRipple.js';

test('the classifier takes a tap and refuses everything a thumb else does', () => {
  assert.ok(isTapGesture({ elapsedMs: 90, movedPx: 3, pointers: 1 }), 'a quick still one-finger tap ripples');
  assert.ok(isTapGesture({ elapsedMs: TAP_MAX_MS, movedPx: TAP_MAX_PX, pointers: 1 }), 'the boundary is inclusive');
  assert.ok(!isTapGesture({ elapsedMs: 120, movedPx: 40, pointers: 1 }), 'a scroll drag is not a tap');
  assert.ok(!isTapGesture({ elapsedMs: 900, movedPx: 2, pointers: 1 }), 'a long press is not a tap');
  assert.ok(!isTapGesture({ elapsedMs: 90, movedPx: 3, pointers: 2 }), 'a pinch never ripples');
  assert.ok(!isTapGesture({ elapsedMs: 90, movedPx: 3, pointers: 0 }), 'no finger, no ripple');
});

test('the envelope rises fast, decays smoothly, and reaches a hard zero under two seconds', () => {
  assert.equal(rippleStrength(0), 0);
  assert.ok(rippleStrength(ATTACK_S * 0.5) > 0.4, 'half the attack is already half up');
  assert.ok(rippleStrength(ATTACK_S) > 0.99, 'peak is reached by the end of the attack');
  assert.ok(ATTACK_S <= 0.15, 'time-to-peak stays inside the ~150 ms the brief asks for');
  // monotone decay after the peak
  let prev = rippleStrength(ATTACK_S);
  for (let t = ATTACK_S + 0.05; t < ATTACK_S + DECAY_S; t += 0.05) {
    const s = rippleStrength(t);
    assert.ok(s <= prev, `the gust must not re-swell at t=${t.toFixed(2)}`);
    prev = s;
  }
  assert.equal(rippleStrength(ATTACK_S + DECAY_S), 0, 'exactly zero at the end — not a long tail');
  assert.equal(rippleStrength(5), 0, 'and it stays zero: the ripple is a response, never ambient');
  assert.ok(ATTACK_S + DECAY_S <= 2, 'the whole gust is inside the ≤ 2 s the spec promises');
  assert.equal(rippleStrength(-1), 0, 'and it never runs backwards');
});

test('the ripple uses the desktop pointer-part chapter gate, unchanged', () => {
  // The same spans boot.js parts the spruce on for a fine pointer: the hero and the About rise.
  for (const p of [0, 0.3, 0.69, 4.8, 5.5, 5.79]) assert.ok(inPartSpan(p), `p=${p} is a part span`);
  for (const p of [0.7, 1.5, 2.5, 3.9, 4.7, 5.8, 6.2]) assert.ok(!inPartSpan(p), `p=${p} is not a part span`);
});

test('copy and controls are never open world', () => {
  const el = (sel) => ({ closest: (q) => (q.split(', ').includes(sel) ? {} : null) });
  for (const sel of ['button', 'a', 'h1', 'p', '.rail', '.channel-card', '.chatfi-launcher', '.faq-item']) {
    assert.ok(overUI(el(sel)), `${sel} is copy/controls, not open world`);
  }
  assert.ok(!overUI(el('canvas')), 'the canvas is open world');
  assert.ok(!overUI(null), 'a targetless event is not UI');
});
