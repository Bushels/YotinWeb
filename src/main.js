// Entry (spec §2). Order matters:
//   1. gate.js runs synchronously and stamps html.world-on / html.stills-on BEFORE any three.js byte is
//      requested and before the legacy site script decides anything (e.g. the pinned drill sequence).
//   2. qualifier-logic.js must be evaluated before the legacy main.js (it reads window.YotinQualifier).
//   3. The world is a dynamic import so the stills path never downloads it; modulepreload hints for the
//      world chunk are injected only after the gate passes.
import './styles/world.css';
import { gate } from './gate.js';
import '../qualifier-logic.js';
import '../main.js';
import { mountRail } from './ui/rail.js';
import { mountSignal } from './ui/signal.js';
import { mountMotionToggle } from './ui/motionToggle.js';
import { mountStills } from './ui/stills.js';

mountRail();
mountSignal();
mountMotionToggle(); // always: applies the persisted motion choice before the world (or the stills) paint
if (!gate.world) mountStills();

if (gate.world) {
  import('./boot.js').then(({ bootWorld }) => bootWorld()).catch((err) => {
    document.documentElement.classList.remove('world-on');
    document.documentElement.classList.add('stills-on', 'world-failed');
    mountStills(); // asset failure (spec §7): the stills take over
    if (typeof console !== 'undefined') console.warn('world failed to boot', err);
  });
}
