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
const TALLY = [
  { id: 'surface-casing', label: 'Surface casing', at: 0.12 },
  { id: 'intermediate-shoe', label: 'Intermediate shoe', at: 0.62 },
  { id: 'pay-top', label: 'Pay top', at: 0.8 },
  { id: 'wellfi', label: 'WellFi · open hole', at: 0.98 },
];

export function mountRail() {
  const rail = document.getElementById('rail');
  if (!rail) return null;
  while (rail.firstChild) rail.removeChild(rail.firstChild);

  // Chapters
  const nav = document.createElement('div');
  nav.className = 'rail-chapters';
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
    // marker positions along the track: 0 = top (surface), 1 = bottom (tool)
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
  bar.setAttribute('aria-controls', 'rail-legend');
  const current = document.createElement('span'); current.className = 'rail-bar-current'; current.textContent = LABELS.surface;
  const barTally = document.createElement('span'); barTally.className = 'rail-bar-tally'; barTally.setAttribute('aria-hidden', 'true');
  const barHint = document.createElement('span'); barHint.className = 'rail-bar-hint'; barHint.textContent = 'Formations';
  bar.append(current, barTally, barHint);
  legend.id = 'rail-legend';
  rail.insertBefore(bar, rail.firstChild);
  const setOpen = (open) => { rail.classList.toggle('is-open', open); bar.setAttribute('aria-expanded', String(open)); };
  bar.addEventListener('click', () => setOpen(!rail.classList.contains('is-open')));
  window.addEventListener('scroll', () => { if (rail.classList.contains('is-open')) setOpen(false); }, { passive: true });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && rail.classList.contains('is-open')) setOpen(false); });
  document.addEventListener('world:progress', () => {
    const lit = tallyItems.filter((li) => li.classList.contains('is-lit')).pop();
    const text = lit ? lit.textContent : '';
    if (barTally.textContent !== text) barTally.textContent = text;
  });
  setActive('surface');
  return { rail, links, setActive, focusStratum };
}
