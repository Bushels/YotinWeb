// Stills path (spec §7): reduced motion / Save-Data / tier 0 / no WebGL2. Seven pre-rendered stills — one per
// chapter — in a fixed full-viewport layer behind the DOM, crossfaded to the chapter whose anchor is nearest the
// viewport centre (IntersectionObserver over the same anchors the conductor uses). Zero three.js: this module
// never imports 'three' or boot.js statically; the single "Show the 3D world" opt-in dynamically imports boot.js.
import { CHAPTERS, chapterElements } from '../chapters.js';
import { gate } from '../gate.js';
import { setMotionPaused } from './motionToggle.js';
import '../styles/stills.css';

export const STILL_SRC = CHAPTERS.map((c, i) => `/assets/stills/ch${i}.webp`);
const OPTIN_KEY = 'yotin-world-optin';
const OPTIN_LABEL = 'Show the 3D world';

function reduceMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
}
function track(name, params) {
  try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (e) { /* never breaks the page */ }
}

export function mountStills() {
  const host = document.querySelector('[data-stills]');
  if (!host) return null;
  const html = document.documentElement;
  const anchors = chapterElements();

  // ch0 eager (it is the chapter-0 poster); ch1–6 get their src on first need (neighbour prefetch keeps the
  // crossfade seamless without paying for all six up front — reduced-motion budget §6).
  const imgs = CHAPTERS.map((c, i) => {
    const img = document.createElement('img');
    img.className = 'stills-img';
    img.alt = '';
    img.decoding = 'async';
    img.dataset.stillChapter = c.id; // NOT data-chapter: that attribute is the conductor's anchor selector (chapters.js)
    if (i === 0) { img.setAttribute('fetchpriority', 'high'); img.src = STILL_SRC[0]; }
    else img.dataset.src = STILL_SRC[i];
    host.appendChild(img);
    return img;
  });

  let current = -1;
  function ensure(i) {
    const img = imgs[i];
    if (img && !img.getAttribute('src') && img.dataset.src) img.src = img.dataset.src;
    return img;
  }
  function show(i) {
    if (i < 0 || i >= imgs.length || i === current) return;
    current = i;
    const img = ensure(i);
    ensure(i + 1);
    const go = () => {
      if (current !== i) return; // moved on while this one was loading
      imgs.forEach((im, j) => im.classList.toggle('is-current', j === i));
      html.dataset.still = CHAPTERS[i].id;
      // the rail tracks chapters through the same event the conductor dispatches on the world path
      html.dataset.chapter = CHAPTERS[i].id;
      document.dispatchEvent(new CustomEvent('world:chapter', { detail: { index: i, id: CHAPTERS[i].id } }));
    };
    if (img.complete && img.naturalWidth > 0) go();
    else {
      img.addEventListener('load', go, { once: true });
      img.addEventListener('error', go, { once: true }); // still switch: the void ground + scrims keep copy readable
    }
  }
  show(0);

  let io = null;
  if ('IntersectionObserver' in window) {
    const inView = new Set();
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const i = anchors.indexOf(e.target);
        if (i < 0) return;
        if (e.isIntersecting) inView.add(i); else inView.delete(i);
      });
      if (!inView.size) return; // between anchors: hold the current still (chapter 4 holds through the FAQ)
      const mid = window.innerHeight / 2;
      let best = -1, bestD = Infinity;
      inView.forEach((i) => {
        const r = anchors[i].getBoundingClientRect();
        const d = r.top > mid ? r.top - mid : r.bottom < mid ? mid - r.bottom : 0;
        if (d < bestD || (d === bestD && i > best)) { bestD = d; best = i; }
      });
      if (best >= 0) show(best);
    }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });
    anchors.forEach((el) => io.observe(el));
  }

  // "Show the 3D world": once, near the chapter-0 still, only when WebGL2 + minimum tier pass.
  let optin = null;
  if (gate.webgl2 && gate.tier >= 1 && !html.classList.contains('world-on')) optin = mountOptIn();

  function mountOptIn() {
    // Bottom-right corner of the hero grid (mirrors the scroll cue): near the still, after the CTAs in tab order.
    const parent = document.querySelector('.hero-grid') || document.querySelector('.hero-copy') || document.querySelector('.hero');
    if (!parent) return null;
    const wrap = document.createElement('p');
    wrap.className = 'stills-optin';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'stills-optin-button';
    btn.dataset.worldOptin = '';
    const label = document.createElement('span');
    label.textContent = OPTIN_LABEL;
    btn.appendChild(label);
    wrap.appendChild(btn);
    parent.appendChild(wrap);

    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.classList.add('is-loading');
      label.textContent = 'Loading the world…';
      try { window.sessionStorage.setItem(OPTIN_KEY, '1'); } catch (e) { /* fine */ }
      track('world_optin', {});
      const reduce = reduceMotion();
      import('../boot.js').then(({ bootWorld }) => {
        // The stills layer stays visible under html.world-optin until the world's first frame (stills.css).
        html.classList.remove('stills-on');
        html.classList.add('world-on', 'world-optin');
        const api = bootWorld();
        if (!api) throw new Error('world: no canvas');
        // Exact current pose, ambient motion paused (spec §7); the motion control resumes it.
        if (reduce) api.conductor.setReducedMotion(true);
        if (reduce || html.classList.contains('motion-paused')) setMotionPaused(true, { persist: false });
        wrap.remove();
      }).catch((err) => {
        html.classList.remove('world-on', 'world-optin');
        html.classList.add('stills-on', 'world-failed');
        btn.disabled = false;
        btn.classList.remove('is-loading');
        label.textContent = OPTIN_LABEL;
        if (typeof console !== 'undefined') console.warn('world opt-in failed', err);
      });
    });
    return btn;
  }

  // The observer stays alive after an opt-in: if the WebGL context is lost (html.world-lost) the stills return
  // at the current chapter.

  return { host, imgs, show, optin, get current() { return current; } };
}
