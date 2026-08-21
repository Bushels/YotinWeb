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
      pick();
    }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });
    anchors.forEach((el) => io.observe(el));
    // Between anchors (or after a deep-link / instant jump that lands no anchor in the centre band) choose the
    // chapter whose anchor is NEAREST the viewport centre — never hold "surface" on a page that is two-thirds
    // scrolled (round 2: the reduced-motion frames showed the hero still at 33 % and 66 %). The last chapter
    // anchors at its top (the conductor's rule) so the FAQ still holds chapter 4 until #contact arrives.
    // Mirror the conductor's anchor rule exactly (src/conductor.js measure): a chapter arrives when its anchor
    // scroll position is reached — section centre at viewport centre; data-anchor="top" sections at their top under
    // the header; the last chapter at top − 15 vh (or on its [data-anchor-focus] on phones). Current = the last
    // anchor reached. (Nearest-centre picked chapter 5 while the FAQ was still on screen — round 4.)
    const headerH = () => { const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')); return Number.isFinite(v) ? v : 72; };
    function anchorY(el, i) {
      const r = el.getBoundingClientRect(); const top = r.top + window.scrollY; const h = window.innerHeight;
      if (i === 0) return 0;
      if (i === anchors.length - 1) { const f = el.querySelector('[data-anchor-focus]'); if (f && window.innerWidth < 1100) return f.getBoundingClientRect().top + window.scrollY - headerH(); return top - h * 0.15; }
      if (el.dataset && el.dataset.anchor === 'top') return top - headerH();
      if (el.dataset && el.dataset.anchor === 'top-mobile' && window.innerWidth <= 820) return top - headerH() - 36;
      // The conductor's centre-at-centre rule is right for a CONTINUOUS camera — between two anchors it is
      // mid-transition, so the picture is never a chapter behind. A crossfade between seven discrete stills is
      // not: holding the previous still until the section's centre reaches the viewport centre meant the
      // chapter-3 commissioning copy was read with the chapter-2 tool close-up behind it for most of its scroll
      // (round 14). The still now swaps as the chapter's heading settles into the upper third — never LATER
      // than the conductor's anchor, so the two paths cannot disagree about which chapter has arrived.
      return Math.min(top + r.height * 0.5 - h * 0.5, top - h * 0.35);
    }
    function pick() {
      // 12 px of arrival tolerance: a `data-anchor="top"` chapter (commissioning, chapter 4, chapter 5) arrives
      // at `top − header`, and landing a handful of pixels short of that — which anything that adds its own
      // breathing room above the heading does — left the picture on the PREVIOUS chapter while the whole
      // heading and its first card were on screen (round 14).
      const y = window.scrollY + 12;
      let best = 0;
      anchors.forEach((el, i) => { if (anchorY(el, i) <= y) best = i; });
      show(best);
    }
    let ticking = false;
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; pick(); }); } }, { passive: true });
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
