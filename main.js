/* Yotin Energy — progressive interaction layer. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* ======================================================================
     Header and navigation
     ====================================================================== */

  var header = document.querySelector("[data-header]");
  var navToggle = document.querySelector("[data-nav-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");

  var lastDirY = 0;
  function updateHeader() {
    if (!header) return;
    var y = window.scrollY;
    if (y > 44) header.setAttribute("data-scrolled", "");
    else header.removeAttribute("data-scrolled");
    // scroll direction (ignore jitter < 8 px; always "up" near the top): on phones the ChatFi launcher yields
    // while the visitor reads downward and returns when they pause or scroll back (round 3).
    if (Math.abs(y - lastDirY) > 8) {
      root.setAttribute("data-scroll-dir", y > lastDirY && y > 120 ? "down" : "up");
      lastDirY = y;
    }
  }

  function closeNav(returnFocus) {
    if (!navToggle || !mobileNav) return;
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    mobileNav.hidden = true;
    if (returnFocus) navToggle.focus();
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = navToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) closeNav(false);
      else {
        navToggle.setAttribute("aria-expanded", "true");
        navToggle.setAttribute("aria-label", "Close menu");
        mobileNav.hidden = false;
      }
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { closeNav(false); });
    });
  }

  /* Section-aware navigation */
  var sectionLinks = Array.prototype.slice.call(document.querySelectorAll(".desktop-nav a[href^='#']"));
  var sections = sectionLinks.map(function (link) {
    return document.querySelector(link.getAttribute("href"));
  }).filter(Boolean);

  // With the world on, the conductor is the single source of truth for "where am I": the header follows the
  // chapter event (round 4: the band-based observer lagged a section at one viewport and not another). The
  // observer stays as the no-world fallback.
  var chapterNav = { surface: null, descent: "#wellfi", tool: "#wellfi", signal: "#wellfi", deployment: "#benefits", yotin: "#company", fit: "#contact" };
  var conductorDrivesNav = false;
  document.addEventListener("world:chapter", function (e) {
    var id = e && e.detail && e.detail.id;
    if (!(id in chapterNav)) return;
    conductorDrivesNav = true;
    var href = chapterNav[id];
    sectionLinks.forEach(function (link) { link.classList.toggle("is-active", Boolean(href) && link.getAttribute("href") === href); });
  });
  if (sections.length && "IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      if (conductorDrivesNav) return;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach(function (link) {
          link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-40% 0px -52% 0px" });
    sections.forEach(function (section) { sectionObserver.observe(section); });
  }

  /* ======================================================================
     Motion layer

     Reveals are handled natively by `animation-timeline: view()` wherever it
     exists — no library, no main-thread scroll work, and progress is bound to
     scroll position instead of firing once and finishing off-screen.

     GSAP is therefore only fetched for the two jobs CSS can't do here: the
     scrubbed drill sequence, and the reveal fallback on browsers without
     native scroll-driven animation. On a phone, neither applies, so GSAP is
     never downloaded at all.
     ====================================================================== */

  var NATIVE_SCROLL = !!(window.CSS && window.CSS.supports &&
    window.CSS.supports("animation-timeline", "view()"));

  var GSAP_SRC = "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js";
  var GSAP_SRI = "sha384-XmJ9SoHtVOHoQUcKvFAzVXwdkKo1Ie3bhmSoIAkcdsHGaIrVJIkmozyq0FJeb/Ly";
  var ST_SRC = "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js";
  var ST_SRI = "sha384-wl5TeDVvOWt30Pbf8aSo2ZrzsOjddu3avOBvHe+p+OhJt9gP6w9YXmDkN5DK2/dF";

  function loadScript(src, integrity) {
    return new Promise(function (resolve, reject) {
      var el = document.createElement("script");
      var settled = false;
      var timer = window.setTimeout(function () {
        if (settled) return;
        settled = true;
        el.remove();
        reject(new Error("Timed out: " + src));
      }, 8000);

      el.src = src;
      el.integrity = integrity;
      el.crossOrigin = "anonymous";
      el.referrerPolicy = "no-referrer";
      el.onload = function () {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve();
      };
      el.onerror = function () {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        el.remove();
        reject(new Error("Failed: " + src));
      };
      document.head.appendChild(el);
    });
  }

  function abandonMotion() {
    root.classList.remove("motion-ready");
  }

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(p, a, b) { return clamp01((p - a) / (b - a)); }

  /* --- counters ---------------------------------------------------------- */

  function formatCount(value, node) {
    var out = String(Math.round(value));
    if (node.getAttribute("data-count-format") === "comma") {
      out = out.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    return out + (node.getAttribute("data-count-suffix") || "");
  }

  /* Spec tiles never tween their numbers. A count-up from 0 prints "0+ installed" / "8,651 psia" /
     "40 mm" at the instant a visitor stops, screenshots or deep-links — a false specification and a false
     install count in the largest type on the page (round-1 P0). The final literal is in the HTML; the
     reveal is a settle of opacity/position only (styles.css .is-settled). */
  function runCounter(node) {
    var target = parseFloat(node.getAttribute("data-count"));
    if (!isFinite(target)) return;
    node.textContent = formatCount(target, node);
    if (reduceMotion) return;
    node.classList.add("is-settling");
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { node.classList.add("is-settled"); });
    });
  }

  function buildCounters() {
    var nodes = document.querySelectorAll("[data-count]");
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (node) {
        node.textContent = formatCount(parseFloat(node.getAttribute("data-count")), node);
      });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        runCounter(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    nodes.forEach(function (node) { observer.observe(node); });
  }

  /* --- generic reveal (legacy browsers only) ----------------------------- */

  function buildReveals(gsap) {
    document.querySelectorAll("[data-motion]").forEach(function (node) {
      gsap.to(node, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: { trigger: node, start: "top 88%", once: true },
        clearProps: "transform"
      });
    });
  }

  /* --- telemetry channel cards ------------------------------------------- */

  function buildChannels(gsap) {
    var grid = document.querySelector("[data-channels]");
    if (!grid) return;
    var cards = grid.querySelectorAll("[data-channel]");
    var sweeps = grid.querySelectorAll(".channel-sweep");
    if (!cards.length) return;

    var tl = gsap.timeline({ scrollTrigger: { trigger: grid, start: "top 84%", once: true } });
    tl.fromTo(cards,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.1, clearProps: "transform" });
    // The hairline sweeping across each card reads as the channel "acquiring".
    tl.to(sweeps, { scaleX: 1, duration: 0.55, ease: "power2.out", stagger: 0.1 }, "-=0.5");
  }

  /* --- pinned drill sequence --------------------------------------------- */

  // Well-path centreline, normalised to the render frame (from the Blender
  // wellpath export). Kept normalised so the SVG viewBox can change without
  // touching these numbers.
  var WELL = [
    [0.06556, 0.11965], [0.07974, 0.27552], [0.08966, 0.38457], [0.0982, 0.4784],
    [0.10459, 0.54873], [0.10943, 0.58711], [0.11543, 0.60946], [0.1237, 0.6299],
    [0.13397, 0.64784], [0.1459, 0.66281], [0.15912, 0.67442], [0.17323, 0.68238],
    [0.18784, 0.68651], [0.20251, 0.68673], [0.26171, 0.67971], [0.34881, 0.66937],
    [0.43393, 0.65927], [0.51714, 0.6494]
  ];
  var VW = 2560;
  var VH = 1440;
  var SVG_NS = "http://www.w3.org/2000/svg";

  function pathD(points) {
    return points.map(function (pt, i) {
      return (i ? "L " : "M ") + (pt[0] * VW).toFixed(1) + " " + (pt[1] * VH).toFixed(1);
    }).join(" ");
  }

  /* Beat map for the pinned sequence, as fractions of section progress.
     Named so the benefit window can't drift out of sync with the progress
     dots, which also need to know when the last card has passed. */
  var BEAT = {
    introOut:    [0.02, 0.10],
    bore:        [0.04, 0.44],
    benefits:    [0.10, 0.70],
    glow:        [0.48, 0.68],
    signal:      [0.66, 0.94]
  };

  // Six benefits surface one at a time across this window, each fading in and
  // back out inside its own slot.
  function benefitViz(p, i, n) {
    var start = BEAT.benefits[0];
    var end = BEAT.benefits[1];
    var slot = (end - start) / n;
    var s = start + i * slot;
    if (p <= s || p >= s + slot) return 0;
    var local = (p - s) / slot;
    var edge = 0.26;
    if (local < edge) return clamp01(local / edge);
    if (local > 1 - edge) return clamp01((1 - local) / edge);
    return 1;
  }

  function svgEl(name, attrs) {
    var node = document.createElementNS(SVG_NS, name);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    return node;
  }

  function buildDrill(gsap) {
    var section = document.querySelector("[data-drill]");
    if (!section) return;

    var fallback = section.querySelector("[data-drill-fallback]");
    var list = section.querySelector("[data-drill-benefits]");
    if (!fallback || !list) return;

    if (!drillIsEligible()) return;

    var benefits = Array.prototype.slice.call(list.querySelectorAll("li")).map(function (li) {
      return {
        icon: li.getAttribute("data-icon") || "ph-circle",
        label: li.querySelector("h3") ? li.querySelector("h3").textContent : "",
        detail: li.querySelector("p") ? li.querySelector("p").textContent : ""
      };
    });
    if (benefits.length < 2) return;

    var heading = section.querySelector("h2");
    var headingText = heading ? heading.textContent : "Benefits of WellFi";
    var eyebrow = section.querySelector(".eyebrow");
    var eyebrowText = eyebrow ? eyebrow.textContent : "";
    // The id moves with the heading rather than being copied — the section's
    // aria-labelledby must resolve to exactly one element.
    var headingId = heading ? heading.id : "";
    if (heading && headingId) heading.removeAttribute("id");

    var formation = section.getAttribute("data-formation");
    var casing = section.getAttribute("data-casing");

    /* ---- build the pinned stage ---- */
    var sticky = document.createElement("div");
    sticky.className = "drill-sticky";

    var stage = document.createElement("div");
    stage.className = "drill-stage";

    var formationImg = document.createElement("img");
    formationImg.className = "drill-formation";
    formationImg.src = formation;
    formationImg.alt = "";
    formationImg.setAttribute("aria-hidden", "true");
    formationImg.decoding = "async";
    // Intrinsic size so the stage reserves space and doesn't shift on decode.
    formationImg.width = 2048;
    formationImg.height = 1152;
    stage.appendChild(formationImg);

    var svg = svgEl("svg", {
      viewBox: "0 0 " + VW + " " + VH,
      preserveAspectRatio: "xMidYMid meet",
      "aria-hidden": "true",
      focusable: "false"
    });

    var defs = svgEl("defs", {});
    var mask = svgEl("mask", { id: "yotin-drill-mask" });
    var drillPath = svgEl("path", {
      d: pathD(WELL),
      fill: "none",
      stroke: "white",
      "stroke-width": 120,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      pathLength: 1,
      "stroke-dasharray": 1,
      "stroke-dashoffset": 1
    });
    mask.appendChild(drillPath);
    defs.appendChild(mask);

    var filter = svgEl("filter", { id: "yotin-signal-glow", x: "-40%", y: "-40%", width: "180%", height: "180%" });
    filter.appendChild(svgEl("feGaussianBlur", { stdDeviation: 6, result: "b" }));
    var merge = svgEl("feMerge", {});
    merge.appendChild(svgEl("feMergeNode", { in: "b" }));
    merge.appendChild(svgEl("feMergeNode", { in: "SourceGraphic" }));
    filter.appendChild(merge);
    defs.appendChild(filter);
    svg.appendChild(defs);

    // The casing image is revealed through the mask, so the bore appears to
    // be drilled in rather than faded in.
    var casingImage = svgEl("image", { width: VW, height: VH, mask: "url(#yotin-drill-mask)" });
    casingImage.setAttribute("href", casing);
    svg.appendChild(casingImage);

    var signalPath = svgEl("path", {
      d: pathD(WELL.slice().reverse()),
      fill: "none",
      stroke: "rgb(34,211,238)",
      "stroke-width": 7,
      "stroke-linecap": "round",
      pathLength: 1,
      "stroke-dasharray": 1,
      "stroke-dashoffset": 1,
      filter: "url(#yotin-signal-glow)",
      opacity: 0.9
    });
    svg.appendChild(signalPath);
    stage.appendChild(svg);

    var veil = document.createElement("div");
    veil.className = "drill-veil";
    veil.setAttribute("aria-hidden", "true");
    stage.appendChild(veil);

    var toe = WELL[WELL.length - 1];
    var glow = document.createElement("div");
    glow.className = "drill-glow";
    glow.setAttribute("aria-hidden", "true");
    glow.style.left = (toe[0] * 100) + "%";
    glow.style.top = (toe[1] * 100) + "%";
    glow.appendChild(document.createElement("span"));
    stage.appendChild(glow);

    sticky.appendChild(stage);

    var intro = document.createElement("div");
    intro.className = "drill-intro";
    if (eyebrowText) {
      var introEyebrow = document.createElement("p");
      introEyebrow.className = "eyebrow";
      introEyebrow.textContent = eyebrowText;
      intro.appendChild(introEyebrow);
    }
    var introHeading = document.createElement("h2");
    introHeading.textContent = headingText;
    if (headingId) introHeading.id = headingId;
    intro.appendChild(introHeading);
    sticky.appendChild(intro);

    var cards = benefits.map(function (b) {
      var card = document.createElement("div");
      card.className = "drill-benefit";
      var icon = document.createElement("i");
      icon.className = "ph " + b.icon;
      icon.setAttribute("aria-hidden", "true");
      var h3 = document.createElement("h3");
      h3.textContent = b.label;
      var p = document.createElement("p");
      p.textContent = b.detail;
      card.appendChild(icon);
      card.appendChild(h3);
      card.appendChild(p);
      sticky.appendChild(card);
      return card;
    });

    var progress = document.createElement("div");
    progress.className = "drill-progress";
    progress.setAttribute("aria-hidden", "true");
    var dots = benefits.map(function () {
      var dot = document.createElement("span");
      progress.appendChild(dot);
      return dot;
    });
    sticky.appendChild(progress);

    /* ---- swap the static grid for the pinned stage ----
       Remove rather than hide. Hiding left both copies in the DOM, so the
       rendered page carried two "Benefits of WellFi" H2s and two of every
       benefit H3 — duplicate headings a crawler has to reconcile. Crawlers
       that don't run JS never get here and keep the static grid. */
    fallback.remove();
    section.appendChild(sticky);
    /* 380vh made this section 42% of the entire page — long enough that
       scrolling through it read as the page being stuck. 260vh keeps every
       beat legible while cutting the pinned distance by a third. */
    section.style.height = "260vh";

    var lastDot = -1;

    gsap.registerPlugin(window.ScrollTrigger);
    window.ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: function (self) {
        var p = self.progress;

        // Drill the bore in, surface to toe.
        drillPath.setAttribute("stroke-dashoffset", String(1 - seg(p, BEAT.bore[0], BEAT.bore[1])));
        // The opening line clears as the first benefit arrives.
        intro.style.opacity = String(1 - seg(p, BEAT.introOut[0], BEAT.introOut[1]));

        cards.forEach(function (card, i) {
          var v = benefitViz(p, i, cards.length);
          card.style.opacity = String(v);
          card.style.transform = "translate(-50%, " + ((1 - v) * 14).toFixed(1) + "px)";
        });

        /* Dots are derived from progress, not from which card happens to be
           visible. Keying them off card opacity made the track blink back to
           empty in the cross-fade gaps between cards, and again after the last
           one. Progress only moves forward, so the track only fills forward. */
        var through = seg(p, BEAT.benefits[0], BEAT.benefits[1]);
        var lit = through <= 0 ? 0 : Math.min(cards.length, Math.floor(through * cards.length) + 1);
        if (lit !== lastDot) {
          dots.forEach(function (dot, i) { dot.classList.toggle("is-on", i < lit); });
          lastDot = lit;
        }

        // Once the casing is set, the EM transmission blooms at the toe.
        glow.style.opacity = String(seg(p, BEAT.glow[0], BEAT.glow[1]));
        // Finale: the telemetry signal climbs back to surface.
        signalPath.setAttribute("stroke-dashoffset", String(1 - seg(p, BEAT.signal[0], BEAT.signal[1])));
      }
    });
  }

  /* --- boot -------------------------------------------------------------- */

  /* The pinned treatment needs room, a pointer, and a real viewport. Touch and
     narrow screens keep the static grid, which carries the same content. */
  function drillIsEligible() {
    if (reduceMotion) return false;
    // The persistent three.js world replaces the pinned drill sequence; the static grid stays as the DOM
    // source of truth (spec §4, chapter 4).
    if (document.documentElement.classList.contains("world-on")) return false;
    if (!document.querySelector("[data-drill]")) return false;
    return window.matchMedia("(pointer: fine)").matches &&
      window.innerWidth >= 900 &&
      window.innerHeight >= 560;
  }

  function startMotion() {
    var gsap = window.gsap;
    if (!gsap || !window.ScrollTrigger) {
      abandonMotion();
      return;
    }
    gsap.registerPlugin(window.ScrollTrigger);

    // Native scroll-driven CSS already owns these wherever it is supported.
    if (!NATIVE_SCROLL) {
      buildReveals(gsap);
      buildChannels(gsap);
    }
    buildDrill(gsap);

    window.ScrollTrigger.refresh();
  }

  // Counters never depended on GSAP, so start them immediately.
  buildCounters();

  var needsGsap = drillIsEligible() || (!NATIVE_SCROLL && root.classList.contains("motion-ready"));

  if (needsGsap) {
    loadScript(GSAP_SRC, GSAP_SRI)
      .then(function () { return loadScript(ST_SRC, ST_SRI); })
      .then(startMotion)
      .catch(function (error) {
        console.warn("Motion layer unavailable; falling back to static page.", error);
        abandonMotion();
      });
  }

  /* ======================================================================
     Candidate-well qualifier

     Six questions, verdict shown before any contact details are asked for.
     It can and does return "outside current spec" — the 150 °C ceiling is a
     real product limit, and a qualifier that always says yes is a lead form
     with extra steps, which this audience recognises instantly.

     Every threshold below traces to a published spec on this page. Nothing
     here is invented.
     ====================================================================== */


  /* ----------------------------------------------------------------------
     Funnel instrumentation.

     The qualifier is the conversion mechanism of this page and its only
     outcome is a mailto:, so without events there is no way to know how many
     people reach it, which question they abandon, how the verdict splits
     between strong / review / high-temp, or how many actually send. The
     verdict split is a product signal as much as a marketing one: a page full
     of "above 150 °C" results is roadmap information.

     `track` is a no-op until GA_MEASUREMENT_ID in index.html is set to a real
     property, because gtag is never defined before then. That is deliberate —
     the events can ship and be reviewed now, and start recording when the
     property and its privacy notice are ready, without a second edit here.

     Two rules for anything added below:
       - Never send free text. Every value must come from a fixed vocabulary
         defined on this page, or be bucketed. The one number a visitor types
         is a well parameter, and exact figures are customer data.
       - Never let analytics break the qualifier. Failures are swallowed.
     ---------------------------------------------------------------------- */
  function track(eventName, params) {
    try {
      if (typeof window.gtag !== "function") return;
      window.gtag("event", eventName, params || {});
    } catch (err) {
      /* Analytics must never take the funnel down with it. */
    }
  }

  /* Coarse buckets so the distribution is visible without transmitting the
     exact casing length a visitor entered. */
  function casingBucket(metres) {
    if (!isFinite(metres)) return "unknown";
    if (metres < 500) return "under_500";
    if (metres < 1000) return "500_999";
    if (metres < 1500) return "1000_1499";
    if (metres < 2000) return "1500_1999";
    if (metres < 3000) return "2000_2999";
    return "3000_plus";
  }

  /* Question set, notes, thresholds and verdict logic live in
     qualifier-logic.js so they can be unit-tested without a DOM. That file is
     loaded by a deferred <script> immediately before this one, so it is always
     present by the time anything here runs. main.js owns rendering, focus
     management, analytics and the mailto; it owns none of the decisions. */
  // NB: `root` in this file is document.documentElement, not the global.
  var Q = window.YotinQualifier;
  var QUALIFIER_STEPS = Q ? Q.STEPS : [];
  var QUALIFIER_NOTES = Q ? Q.NOTES : {};
  var QUALIFIER_EMAIL = Q ? Q.EMAIL : "kyle.gronning@yotinenergy.com";
  var fmtNum = Q ? Q.fmtNum : function (n) { return String(Math.round(n)); };

  function buildQualifier() {
    var host = document.querySelector("[data-qualifier]");
    var stage = document.querySelector("[data-qualifier-stage]");
    if (!host || !stage) return;

    /* If qualifier-logic.js failed to load there are no questions to ask.
       Leave the host hidden so the section falls back to its static contact
       copy and the direct email path, rather than rendering an empty shell
       that looks broken. */
    if (!Q || !QUALIFIER_STEPS.length) return;

    host.hidden = false;

    var WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    var countLabel = document.querySelector("[data-qualifier-count]");
    if (countLabel) {
      countLabel.textContent = WORDS[QUALIFIER_STEPS.length] || String(QUALIFIER_STEPS.length);
    }

    var answers = {};
    var index = 0;
    var started = false;

    /* The funnel denominator: how many people actually reach the qualifier,
       as opposed to landing on the page. Fires once.

       Deliberately rootMargin rather than a visibility ratio. The qualifier is
       ~1440 px tall on desktop and taller once it stacks on a phone, so a
       `threshold: 0.4` can be unsatisfiable on short viewports — 40% of the
       element is simply never on screen at once, and the event never fires for
       exactly the mobile visitors it most needs to count. Shrinking the
       observation box by 25% of the viewport instead means "scrolled far
       enough that this is the thing you are looking at", independent of how
       tall either the element or the screen is. */
    if (typeof IntersectionObserver === "function") {
      var seen = false;
      var viewObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || seen) return;
          seen = true;
          viewObserver.disconnect();
          track("qualifier_view");
        });
      }, { threshold: 0, rootMargin: "0px 0px -25% 0px" });
      viewObserver.observe(host);
    }

    /* Single path for recording an answer so the option steps and the number
       step cannot drift apart in what they report. */
    function recordAnswer(step, answer, reportedValue) {
      answers[step.key] = answer;
      if (!started) {
        started = true;
        track("qualifier_start");
      }
      track("qualifier_step", {
        step_index: index + 1,
        step_key: step.key,
        answer: reportedValue
      });
      emitQualifierState(step.key, null);
    }

    /* Normalized schematic state for the world (spec §0, §4 row 6). The world
       and its caption only ever see this object: fixed ids chosen by option
       POSITION in QUALIFIER_STEPS (static steps) or by the option's flag (the
       derived landing step), plus a boolean for whether a casing length was
       given. The typed casing length, the derived threshold and every answer
       string stay inside this closure — nothing here reads them. */
    function qualifierWorldState(phase, verdict) {
      function pick(key, ids) {
        var step = null;
        QUALIFIER_STEPS.forEach(function (s) { if (s.key === key) step = s; });
        var a = answers[key];
        if (!step || !a || !step.options) return null;
        var i = step.options.indexOf(a);
        return i >= 0 && ids[i] ? ids[i] : null;
      }
      var landing = answers.landing;
      return {
        step: phase,
        lift: pick("lift", ["pcp", "esp", "rod", "flow"]),
        fluid: pick("type", ["heavy", "light", "gas", "thermal"]),
        temp: pick("temp", ["cool", "warm", "over", "unsure"]),
        hasLength: Boolean(answers.intermediate),
        landing: !landing ? null : landing.flag === "external" ? "deeper" : landing.flag === "landing" ? null : "shallower",
        verdict: verdict || null
      };
    }
    function emitQualifierState(phase, verdict) {
      try {
        document.dispatchEvent(new CustomEvent("qualifier:state", { detail: qualifierWorldState(phase, verdict) }));
      } catch (err) {
        /* The world is decoration; the qualifier never depends on it. */
      }
    }

    function clear(node) {
      while (node.firstChild) node.removeChild(node.firstChild);
    }

    function el(tag, className, text) {
      var node = document.createElement(tag);
      if (className) node.className = className;
      if (text != null) node.textContent = text;
      return node;
    }

    function icon(name) {
      var i = document.createElement("i");
      i.className = "ph " + name;
      i.setAttribute("aria-hidden", "true");
      return i;
    }

    /* Same markup at every width, on the question screens AND on the verdict (round 9, Mobbin #1): the phone
       had the segmented rule and the step counter, the desktop verdict had neither, so the visitor arrived at
       the answer with no sense of having finished six questions. `complete` lights every segment. */
    function renderProgress(complete) {
      var bar = el("div", "qualifier-progress");
      bar.setAttribute("aria-hidden", "true");
      QUALIFIER_STEPS.forEach(function (step, i) {
        var seg = el("span");
        if (complete || i < index) seg.className = "is-done";
        else if (i === index) seg.className = "is-current";
        bar.appendChild(seg);
      });
      return bar;
    }

    function advance() {
      if (index < QUALIFIER_STEPS.length - 1) {
        index += 1;
        renderStep();
      } else {
        renderVerdict();
      }
    }

    function renderStep() {
      var step = QUALIFIER_STEPS[index];
      // Derived steps compute their question and options from earlier answers.
      var spec = step.type === "derived" ? step.build(answers) : step;

      clear(stage);
      stage.appendChild(renderProgress());

      var wrap = el("div", "qualifier-step");
      wrap.appendChild(el("p", "qualifier-count", "Question " + (index + 1) + " of " + QUALIFIER_STEPS.length));

      var heading = el("h4", "qualifier-question", spec.question);
      heading.id = "qualifier-q";
      wrap.appendChild(heading);

      if (spec.hint) wrap.appendChild(el("p", "qualifier-hint", spec.hint));

      if (step.type === "number") {
        wrap.appendChild(renderNumberInput(step));
      } else {
        var group = el("div", "qualifier-options");
        group.setAttribute("role", "group");
        group.setAttribute("aria-labelledby", "qualifier-q");

        spec.options.forEach(function (opt) {
          var button = el("button", "qualifier-option");
          button.type = "button";
          button.appendChild(el("span", null, opt.value));
          if (opt.tag) button.appendChild(el("span", "tag", opt.tag));
          button.addEventListener("click", function () {
            // opt.value is a fixed string defined in QUALIFIER_STEPS above,
            // never anything the visitor typed.
            recordAnswer(step, opt, opt.value);
            advance();
          });
          group.appendChild(button);
        });
        wrap.appendChild(group);
      }

      if (index > 0) {
        var back = el("button", "qualifier-back", "← Back");
        back.type = "button";
        back.addEventListener("click", function () {
          track("qualifier_back", {
            step_index: index + 1,
            step_key: QUALIFIER_STEPS[index].key
          });
          index -= 1;
          renderStep();
          emitQualifierState("back", null);
        });
        wrap.appendChild(back);
      }

      stage.appendChild(wrap);
      // Move focus to the new question so keyboard and screen-reader users
      // aren't stranded on a control that no longer exists.
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }

    function renderNumberInput(step) {
      var box = el("div", "qualifier-number");

      var field = el("div", "qualifier-field");
      var input = document.createElement("input");
      /* type=text + inputmode=numeric rather than type=number: it raises the
         numeric keypad on phones without inheriting number-input quirks
         (scroll-wheel value changes, locale-dependent parsing, spinners). */
      input.type = "text";
      input.inputMode = "numeric";
      input.autocomplete = "off";
      input.setAttribute("pattern", "[0-9]*");
      input.setAttribute("aria-labelledby", "qualifier-q");
      input.placeholder = step.placeholder || "";
      input.className = "qualifier-input";
      if (answers[step.key]) input.value = String(answers[step.key].number);

      field.appendChild(input);
      field.appendChild(el("span", "qualifier-unit", step.unit || ""));
      box.appendChild(field);

      var error = el("p", "qualifier-error");
      error.setAttribute("role", "alert");
      box.appendChild(error);

      var go = el("button", "button button-primary qualifier-go");
      go.type = "button";
      go.appendChild(el("span", null, "Continue"));
      go.appendChild(icon("ph-arrow-right"));
      box.appendChild(go);

      function submit() {
        var parsed = Q.parseCasingLength(input.value, step);
        if (!parsed.ok) {
          error.textContent = parsed.error;
          // A validation stall is a usability signal: it means the field is
          // asking for something the visitor doesn't have to hand.
          track("qualifier_input_error", { step_key: step.key, reason: parsed.reason });
          input.focus();
          return;
        }
        var n = parsed.number;
        error.textContent = "";
        // Bucketed, not the exact figure the visitor typed.
        recordAnswer(
          step,
          { value: fmtNum(n) + " " + (step.unit || ""), number: n },
          casingBucket(n)
        );
        advance();
      }

      go.addEventListener("click", submit);
      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          submit();
        }
      });
      input.addEventListener("input", function () { error.textContent = ""; });

      window.setTimeout(function () { input.focus({ preventScroll: true }); }, 30);
      return box;
    }

    function assess() {
      return Q.assess(answers);
    }

    function summaryLines() {
      return QUALIFIER_STEPS.map(function (step) {
        return { label: step.label, value: answers[step.key] ? answers[step.key].value : "—" };
      });
    }

    /* One sentence of reasoning, built ONLY from the normalized ids the qualifier already derived for the world
       (qualifierWorldState) — the visitor's own answers in their own words, no new facts, no figures the page
       does not already publish. The decision itself is untouched: this only says out loud which answers drove
       it, which is what an engineer needs to trust the verdict (round 9, Mobbin #1). */
    var LIFT_WORD = { pcp: "PCP lift", esp: "ESP lift", rod: "rod pump", flow: "natural flow or other lift" };
    var FLUID_WORD = { heavy: "heavy oil", light: "light oil", gas: "gas", thermal: "thermal / SAGD" };
    var TEMP_WORD = {
      cool: "under 100 °C",
      warm: "100 – 150 °C",
      over: "above 150 °C",
      unsure: "a bottomhole temperature you could not confirm"
    };
    var LANDING_WORD = {
      shallower: "the pump landed shallower than the standoff line, so WellFi runs inside the tubing",
      deeper: "the pump landed deeper than the standoff line, so WellFi runs outside the intermediate"
    };
    var REASON_TAIL = {
      strong: "nothing you entered sits outside the operating envelope.",
      review: "that is what the points below would confirm before a deployment date.",
      future: "temperature is the one hard limit, so this well waits on the high-temperature build."
    };
    function reasonSentence(result) {
      var s = qualifierWorldState("verdict", result.fit);
      var parts = [];
      if (LIFT_WORD[s.lift]) parts.push(LIFT_WORD[s.lift]);
      if (FLUID_WORD[s.fluid]) parts.push(FLUID_WORD[s.fluid]);
      if (TEMP_WORD[s.temp]) parts.push(TEMP_WORD[s.temp]);
      var clause = LANDING_WORD[s.landing] || (answers.landing ? "the pump landing still to pin down" : "");
      var lead = parts.join(", ");
      if (clause) lead = lead ? lead + " and " + clause : clause;
      if (!lead) return "";
      return lead.charAt(0).toUpperCase() + lead.slice(1) + " — " + (REASON_TAIL[result.fit] || "");
    }

    function plainSummary(result) {
      var lines = ["Candidate well review — WellFi", ""];
      summaryLines().forEach(function (row) { lines.push(row.label + ": " + row.value); });
      lines.push("");
      lines.push("Self-check result: " + Q.resultLabel(result.fit));
      result.flags.forEach(function (f) { if (QUALIFIER_NOTES[f]) lines.push("- " + QUALIFIER_NOTES[f]); });
      lines.push("");
      lines.push("Sent from yotinenergy.com");
      return lines.join("\n");
    }

    function renderVerdict() {
      var result = assess();
      // The verdict split is the most useful single number this page can
      // report. `flags` is a fixed vocabulary defined above, not free text.
      track("qualifier_result", {
        fit: result.fit,
        flag_count: result.flags.length,
        flags: result.flags.length ? result.flags.join(",") : "none"
      });
      clear(stage);
      stage.appendChild(renderProgress(true));

      var wrap = el("div", "qualifier-verdict");
      wrap.setAttribute("data-fit", result.fit);
      wrap.setAttribute("role", "status");
      wrap.appendChild(el("p", "qualifier-count", "All " + (WORDS[QUALIFIER_STEPS.length] || QUALIFIER_STEPS.length).toString().toLowerCase() + " questions answered"));

      /* Round 9 (Mobbin #1). The verdict used to be a single bordered pill — a ring makes a result look like a
         button, and the only reasoning on the page was a mono caption 900 px away on the canvas. It is a stacked
         block now: what you answered, then VERDICT, then the label as plain text, then one sentence saying which
         of your answers drove it, and only then the quiet actions row. The decision logic is untouched. */
      var label;
      var detail;
      var ctaLabel = "Send this to Yotin";

      if (result.fit === "strong") {
        label = "Strong fit";
        // the reasoning sentence above now says the envelope part, in the visitor's own answers — no need to say it twice
        detail = "The next step is confirming tubing configuration and what data you want out of it.";
      } else if (result.fit === "review") {
        label = "Likely fit — worth a review";
        detail = "Nothing you entered rules it out. These are the points our team would want to walk through before committing to a deployment date.";
      } else {
        label = "High-temp version in development";
        detail = "WellFi is rated to 150 °C today, and a higher-temperature version is in development. Send this well through and we will come back to you when it is ready, rather than you starting from scratch later.";
        ctaLabel = "Have Yotin follow up";
      }

      /* (a) readback first: the six questions with the visitor's own answers, verbatim, in the mono face. §0
         licenses echoing their own data — it is the only way an engineer can check what the answer was given.
         data-clarity-mask, like everything else that repeats an answer. */
      var readback = el("dl", "qualifier-summary qualifier-readback");
      readback.setAttribute("data-clarity-mask", "true");
      summaryLines().forEach(function (row) {
        var line = el("div");
        line.appendChild(el("dt", null, row.label));
        line.appendChild(el("dd", null, row.value));
        readback.appendChild(line);
      });
      wrap.appendChild(readback);

      wrap.appendChild(el("p", "qualifier-eyebrow", "Verdict"));
      wrap.appendChild(el("p", "qualifier-label", label));

      var reason = reasonSentence(result);
      if (reason) {
        var reasonEl = el("p", "qualifier-reason", reason);
        reasonEl.setAttribute("data-clarity-mask", "true");
        wrap.appendChild(reasonEl);
      }

      wrap.appendChild(el("p", "qualifier-detail", detail));

      if (result.flags.length) {
        var notes = el("ul", "qualifier-notes");
        result.flags.forEach(function (f) {
          if (!QUALIFIER_NOTES[f]) return;
          var li = document.createElement("li");
          li.appendChild(icon("ph-arrow-elbow-down-right"));
          li.appendChild(el("span", null, QUALIFIER_NOTES[f]));
          notes.appendChild(li);
        });
        if (notes.childNodes.length) wrap.appendChild(notes);
      }

      var body = plainSummary(result);
      var actions = el("div", "qualifier-actions");

      // (e) the row is an exit from the block, not its headline: quieter scale, ember kept as an outline so the
      // CTA hue rule (§0: ember carries CTAs) survives the demotion from a filled pill.
      var send = el("a", "button button-primary qualifier-cta");
      // Distinct subject so the team can triage the waitlist separately.
      var subject = result.fit === "future"
        ? "Candidate well — awaiting 150 °C+ WellFi"
        : "Candidate well review — WellFi";
      send.href = "mailto:" + QUALIFIER_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      send.appendChild(el("span", null, ctaLabel));
      send.appendChild(icon("ph-arrow-right"));
      // The closest thing this page has to a conversion. It cannot confirm the
      // mail was actually sent — only that the client was invoked.
      send.addEventListener("click", function () {
        track("qualifier_send", { fit: result.fit });
      });
      actions.appendChild(send);

      // The copy button is the real fallback: plenty of corporate machines
      // have no mail client bound, and a dead mailto is a dead lead.
      var copy = el("button", "button button-secondary");
      copy.type = "button";
      copy.appendChild(icon("ph-copy"));
      copy.appendChild(el("span", null, "Copy summary"));
      actions.appendChild(copy);

      wrap.appendChild(actions);

      var state = el("p", "qualifier-copy-state");
      state.setAttribute("role", "status");
      wrap.appendChild(state);

      copy.addEventListener("click", function () {
        function done(ok) {
          state.textContent = ok
            ? "Copied — paste it into an email to " + QUALIFIER_EMAIL
            : "Copy failed. The address is " + QUALIFIER_EMAIL;
          // Worth separating from qualifier_send: a high copy rate means the
          // mailto path is failing for this audience, which is a fixable
          // conversion problem rather than a lost lead.
          track("qualifier_copy", { fit: result.fit, ok: ok ? "yes" : "no" });
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(body).then(function () { done(true); }, function () { done(false); });
        } else {
          done(false);
        }
      });

      var restart = el("button", "qualifier-back", "Start over");
      restart.type = "button";
      restart.addEventListener("click", function () {
        track("qualifier_restart", { fit: result.fit });
        answers = {};
        index = 0;
        started = false;
        renderStep();
        emitQualifierState("restart", null);
      });
      wrap.appendChild(restart);

      stage.appendChild(wrap);
      emitQualifierState("verdict", result.fit);
    }

    renderStep();
  }

  buildQualifier();

  /* ======================================================================
     ChatFi
     ====================================================================== */

  var panel = document.querySelector("[data-chatfi-panel]");
  var openButtons = Array.prototype.slice.call(document.querySelectorAll("[data-chatfi-open]"));
  var closeButton = document.querySelector("[data-chatfi-close]");
  var chatBody = document.querySelector("[data-chatfi-body]");
  var chat = document.querySelector("[data-chatfi-chat]");
  var loading = document.querySelector("[data-chatfi-loading]");
  var statusText = document.querySelector("[data-chatfi-status]");
  var fallbackLink = document.querySelector("[data-chatfi-fallback]");
  var launcher = document.querySelector(".chatfi-launcher");
  var apiBase = (document.body.getAttribute("data-chatfi-api") || "").replace(/\/$/, "");
  var lastOpener = null;
  var activeController = null;
  var deepChatReady = null;
  var DEEP_CHAT_SOURCES = [
    "https://cdn.jsdelivr.net/npm/deep-chat@2.4.2/dist/deepChat.bundle.js",
    "https://unpkg.com/deep-chat@2.4.2/dist/deepChat.bundle.js"
  ];
  var DEEP_CHAT_INTEGRITY = "sha384-ire02ARbuqxh1f0vqLCtjJKh6BVWbziZzoiPht9u+EwKaLagZ6ESBXsXp+A8+x6m";
  var CHATFI_ERROR = "ChatFi can’t connect from this site yet. Email kyle.gronning@yotinenergy.com and the team will help directly.";

  function loadDeepChat() {
    if (window.customElements && window.customElements.get("deep-chat")) return Promise.resolve();
    if (deepChatReady) return deepChatReady;

    function loadSource(source) {
      return new Promise(function (resolve, reject) {
        var script = document.createElement("script");
        var settled = false;
        var timeout = window.setTimeout(function () {
          if (settled) return;
          settled = true;
          script.remove();
          reject(new Error("Deep Chat load timed out: " + source));
        }, 9000);

        function resolveLoad() {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          resolve();
        }

        function rejectLoad(error) {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          script.remove();
          reject(error);
        }

        script.src = source;
        script.type = "module";
        script.integrity = DEEP_CHAT_INTEGRITY;
        script.crossOrigin = "anonymous";
        script.referrerPolicy = "no-referrer";
        script.onload = function () {
          if (!window.customElements) {
            rejectLoad(new Error("Custom elements are not supported"));
            return;
          }
          window.customElements.whenDefined("deep-chat").then(resolveLoad, rejectLoad);
        };
        script.onerror = function () {
          rejectLoad(new Error("Deep Chat failed to load: " + source));
        };
        document.head.appendChild(script);
      });
    }

    deepChatReady = DEEP_CHAT_SOURCES.reduce(function (attempt, source) {
      return attempt.catch(function () {
        return loadSource(source);
      });
    }, Promise.reject(new Error("No Deep Chat source attempted"))).catch(function (error) {
      deepChatReady = null;
      throw error;
    });

    return deepChatReady;
  }

  function toChatFiMessages(messages) {
    return (messages || []).slice(-24).map(function (message) {
      return {
        role: message.role === "ai" ? "assistant" : "user",
        content: typeof message.text === "string" ? message.text : ""
      };
    }).filter(function (message) { return message.content; });
  }

  function configureDeepChat() {
    if (!chat || chat.getAttribute("data-configured") === "true") return;

    chat.setAttribute("data-configured", "true");
    chat.chatStyle = {
      width: "100%",
      height: "100%",
      border: "0",
      borderRadius: "0",
      backgroundColor: "#09131b",
      fontFamily: "IBM Plex Sans, sans-serif"
    };
    chat.introMessage = {
      text: "I’m ChatFi. Ask how WellFi works, what it reads, or whether it fits your wells."
    };
    chat.requestBodyLimits = { maxMessages: 24 };
    chat.maxVisibleMessages = 60;
    chat.remarkable = { html: false, breaks: true, linkTarget: "_blank" };
    chat.hiddenMessages = {
      clickScroll: "last",
      smoothScroll: !reduceMotion
    };
    chat.errorMessages = {
      displayServiceErrorMessages: false,
      overrides: { default: CHATFI_ERROR, service: CHATFI_ERROR }
    };
    chat.inputAreaStyle = {
      backgroundColor: "#09131b",
      borderTop: "1px solid rgba(232, 220, 200, 0.13)",
      padding: "12px 14px 14px"
    };
    chat.textInput = {
      characterLimit: 4000,
      placeholder: { text: "Ask about WellFi…", style: { color: "#7e8b92" } },
      styles: {
        text: { color: "#f3f6f7", fontSize: "16px", lineHeight: "1.45" },
        container: {
          minHeight: "48px",
          maxHeight: "130px",
          backgroundColor: "#03070b",
          border: "1px solid rgba(232, 220, 200, 0.18)",
          borderRadius: "14px"
        },
        focus: { border: "1px solid #f27622", boxShadow: "0 0 0 3px rgba(242, 118, 34, 0.16)" }
      }
    };
    chat.messageStyles = {
      default: {
        shared: {
          bubble: {
            maxWidth: "88%",
            padding: "12px 14px",
            borderRadius: "14px",
            color: "#dfe6e9",
            fontSize: "14px",
            lineHeight: "1.55"
          }
        },
        ai: { bubble: { backgroundColor: "#15242e", borderBottomLeftRadius: "4px" } },
        user: { bubble: { backgroundColor: "#f27622", color: "#03070b", borderBottomRightRadius: "4px" } }
      },
      intro: { bubble: { backgroundColor: "#15242e", color: "#dfe6e9", borderBottomLeftRadius: "4px" } },
      error: { bubble: { backgroundColor: "#391a17", color: "#ffd7cf" } },
      loading: {
        message: { styles: { bubble: { backgroundColor: "#15242e", color: "#8c9ba2" } } }
      }
    };
    chat.submitButtonStyles = {
      submit: {
        container: {
          default: { width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "#f27622" },
          hover: { backgroundColor: "#ff9147" },
          click: { backgroundColor: "#d85a10" }
        },
        svg: { styles: { default: { filter: "brightness(0) saturate(100%)" } } }
      },
      stop: { container: { default: { backgroundColor: "#b3aa9a" } } },
      position: "inside-end",
      tooltip: { text: "Send message" }
    };
    chat.auxiliaryStyle = "a { color: #ff9147; } ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-thumb { background: #2c3a44; border-radius: 999px; }";

    chat.connect = {
      stream: true,
      handler: function (body, signals) {
        if (!apiBase) {
          signals.onResponse({ error: CHATFI_ERROR });
          signals.onClose();
          return;
        }
        activeController = new AbortController();
        signals.stopClicked.listener = function () {
          if (activeController) activeController.abort();
        };

        (async function () {
          var reply = "";
          try {
            var response = await fetch(apiBase + "/chat", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ messages: toChatFiMessages(body.messages) }),
              signal: activeController.signal
            });

            if (!response.ok) throw new Error("ChatFi returned " + response.status);
            if (!response.body) throw new Error("ChatFi response was empty");

            signals.onOpen();
            var reader = response.body.getReader();
            var decoder = new TextDecoder();

            while (true) {
              var part = await reader.read();
              if (part.done) break;
              var chunk = decoder.decode(part.value, { stream: true });
              if (!chunk) continue;
              reply += chunk;
              await signals.onResponse({ text: chunk });
            }

            var finalChunk = decoder.decode();
            if (finalChunk) {
              reply += finalChunk;
              await signals.onResponse({ text: finalChunk });
            }
            if (!reply.trim()) throw new Error("ChatFi response contained no text");
          } catch (error) {
            if (!error || error.name !== "AbortError") {
              await signals.onResponse({ error: CHATFI_ERROR });
            }
          } finally {
            activeController = null;
            signals.onClose();
          }
        })();
      }
    };
  }

  function showChatUnavailable() {
    if (statusText) statusText.textContent = "ChatFi could not load. The direct contact route is still available.";
    if (fallbackLink) fallbackLink.hidden = false;
  }

  function prepareChat() {
    if (statusText) statusText.textContent = "Preparing the secure connection…";
    if (fallbackLink) fallbackLink.hidden = true;
    return loadDeepChat().then(function () {
      configureDeepChat();
      if (chatBody) chatBody.classList.add("is-ready");
      if (loading) loading.setAttribute("aria-hidden", "true");
    }).catch(function (error) {
      console.error("ChatFi interface failed to initialize", error);
      showChatUnavailable();
      throw error;
    });
  }

  function updateVisualViewport() {
    if (!panel) return;
    var viewport = window.visualViewport;
    var height = viewport ? viewport.height : window.innerHeight;
    panel.style.setProperty("--chatfi-vh", height + "px");
    if (window.innerWidth <= 820 && viewport) {
      var keyboardOffset = Math.max(8, window.innerHeight - viewport.height - viewport.offsetTop + 8);
      panel.style.bottom = keyboardOffset + "px";
    } else {
      panel.style.bottom = "";
    }
  }

  function openChat(event) {
    if (!panel) return;
    lastOpener = event && event.currentTarget ? event.currentTarget : document.activeElement;
    closeNav(false);
    panel.hidden = false;
    document.body.classList.add("chatfi-open");
    if (launcher) launcher.hidden = true;
    updateVisualViewport();
    prepareChat().then(function () {
      if (!panel.hidden && chat && typeof chat.focusInput === "function") {
        window.setTimeout(function () { chat.focusInput(); }, 20);
      }
    }).catch(function () {
      if (!panel.hidden && fallbackLink) fallbackLink.focus();
    });
  }

  function closeChat() {
    if (!panel) return;
    if (activeController) {
      activeController.abort();
      activeController = null;
    }
    panel.hidden = true;
    document.body.classList.remove("chatfi-open");
    if (launcher) launcher.hidden = false;
    if (lastOpener && typeof lastOpener.focus === "function") lastOpener.focus();
  }

  openButtons.forEach(function (button) { button.addEventListener("click", openChat); });
  if (closeButton) closeButton.addEventListener("click", closeChat);

  function deepestActiveElement() {
    var active = document.activeElement;
    while (active && active.shadowRoot && active.shadowRoot.activeElement) {
      active = active.shadowRoot.activeElement;
    }
    return active;
  }

  function panelFocusables() {
    var focusable = [];
    if (closeButton) focusable.push(closeButton);
    if (chat && chat.shadowRoot) {
      focusable = focusable.concat(Array.prototype.slice.call(chat.shadowRoot.querySelectorAll(
        "button:not([disabled]), textarea:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])"
      )));
    } else if (fallbackLink && !fallbackLink.hidden) {
      focusable.push(fallbackLink);
    }
    return focusable.filter(function (element) {
      return element && !element.disabled && (element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (panel && !panel.hidden) closeChat();
      else if (navToggle && navToggle.getAttribute("aria-expanded") === "true") closeNav(true);
      return;
    }

    if (event.key !== "Tab" || !panel || panel.hidden) return;
    var focusable = panelFocusables();
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    var active = deepestActiveElement();
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener("beforeunload", function () {
    if (activeController) activeController.abort();
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", updateVisualViewport);
    window.visualViewport.addEventListener("scroll", updateVisualViewport);
  }
})();
