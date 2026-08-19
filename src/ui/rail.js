// Rail: chapter navigation as real anchors from first paint (spec §5). Gate 1 = chapter links with
// aria-current driven by the conductor's exact chapter; the casing tally, formation legend, descent/return
// markers and the pause control land in Task 4.
import { CHAPTERS } from '../chapters.js';

const LABELS = { surface: 'Surface', descent: 'Descent', tool: 'Tool', signal: 'Signal', deployment: 'Deployment', yotin: 'Yôtin', fit: 'Fit' };
const ANCHORS = { surface: '#top', descent: '#wellfi', tool: '#wellfi', signal: '#wellfi', deployment: '#insight', yotin: '#company', fit: '#contact' };

export function mountRail() {
  const rail = document.getElementById('rail');
  if (!rail) return null;
  rail.innerHTML = '';
  const links = CHAPTERS.map((c) => {
    const a = document.createElement('a');
    a.href = c.section.startsWith('#') ? c.section : ANCHORS[c.id];
    a.textContent = LABELS[c.id] || c.id;
    a.dataset.railChapter = c.id;
    rail.appendChild(a);
    return a;
  });
  function setActive(id) {
    links.forEach((a) => (a.dataset.railChapter === id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
  }
  document.addEventListener('world:chapter', (e) => {
    setActive(e.detail.id);
    // Hash sync without a Back-button trap.
    const target = links.find((a) => a.dataset.railChapter === e.detail.id);
    if (target && history.replaceState) history.replaceState(null, '', target.getAttribute('href'));
  });
  setActive('surface');
  return { rail, links, setActive };
}
