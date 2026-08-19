// Native-scroll conductor: exact (for UI/interactions/hash/analytics) vs smooth (damped, for camera/visuals).
// Adapted from MengTo/Skills build-threejs-scroll-worlds/references/scroll-conductor.js (no three dependency).
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const damp = (cur, target, lambda, dt) => cur + (target - cur) * (1 - Math.exp(-lambda * dt));

export function createScrollConductor({ sections, damping = 5.2, reducedMotion = false, onUpdate = () => {}, onChapterChange = () => {} }) {
  const els = Array.from(sections);
  if (!els.length) throw new Error('conductor: no sections');
  let anchors = [], exact = 0, smooth = 0, direction = 0, prevY = 0, active = -1;
  let running = false, frame = 0, lastTime = 0, dirty = true, widthAtMeasure = 0, ro = null;
  let reduce = reducedMotion;

  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);

  const headerH = () => { const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')); return Number.isFinite(v) ? v : 72; };
  function measure() {
    const max = maxScroll();
    widthAtMeasure = innerWidth;
    const docTop = (el) => el.getBoundingClientRect().top + (scrollY || 0); // document space, not offsetParent space
    anchors = els.map((el, i) => {
      if (i === 0) return 0;
      if (i === els.length - 1) {
        // phones/tablets: the last chapter arrives on its focus element (the qualifier band + Q1), not the section
        // top — the H2/lede stack above it would otherwise fill the first screen (round 3)
        const focus = el.querySelector('[data-anchor-focus]');
        if (focus && innerWidth < 1100) return Math.min(max, docTop(focus) - headerH());
        return Math.min(max, docTop(el) - innerHeight * 0.15);
      }
      // data-anchor="top": the chapter arrives when the section's top reaches the header (the yôtin chapter: its
      // sticky rise band must be fully on screen at arrival, not already scrolled under the paper — round 2)
      if (el.dataset && el.dataset.anchor === 'top') return clamp(docTop(el) - headerH(), 0, max);
      if (el.dataset && el.dataset.anchor === 'top-mobile' && innerWidth <= 820) return clamp(docTop(el) - headerH() - 36, 0, max); // phones: arrive at the top of the chapter's world band (under header + bar)
      const v = docTop(el) + el.offsetHeight * 0.5 - innerHeight * 0.5;
      return clamp(v, 0, max);
    });
    for (let i = 1; i < anchors.length; i++) anchors[i] = Math.max(anchors[i], anchors[i - 1] + 1);
    dirty = true;
    return anchors.slice();
  }

  function progressAt(y) {
    if (!anchors.length) measure();
    y = clamp(y, 0, maxScroll());
    if (y <= anchors[0]) return 0;
    for (let i = 0; i < anchors.length - 1; i++) {
      if (y <= anchors[i + 1]) {
        const span = Math.max(1, anchors[i + 1] - anchors[i]);
        return i + clamp((y - anchors[i]) / span, 0, 1);
      }
    }
    return anchors.length - 1;
  }

  function segment(p) {
    const last = els.length - 1;
    const index = clamp(Math.floor(p + 0.002), 0, last); // tolerance: a scrollTo that lands 0.02 px shy of an anchor still counts
    const next = Math.min(last, index + 1);
    return { index, next, local: next === index ? 0 : clamp(p - index, 0, 1) };
  }

  function state() {
    const e = segment(exact), s = segment(smooth);
    return { exact, smooth, index: e.index, next: e.next, localExact: e.local, smoothIndex: s.index, smoothNext: s.next, localSmooth: s.local, direction, anchors };
  }

  function readScroll() {
    const y = scrollY || 0;
    const delta = y - prevY;
    if (Math.abs(delta) > 0.25) direction = delta > 0 ? 1 : -1;
    prevY = y;
    exact = progressAt(y);
    dirty = true;
  }

  function tick(now) {
    if (!running) return;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 1 / 30) : 1 / 60;
    lastTime = now;
    const prevSmooth = smooth;
    smooth = reduce ? exact : damp(smooth, exact, damping, dt);
    if (Math.abs(smooth - exact) < 0.0001) smooth = exact;
    const st = state();
    if (st.index !== active) { active = st.index; onChapterChange(active, st); }
    if (dirty || smooth !== prevSmooth) { dirty = false; onUpdate(st, dt); }
    frame = requestAnimationFrame(tick);
  }

  const onScroll = () => readScroll();
  function onResize() {
    const widthChanged = innerWidth !== widthAtMeasure;
    const coarse = matchMedia && matchMedia('(pointer: coarse)').matches;
    if (coarse && !widthChanged) return;
    measure(); readScroll();
  }
  function onVisibility() {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; return; }
    if (running && !frame) frame = requestAnimationFrame(tick);
    readScroll();
  }

  function start() {
    if (running) return api;
    running = true;
    measure(); prevY = scrollY || 0; exact = progressAt(prevY); smooth = exact;
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onResize, { passive: true });
    addEventListener('orientationchange', onResize, { passive: true });
    addEventListener('pageshow', onResize);
    addEventListener('hashchange', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => { measure(); readScroll(); });
      els.forEach((el) => ro.observe(el));
      ro.observe(document.body); // any in-flow height change (a caption collapsing, a font swap) re-measures the anchors (round 3)
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); readScroll(); });
    }
    active = -1; lastTime = 0;
    frame = requestAnimationFrame(tick);
    return api;
  }
  function stop() {
    if (!running) return;
    running = false; cancelAnimationFrame(frame); frame = 0;
    removeEventListener('scroll', onScroll); removeEventListener('resize', onResize);
    removeEventListener('orientationchange', onResize); removeEventListener('pageshow', onResize); removeEventListener('hashchange', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
    if (ro) ro.disconnect(); ro = null;
  }
  // Hard-cut arrival: set exact and smooth together (anchor/deep-link), no fly-through.
  function jumpTo(index) { readScroll(); smooth = exact; dirty = true; }
  function setReducedMotion(v) { reduce = Boolean(v); if (reduce) smooth = exact; dirty = true; }

  const api = { start, stop, destroy: stop, measure, read: readScroll, getState: state, progressAt, jumpTo, setReducedMotion, get anchors() { return anchors; } };
  return api;
}
