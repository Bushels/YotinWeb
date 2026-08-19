// Entry (spec §2). Order matters:
//   1. gate.js runs synchronously and stamps html.world-on / html.stills-on BEFORE any three.js byte is
//      requested and before the legacy site script decides anything (e.g. the pinned drill sequence).
//   2. qualifier-logic.js must be evaluated before the legacy main.js (it reads window.YotinQualifier).
//   3. The world is a dynamic import so the stills path never downloads it; modulepreload hints for the
//      world chunk are injected only after the gate passes.
import './styles/world.css';
import './styles/print.css';
import { gate } from './gate.js';
import '../qualifier-logic.js';
import '../main.js';
import { mountRail } from './ui/rail.js';
import { mountSignal } from './ui/signal.js';
import { mountTool } from './ui/tool.js';
import { mountDeployment } from './ui/deployment.js';
import { mountDescent } from './ui/descent.js';
import { mountProbe } from './ui/probe.js';
import { mountMotionToggle } from './ui/motionToggle.js';
import { mountStills } from './ui/stills.js';
import { mountFit } from './ui/fit.js';

mountRail();
mountSignal();
mountTool();
mountDeployment();
mountDescent();
if (gate.world) mountProbe();
mountMotionToggle(); // always: applies the persisted motion choice before the world (or the stills) paint
if (!gate.world) mountStills();
mountFit(); // always: the Download schematic button needs no world; the world response attaches on world:first-frame

// ChatFi launcher on the world path (§6 colour budget, Mobbin #2): sand until it has earned ember, and out of
// the picture while chapters 2 and 3 are the chapter — the two darkest frames, where the cyan collar is meant to
// own the brightest non-sky pixel and a persistent ember orb 200 px away undercuts it. Gated on the chapter
// INDEX (floor(p + 0.002), §13b), never raw progress. The stills path never hears world:progress, so the
// launcher there is untouched and available at every scroll position.
if (gate.world) {
  const launcher = document.querySelector('.chatfi-launcher');
  if (launcher) {
    let hushed = null, warm = false;
    document.addEventListener('world:progress', (e) => {
      const index = Math.floor(e.detail.exact + 0.002);
      const hush = index === 2 || index === 3;
      if (hush !== hushed) { hushed = hush; launcher.classList.toggle('is-hushed', hush); }
      if (!warm && (index >= 4 || document.documentElement.classList.contains('signal-received'))) {
        warm = true; launcher.classList.add('is-warm');
      }
    });
  }
}

if (gate.world) {
  import('./boot.js').then(({ bootWorld }) => bootWorld()).catch((err) => {
    document.documentElement.classList.remove('world-on');
    document.documentElement.classList.add('stills-on', 'world-failed');
    mountStills(); // asset failure (spec §7): the stills take over
    if (typeof console !== 'undefined') console.warn('world failed to boot', err);
  });
}
