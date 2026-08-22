// "Is this pointer over copy or controls, rather than open world?" — one discipline behind five
// surfaces: the probe ring (probe.js), stake placement (signal.js), the tool orbit drag (tool.js),
// hotspot raycasting (../interactions.js) and the tap ripple (../tapRipple.js). Until round 18 each
// carried its own near-identical closest() list and they had begun to drift; each caller now composes
// the union it needs from the shared base plus the named tiers below, so a new floating surface is
// added in ONE place.
//
// NOT this module: rail.js's SHY_UNDER. The fit chip asks the opposite question — "is something
// readable UNDER me?" — hit-tested with elementsFromPoint + matches(), and tuned separately
// (dt/dd, .commission-step, .spec-grid > div …). Do not merge the two.

// The non-optional definition of "UI": real controls, plus the fixed-layer chrome that floats over
// the world (rail, ChatFi, the pause cluster). Every surface includes this base.
const BASE = 'a, button, input, select, textarea, label, summary, .rail, .fixed-layer, .chatfi-launcher, .chatfi-panel';

// Copy. The probe ring and the tap gust are instruments over the WORLD — over someone's reading they
// are noise. The orbit drag and the hotspot raycast deliberately OMIT this tier: copy columns overlay
// the canvas, and a drag or hover crossing a paragraph is still aimed at the world behind it.
export const TEXT = 'h1, h2, h3, h4, p, li, dl';

// Section containers whose padding reads as "the page", not "the world" — the ring/gust must not
// light in the gutters between a card's children.
export const SECTIONS = '.site-header, .signal-stage, .qualifier, .channel-card, .spec-grid, .faq-item, .company-grid';

// Floating dialogs own their pointer. Today only the ChatFi panel carries role="dialog" (already in
// the base by class); the selector is armour for the next dialog, not a duplicate.
export const DIALOG = '[role="dialog"]';

// Build a target-shaped predicate: overUI(event.target) → boolean, safe on a null target and on
// non-Element targets (window/document have no closest). Extras are selector-list strings — the tiers
// above or a caller-local list (signal.js adds its own .commission-block). The join stays a flat
// ', ' on purpose: closest() treats the list as an OR-set, so composition order can never change a
// match, and the tap-ripple unit test splits on ', ' to probe membership.
export function createOverUI(...extras) {
  const sel = [BASE, ...extras].join(', ');
  return (t) => Boolean(t && t.closest && t.closest(sel));
}
