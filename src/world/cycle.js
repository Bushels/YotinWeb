// Verbatim port of lib/island/cycle.ts — the 12 s "breath, not strobe" envelope.
export const CYCLE_S = 12;
export const EMBER = 0.18;
export function smooth(a, b, t) {
  if (a >= b) return t >= b ? 1 : 0;
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}
export const RELAY_START = 5;
export const RELAY_END = 9;
export const BREATH = (RELAY_END - RELAY_START) / 3;
export function cycleState(t) {
  if (!Number.isFinite(t)) t = 0;
  t = ((t % CYCLE_S) + CYCLE_S) % CYCLE_S;
  let light;
  if (t < 3) light = 1;
  else if (t < 5) light = 1 - smooth(3, 5, t);
  else if (t < 9) light = 0;
  else if (t < 10.5) light = smooth(9, 10.5, t);
  else light = 1;
  const focus = smooth(3.35, 5, t) * (1 - smooth(9, 10.5, t));
  let collarWellFi = EMBER, pulseCased = -1, receiver = -1;
  if (t >= RELAY_START && t < RELAY_END) {
    const f = ((t - RELAY_START) / BREATH) % 1;
    collarWellFi = Math.max(EMBER, smooth(0, 0.12, f) * (1 - smooth(0.55, 0.85, f)));
    if (f >= 0.08 && f < 0.8) pulseCased = (f - 0.08) / 0.72;
    if (f >= 0.72) receiver = (f - 0.72) / 0.28;
  }
  return { sun: light, sky: 0.25 + 0.75 * light, collarWellFi, pulseCased, receiver, flow: light, focus };
}
export const REDUCED_MOTION_T = 1.5;
