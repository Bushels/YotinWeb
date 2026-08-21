// Rail (spec §5): chapter navigation as real anchors from first paint, the casing tally by NAME (no metres),
// the formation legend (the visible twins for the strata — hovering/focusing a name lights that stratum in
// the world), and two markers: a sand marker that descends with the installed tool and a cyan indicator that
// returns to surface with the reading (descent ≠ return, at a glance). Hash sync via replaceState so the Back
// button is never a scroll-undo trap.
import '../styles/rail.css';
import { CHAPTERS } from '../chapters.js';
import { STRATA, LOWER } from '../world/layout.js';

const LABELS = { surface: 'Surface', descent: 'Descent', tool: 'Tool', signal: 'Signal', deployment: 'Deployment', yotin: 'Yôtin', fit: 'Fit' };
const ANCHORS = { surface: '#top', descent: '#wellfi', tool: '#wellfi', signal: '#wellfi', deployment: '#insight', yotin: '#company', fit: '#contact' };

// Casing tally by name — lit as the descent passes each mark (exact progress thresholds within chapter 1).
// Round 12: the tally reads ALONG-HOLE, the way a wellbore diagram is read — the build crosses the pay top
// (u ≈ 0.43) while still cased, passes the WellFi collar (u ≈ 0.72), and lands the shoe just into the pay
// (u = 1.0). TVD order would differ (the pay top is shallower than the shoe); along-hole is the honest
// sequence for a descent that follows the string.
const TALLY = [
  { id: 'surface-casing', label: 'Surface casing', at: 0.12 },
  { id: 'pay-top', label: 'Pay top', at: 0.43 },
  { id: 'wellfi', label: 'WellFi · in casing', at: 0.72 }, // same 18 chars as the old 'WellFi · open hole': it fits the rail gutter without truncating, and it is what the qualifier's readback already says ("inside casing, on the tubing")
  { id: 'intermediate-shoe', label: 'Intermediate shoe', at: 1.0 },
];

export function mountRail() {
  const rail = document.getElementById('rail');
  if (!rail) return null;
  while (rail.firstChild) rail.removeChild(rail.firstChild);

  // Chapters
  const nav = document.createElement('div');
  nav.className = 'rail-chapters';
  nav.id = 'rail-chapters';
  const links = CHAPTERS.map((c) => {
    const a = document.createElement('a');
    a.href = c.section.startsWith('#') ? c.section : ANCHORS[c.id];
    a.textContent = LABELS[c.id] || c.id;
    a.dataset.railChapter = c.id;
    nav.appendChild(a);
    return a;
  });
  rail.appendChild(nav);

  // Tally + markers
  const tally = document.createElement('div');
  tally.className = 'rail-tally';
  tally.setAttribute('aria-label', 'Casing tally — representative Clearwater well, schematic, not to scale');
  const track = document.createElement('div');
  track.className = 'rail-track';
  const down = document.createElement('span'); down.className = 'rail-marker rail-marker-down'; down.title = 'Installed tool (descent)';
  const up = document.createElement('span'); up.className = 'rail-marker rail-marker-up'; up.title = 'Reading (return)';
  track.append(down, up);
  const list = document.createElement('ol');
  list.className = 'rail-list';
  const tallyItems = TALLY.map((t) => { const li = document.createElement('li'); li.dataset.tally = t.id; li.textContent = t.label; list.appendChild(li); return li; });
  const caption = document.createElement('p');
  caption.className = 'rail-caption';
  caption.textContent = 'Representative Clearwater well, Western Canada — schematic, not to scale.';
  tally.append(track, list, caption);
  rail.appendChild(tally);

  // Formation legend — the visible twins for the strata.
  const legend = document.createElement('div');
  legend.className = 'rail-legend';
  legend.setAttribute('aria-label', 'Formations');
  const legendItems = [...STRATA, LOWER].filter((s) => s.name !== 'topsoil').map((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rail-legend-item';
    b.dataset.stratum = s.name;
    b.textContent = s.label;
    b.addEventListener('mouseenter', () => focusStratum(s.name));
    b.addEventListener('focus', () => focusStratum(s.name));
    b.addEventListener('mouseleave', () => focusStratum(null));
    b.addEventListener('blur', () => focusStratum(null));
    b.addEventListener('click', () => { focusStratum(s.name, true); });
    legend.appendChild(b);
    return b;
  });
  rail.appendChild(legend);

  function focusStratum(name, sticky = false) {
    document.dispatchEvent(new CustomEvent('world:focus-stratum', { detail: { name, sticky } }));
    legendItems.forEach((b) => b.classList.toggle('is-active', b.dataset.stratum === name));
  }

  function setActive(id) {
    links.forEach((a) => (a.dataset.railChapter === id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    rail.dataset.chapter = id;
  }
  document.addEventListener('world:chapter', (e) => {
    setActive(e.detail.id);
    const target = links.find((a) => a.dataset.railChapter === e.detail.id);
    if (target && history.replaceState) history.replaceState(null, '', target.getAttribute('href'));
  });
  // Progress-driven tally + markers (exact progress from the conductor; the world emits world:progress).
  document.addEventListener('world:progress', (e) => {
    const p = e.detail.exact;
    const descent = Math.min(1, Math.max(0, p - 1));            // 0..1 across chapter 1
    const returned = Math.min(1, Math.max(0, (p - 3) / 1.0));  // 0..1 across chapter 3 (the reading returns)
    tallyItems.forEach((li, i) => li.classList.toggle('is-lit', p >= 1 && descent >= TALLY[i].at));
    // cyan on the rail only while the signal chapter is the chapter (one-candle rule, spec §6 — round 2); gated on
    // the chapter INDEX (same epsilon as the conductor) so a 3.9998 landing is already chapter 4 (round 3)
    const index = Math.floor(p + 0.002);
    const inSignal = index === 3;
    tally.classList.toggle('is-signal', inSignal);
    // marker positions along the track: 0 = top (surface), 1 = bottom (total depth — the pay)
    const downPos = p < 1 ? 0 : Math.min(1, descent);
    const upPos = p < 3 ? 1 : 1 - returned;
    down.style.setProperty('--pos', downPos.toFixed(3));
    up.style.setProperty('--pos', upPos.toFixed(3));
    up.classList.toggle('is-on', inSignal);
    // tally/legend live through the underground chapters; gate on the chapter INDEX so a 4.9999 landing cannot
    // leave them on the paper
    tally.classList.toggle('is-visible', p >= 0.6 && index < 5);
    legend.classList.toggle('is-visible', p >= 0.6 && index < 5);
    if (current) current.textContent = LABELS[CHAPTERS[Math.min(CHAPTERS.length - 1, index)].id] || '';
  });
  // Phone / tablet (≤ 1100 px): the rail collapses to a 36 px bar under the header — current chapter + the lit
  // tally item; tap opens the formation legend as a sheet (one transient at a time; closes on scroll) — spec §4.
  const bar = document.createElement('button');
  bar.type = 'button';
  bar.className = 'rail-bar';
  bar.setAttribute('aria-expanded', 'false');
  bar.setAttribute('aria-controls', 'rail-chapters rail-legend'); // the sheet is contents: seven chapters, then the strata
  const current = document.createElement('span'); current.className = 'rail-bar-current'; current.textContent = LABELS.surface;
  const barTally = document.createElement('span'); barTally.className = 'rail-bar-tally'; barTally.setAttribute('aria-hidden', 'true');
  const barHint = document.createElement('span'); barHint.className = 'rail-bar-hint'; barHint.textContent = 'Contents';
  bar.append(current, barTally, barHint);
  legend.id = 'rail-legend';
  rail.insertBefore(bar, rail.firstChild);
  const setOpen = (open) => { rail.classList.toggle('is-open', open); bar.setAttribute('aria-expanded', String(open)); };
  bar.addEventListener('click', () => setOpen(!rail.classList.contains('is-open')));
  window.addEventListener('scroll', () => { if (rail.classList.contains('is-open')) setOpen(false); }, { passive: true });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && rail.classList.contains('is-open')) setOpen(false); });
  // Position on the phone: a 2 px rule on the bar's bottom edge, driven by the same exact progress the desktop
  // tally track uses, and cyan on its leading edge while the return marker is on (round 9). The stills path
  // never emits world:progress, so it falls back to the chapter index — chapter-granular, but still position.
  let hasProgress = false;
  const setBarProgress = (p) => bar.style.setProperty('--rail-p', p.toFixed(3));
  document.addEventListener('world:progress', (e) => {
    hasProgress = true;
    setBarProgress(e.detail.exact);
    bar.classList.toggle('is-signal', up.classList.contains('is-on'));
    const lit = tallyItems.filter((li) => li.classList.contains('is-lit')).pop();
    const text = lit ? lit.textContent : '';
    if (barTally.textContent !== text) barTally.textContent = text;
  });
  document.addEventListener('world:chapter', (e) => { if (!hasProgress) setBarProgress(e.detail.index); });

  // Phones (≤ 820 px): the one-tap conversion path. The header's "Check your well fit" only exists at
  // ≥ 1101 px, and round 11 took the hero CTA pair out — so on the device a production engineer actually
  // carries, §6's "one click to Q1" was two taps and a hunt through the burger (round-13 critique). One chip,
  // 44 px, ember outline, appearing after the first scroll and standing down while the qualifier is on screen
  // (a CTA pointing at something already in front of you is noise). Not the hero pair, and not a new surface
  // on desktop.
  const fit = document.createElement('a');
  fit.className = 'rail-fit';
  fit.href = '#contact';
  fit.textContent = 'Check your well fit';
  rail.appendChild(fit);
  // Round 17: a plain hash jump lands on #contact's own top, which on a phone is 205 px SHORT of the arrival the
  // conductor authors for the last chapter (conductor.js:26-29 — docTop([data-anchor-focus]) − headerH, the
  // arrival CONTENTS uses). Measured on a 440-wide phone: the hash jump rests at 9355 with Q1 on the fold and none of
  // its four options visible; the authored anchor rests at 9560 with Q1 and two options above the fold.
  // scroll-margin cannot push an arrival DOWN, so the activation is intercepted — the href stays for no-JS and
  // for the keyboard/AT semantics of a real link, and reduced motion jumps instead of gliding.
  const headerH = () => { const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')); return Number.isFinite(v) ? v : 72; };
  const authoredContactY = () => {
    const focus = document.querySelector('#contact [data-anchor-focus]');
    if (!focus || window.innerWidth >= 1100) return null;
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return Math.min(max, focus.getBoundingClientRect().top + (window.scrollY || 0) - headerH());
  };
  fit.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    const y = authoredContactY();
    if (y == null) return;
    e.preventDefault();
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', '#contact');
  });
  let fitOn = null, atQualifier = false, fitShy = null;
  // Round 14: at 390 the chip is a fixed overlay and the chapters scroll under it — in chapters 3, 4 and 5 it
  // came to rest on live copy and on the interactive cards (commissioning step 03's body, the CH-03 card, the
  // deployment controls). Its own ground cannot help: the copy is UNDER it, so it is hidden either way. So the
  // chip stands down while something readable is beneath it and comes back the moment it clears — the same
  // "a label over the wrong thing hides rather than clamps" rule the world captions use. Five hit tests per
  // scroll frame, no rect sweep over the document.
  // Round 17: the union was missing the badge/portal/spec containers, so the chip came to rest ON the
  // signal strip's "03" step and on the spec grid's first tile. Containers, not their text children —
  // elementsFromPoint returns ancestors, so a container entry covers its icon rows and padding bands too.
  const SHY_UNDER = 'p, li, h1, h2, h3, h4, button, a, input, label, summary, dt, dd, .channel-card, .commission-step, .deploy-controls, .device-banner, .signal-step, .portal-note, .tool-inspect, .spec-grid > div';
  const fitOccluded = () => {
    if (!fit.isConnected || getComputedStyle(fit).display === 'none') return false;
    const r = fit.getBoundingClientRect();
    if (!r.width) return false;
    const pts = [[r.left + 4, r.top + 4], [r.right - 4, r.top + 4], [r.left + 4, r.bottom - 4], [r.right - 4, r.bottom - 4], [(r.left + r.right) / 2, (r.top + r.bottom) / 2]];
    return pts.some(([x, y]) => (document.elementsFromPoint ? document.elementsFromPoint(x, y) : [])
      .some((el) => el !== fit && !fit.contains(el) && !el.closest('.rail') && el.matches && el.matches(SHY_UNDER)));
  };
  const syncFit = () => {
    const on = (window.scrollY || 0) > 44 && !atQualifier;
    if (on !== fitOn) {
      fitOn = on;
      rail.classList.toggle('has-fit', on);
      fit.tabIndex = on ? 0 : -1;
    }
    const shy = on && fitOccluded();
    if (shy !== fitShy) {
      fitShy = shy;
      fit.classList.toggle('is-shy', shy);
      fit.tabIndex = on && !shy ? 0 : -1;
    }
  };
  let fitTicking = false;
  // Round 17: the per-rAF test alone is STALE by the time the page comes to rest — entrances land and the
  // damped camera settles AFTER the last scroll frame, so a chip that cleared its ground mid-scroll could
  // come to rest on live copy and never re-test. Two additions: a debounced re-check ~250 ms after the last
  // scroll event, and the same sync from world:progress so a settling camera or an entrance re-tests it.
  let fitSettle = 0;
  const armFitRecheck = () => { clearTimeout(fitSettle); fitSettle = setTimeout(syncFit, 250); };
  window.addEventListener('scroll', () => {
    armFitRecheck();
    if (fitTicking) return;
    fitTicking = true;
    requestAnimationFrame(() => { fitTicking = false; syncFit(); });
  }, { passive: true });
  document.addEventListener('world:progress', armFitRecheck);
  const contact = document.querySelector('#contact');
  if (contact && typeof IntersectionObserver === 'function') {
    new IntersectionObserver((entries) => {
      atQualifier = entries.some((e) => e.isIntersecting);
      syncFit();
    }, { rootMargin: '0px 0px -15% 0px' }).observe(contact);
  }
  syncFit();

  setActive('surface');
  return { rail, links, setActive, focusStratum };
}
