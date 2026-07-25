/* Yotin Energy — progressive interaction layer. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* ======================================================================
     Hero — canonical live R3F scene
     The poster paints first. The live scene loads from the WellFi site and
     cross-fades only after its renderer reports a real frame.
     ====================================================================== */

  var heroScene = document.querySelector("[data-wellfi-live]");
  var liveFrame = null;
  var liveOrigin = "";
  var liveInView = true;
  var liveReady = false;
  var liveTimeout = 0;
  var liveObserver = null;

  function sendLiveActivity() {
    // Only meaningful once the child has navigated and announced itself.
    // Posting earlier targets a still-same-origin about:blank document and
    // throws a console warning on every observer tick.
    if (!liveReady || !liveFrame || !liveFrame.contentWindow || !liveOrigin) return;
    liveFrame.contentWindow.postMessage({
      type: "wellfi:set-active",
      active: liveInView && !document.hidden
    }, liveOrigin);
  }

  function receiveLiveMessage(event) {
    if (!liveFrame || event.source !== liveFrame.contentWindow || event.origin !== liveOrigin) return;
    if (!event.data || event.data.type !== "wellfi:r3f-ready") return;
    revealLiveFrame();
  }

  function revealLiveFrame() {
    if (liveReady || !liveFrame) return;
    liveReady = true;
    window.clearTimeout(liveTimeout);
    heroScene.classList.add("is-live");
    sendLiveActivity();
  }

  function removeFailedLiveFrame() {
    if (!liveReady && liveFrame) {
      liveFrame.remove();
      liveFrame = null;
      window.removeEventListener("message", receiveLiveMessage);
      document.removeEventListener("visibilitychange", sendLiveActivity);
      if (liveObserver) {
        liveObserver.disconnect();
        liveObserver = null;
      }
    }
  }

  function mountLiveHero() {
    if (!heroScene || reduceMotion) return;
    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection && connection.saveData) return;

    var isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    var source = heroScene.getAttribute(isLocal ? "data-live-src-local" : "data-live-src");
    if (!source) return;

    var url = new URL(source);
    url.searchParams.set("motion", "force");
    url.searchParams.set("embed", "yotin");
    url.searchParams.set("parentOrigin", window.location.origin);
    liveOrigin = url.origin;

    liveFrame = document.createElement("iframe");
    liveFrame.className = "hero-live-frame";
    liveFrame.title = "Live WellFi telemetry cutaway";
    liveFrame.src = url.toString();
    liveFrame.loading = "eager";
    liveFrame.referrerPolicy = "strict-origin-when-cross-origin";
    liveFrame.tabIndex = -1;
    liveFrame.setAttribute("aria-hidden", "true");
    liveFrame.addEventListener("error", removeFailedLiveFrame, { once: true });

    window.addEventListener("message", receiveLiveMessage);
    document.addEventListener("visibilitychange", sendLiveActivity);

    if ("IntersectionObserver" in window) {
      liveObserver = new IntersectionObserver(function (entries) {
        liveInView = entries[0].isIntersecting;
        sendLiveActivity();
      }, { threshold: 0.02 });
      liveObserver.observe(heroScene);
    }

    heroScene.appendChild(liveFrame);
    liveTimeout = window.setTimeout(removeFailedLiveFrame, 15000);
  }

  if (heroScene) {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(mountLiveHero);
    });
  }

  /* ======================================================================
     Header and navigation
     ====================================================================== */

  var header = document.querySelector("[data-header]");
  var navToggle = document.querySelector("[data-nav-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");

  function updateHeader() {
    if (!header) return;
    if (window.scrollY > 44) header.setAttribute("data-scrolled", "");
    else header.removeAttribute("data-scrolled");
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

  if (sections.length && "IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
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

  /* Counters run on plain rAF + IntersectionObserver, so the spec numbers
     animate on every browser regardless of whether GSAP is ever fetched. */
  function runCounter(node) {
    var target = parseFloat(node.getAttribute("data-count"));
    if (!isFinite(target)) return;
    if (reduceMotion) {
      node.textContent = formatCount(target, node);
      return;
    }
    var duration = 1300;
    var started = 0;
    function frame(now) {
      if (!started) started = now;
      var p = Math.min(1, (now - started) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      node.textContent = formatCount(target * eased, node);
      if (p < 1) window.requestAnimationFrame(frame);
      else node.textContent = formatCount(target, node);
    }
    window.requestAnimationFrame(frame);
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

     Five questions, verdict shown before any contact details are asked for.
     It can and does return "outside current spec" — the 150 °C ceiling is a
     real product limit, and a qualifier that always says yes is a lead form
     with extra steps, which this audience recognises instantly.

     Every threshold below traces to a published spec on this page. Nothing
     here is invented.
     ====================================================================== */

  var QUALIFIER_EMAIL = "info@yotinenergy.com";

  var QUALIFIER_STEPS = [
    {
      key: "lift",
      label: "Artificial lift",
      question: "What lifts the well?",
      options: [
        { value: "Progressing cavity pump (PCP)", tag: "Best fit" },
        { value: "Electric submersible pump (ESP)" },
        { value: "Rod pump" },
        { value: "Natural flow or other", flag: "lift" }
      ]
    },
    {
      key: "type",
      label: "Well type",
      question: "What is it producing?",
      options: [
        { value: "Heavy oil" },
        { value: "Light oil" },
        { value: "Gas" },
        { value: "Thermal / SAGD", flag: "thermal" }
      ]
    },
    {
      key: "temp",
      label: "Bottomhole temperature",
      question: "How hot does it get downhole?",
      options: [
        { value: "Under 100 °C" },
        { value: "100 – 150 °C", tag: "At spec" },
        { value: "Above 150 °C", future: true },
        { value: "Not sure", flag: "temp" }
      ]
    },
    {
      /* Asked as a number because the next question is derived from it. The
         standoff rule is a proportion of this length, so a banded answer here
         would make the follow-up threshold meaningless. */
      key: "intermediate",
      type: "number",
      label: "Intermediate casing length",
      question: "How long is your intermediate casing, approximately?",
      unit: "m",
      placeholder: "1000",
      min: 50,
      max: 6000
    },
    {
      /* Where the pump lands decides the deployment method. The collar needs
         roughly 10% of the intermediate's length of standoff from the shoe:
         (shoe depth - pump depth) >= 0.10 x intermediate length. Landed closer
         than that, WellFi runs outside the intermediate instead of inside the
         tubing. This matches the EM physics — the formation is the antenna, and
         an emitter sitting at the cemented shoe couples at roughly 0.1%. Either
         comfortably above the shoe or below it in open hole is fine; at the
         shoe is the bad case. */
      key: "landing",
      type: "derived",
      label: "Pump landing",
      /* Question and options are built from the entered casing length: the
         collar needs ~10% of that length of standoff above the shoe, so the
         threshold is 0.9 x length. Turning the rule into a single concrete
         number means the engineer taps once instead of doing the arithmetic. */
      build: function (answers) {
        var len = answers.intermediate ? answers.intermediate.number : null;
        if (!len) {
          return {
            question: "Where does the pump land in the intermediate casing?",
            options: [
              { value: "Well above the shoe" },
              { value: "Close to the shoe", flag: "external" },
              { value: "Not sure", flag: "landing" }
            ]
          };
        }
        var threshold = Math.round((len * 0.9) / 10) * 10;
        return {
          question: "Is the pump landed shallower or deeper than " + fmtNum(threshold) + " m?",
          hint: "That is 10% of your intermediate above the shoe — the standoff WellFi needs to run inside the tubing.",
          options: [
            { value: "Shallower than " + fmtNum(threshold) + " m", tag: "< " + fmtNum(threshold) },
            { value: "Deeper than " + fmtNum(threshold) + " m", tag: "> " + fmtNum(threshold), flag: "external" },
            { value: "Not sure", flag: "landing" }
          ]
        };
      }
    },
    {
      key: "timing",
      label: "Next planned intervention",
      question: "When is the next pump change or planned intervention?",
      options: [
        { value: "Within 3 months", tag: "Ideal timing" },
        { value: "3 – 12 months" },
        { value: "Nothing scheduled", flag: "timing" },
        { value: "Not sure", flag: "timing" }
      ]
    }
  ];

  function fmtNum(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Each note explains WHY something needs review, in the engineer's terms.
  var QUALIFIER_NOTES = {
    temp: "Bottomhole temperature is the one hard limit — WellFi is rated to 150 °C today, so that number is worth confirming before anything else.",
    external: "Landed that deep, WellFi would run outside the intermediate rather than inside the tubing. The collar wants roughly 10% of the intermediate's length of standoff above the shoe; any closer and an emitter sitting at the cemented shoe barely couples to the formation. Running it outside is routine, but it changes the install and is worth confirming early.",
    landing: "Where the pump sits relative to the intermediate shoe decides whether WellFi runs inside the tubing or outside the intermediate. Worth pinning down before the changeout gets scoped.",
    timing: "WellFi can go in on a new completion, a planned changeout, or its own run. The economics are simply strongest when it rides along with work that is already scheduled.",
    lift: "Most deployments so far are on pumped wells. Other lift types are workable but worth walking through.",
    thermal: "Thermal and SAGD wells sit closest to the temperature ceiling, so the operating profile matters more than usual."
  };

  function buildQualifier() {
    var host = document.querySelector("[data-qualifier]");
    var stage = document.querySelector("[data-qualifier-stage]");
    if (!host || !stage) return;

    host.hidden = false;

    var WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    var countLabel = document.querySelector("[data-qualifier-count]");
    if (countLabel) {
      countLabel.textContent = WORDS[QUALIFIER_STEPS.length] || String(QUALIFIER_STEPS.length);
    }

    var answers = {};
    var index = 0;

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

    function renderProgress() {
      var bar = el("div", "qualifier-progress");
      bar.setAttribute("aria-hidden", "true");
      QUALIFIER_STEPS.forEach(function (step, i) {
        var seg = el("span");
        if (i < index) seg.className = "is-done";
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
            answers[step.key] = opt;
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
          index -= 1;
          renderStep();
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
        var raw = input.value.replace(/[^\d.]/g, "");
        var n = parseFloat(raw);
        if (!isFinite(n) || n <= 0) {
          error.textContent = "Enter the approximate length in metres.";
          input.focus();
          return;
        }
        if (n < step.min || n > step.max) {
          error.textContent = "That looks outside the usual range (" +
            fmtNum(step.min) + "–" + fmtNum(step.max) + " m). Double-check the figure.";
          input.focus();
          return;
        }
        error.textContent = "";
        answers[step.key] = { value: fmtNum(n) + " " + (step.unit || ""), number: n };
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
      var flags = [];
      var future = false;
      QUALIFIER_STEPS.forEach(function (step) {
        var a = answers[step.key];
        if (!a) return;
        // Above 150 °C isn't a dead end any more — it's a waitlist.
        if (a.future) future = true;
        if (a.flag) flags.push(a.flag);
      });
      if (future) return { fit: "future", flags: flags };
      return { fit: flags.length ? "review" : "strong", flags: flags };
    }

    function summaryLines() {
      return QUALIFIER_STEPS.map(function (step) {
        return { label: step.label, value: answers[step.key] ? answers[step.key].value : "—" };
      });
    }

    function plainSummary(result) {
      var lines = ["Candidate well review — WellFi", ""];
      summaryLines().forEach(function (row) { lines.push(row.label + ": " + row.value); });
      lines.push("");
      lines.push("Self-check result: " + (
        result.fit === "strong" ? "Strong fit" :
        result.fit === "review" ? "Likely fit — worth a review" :
        "Above 150 °C — waiting on the high-temperature version"
      ));
      result.flags.forEach(function (f) { if (QUALIFIER_NOTES[f]) lines.push("- " + QUALIFIER_NOTES[f]); });
      lines.push("");
      lines.push("Sent from yotinenergy.com");
      return lines.join("\n");
    }

    function renderVerdict() {
      var result = assess();
      clear(stage);

      var wrap = el("div", "qualifier-verdict");
      wrap.setAttribute("data-fit", result.fit);
      wrap.setAttribute("role", "status");

      var badge = el("p", "qualifier-badge");
      var headline;
      var detail;

      var ctaLabel = "Send this to Yotin";

      if (result.fit === "strong") {
        badge.appendChild(icon("ph-check-circle"));
        badge.appendChild(el("span", null, "Strong fit"));
        headline = "This well looks like a straightforward deployment.";
        detail = "Everything you entered sits inside WellFi's operating envelope. The next step is confirming tubing configuration and what data you want out of it.";
      } else if (result.fit === "review") {
        badge.appendChild(icon("ph-magnifying-glass"));
        badge.appendChild(el("span", null, "Likely fit — worth a review"));
        headline = "Probably workable, with a couple of things to confirm.";
        detail = "Nothing you entered rules it out. These are the points our team would want to walk through before committing to a deployment date.";
      } else {
        badge.appendChild(icon("ph-wrench"));
        badge.appendChild(el("span", null, "High-temp version in development"));
        headline = "Above 150 °C — that build is in progress.";
        detail = "WellFi is rated to 150 °C today, and a higher-temperature version is in development. Send this well through and we will come back to you when it is ready, rather than you starting from scratch later.";
        ctaLabel = "Have Yotin follow up";
      }

      wrap.appendChild(badge);
      wrap.appendChild(el("p", "qualifier-headline", headline));
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

      var summary = el("dl", "qualifier-summary");
      summaryLines().forEach(function (row) {
        var line = el("div");
        line.appendChild(el("dt", null, row.label));
        line.appendChild(el("dd", null, row.value));
        summary.appendChild(line);
      });
      wrap.appendChild(summary);

      var body = plainSummary(result);
      var actions = el("div", "qualifier-actions");

      var send = el("a", "button button-primary");
      // Distinct subject so the team can triage the waitlist separately.
      var subject = result.fit === "future"
        ? "Candidate well — awaiting 150 °C+ WellFi"
        : "Candidate well review — WellFi";
      send.href = "mailto:" + QUALIFIER_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      send.appendChild(el("span", null, ctaLabel));
      send.appendChild(icon("ph-arrow-right"));
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
        answers = {};
        index = 0;
        renderStep();
      });
      wrap.appendChild(restart);

      stage.appendChild(wrap);
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
  var CHATFI_ERROR = "ChatFi can’t connect from this site yet. Email info@yotinenergy.com and the team will help directly.";

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
