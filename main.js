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
     GSAP is an enhancement, never a dependency. `motion-ready` (set by the
     inline head script) is what hides elements; if GSAP fails to arrive we
     drop that class and the page is simply static and fully visible.
     ====================================================================== */

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

  function buildCounters(gsap) {
    document.querySelectorAll("[data-count]").forEach(function (node) {
      var target = parseFloat(node.getAttribute("data-count"));
      if (!isFinite(target)) return;
      var state = { v: 0 };
      gsap.to(state, {
        v: target,
        duration: 1.4,
        ease: "power1.inOut",
        scrollTrigger: { trigger: node, start: "top 88%", once: true },
        onStart: function () { node.textContent = formatCount(0, node); },
        onUpdate: function () { node.textContent = formatCount(state.v, node); },
        onComplete: function () { node.textContent = formatCount(target, node); }
      });
    });
  }

  /* --- hero load-in ------------------------------------------------------ */

  function buildHeroIntro(gsap) {
    var steps = document.querySelectorAll("[data-hero-step]");
    if (!steps.length) return;
    gsap.to(steps, {
      opacity: 1,
      y: 0,
      duration: 0.75,
      ease: "power2.out",
      stagger: 0.11,
      delay: 0.12,
      clearProps: "transform"
    });
  }

  /* --- generic reveal ---------------------------------------------------- */

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

  // Six benefits surface one at a time across this window, each fading in and
  // back out inside its own slot.
  function benefitViz(p, i, n) {
    var start = 0.12;
    var end = 0.66;
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

    // The pinned treatment needs room, a pointer, and a real viewport. Touch
    // and narrow screens keep the static grid, which is the same content.
    var eligible = !reduceMotion &&
      window.matchMedia("(pointer: fine)").matches &&
      window.innerWidth >= 900 &&
      window.innerHeight >= 560;
    if (!eligible) return;

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
       The fallback content stays in the DOM but is taken out of the visual
       and accessibility trees, so the benefits are still announced once and
       only once — by the pinned cards. */
    fallback.hidden = true;
    section.appendChild(sticky);
    section.style.height = "380vh";

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
        drillPath.setAttribute("stroke-dashoffset", String(1 - seg(p, 0.05, 0.50)));
        // The opening line clears as the first benefit arrives.
        intro.style.opacity = String(1 - seg(p, 0.03, 0.12));

        var active = -1;
        cards.forEach(function (card, i) {
          var v = benefitViz(p, i, cards.length);
          card.style.opacity = String(v);
          card.style.transform = "translate(-50%, " + ((1 - v) * 14).toFixed(1) + "px)";
          if (v > 0.5) active = i;
        });
        // Past the last benefit the cards are all cleared, but the progress
        // track should read "complete" rather than snapping back to empty.
        if (p >= 0.66) active = cards.length - 1;

        if (active !== lastDot) {
          dots.forEach(function (dot, i) { dot.classList.toggle("is-on", i <= active); });
          lastDot = active;
        }

        // Once the casing is set, the EM transmission blooms at the toe.
        glow.style.opacity = String(seg(p, 0.52, 0.74));
        // Finale: the telemetry signal climbs back to surface.
        signalPath.setAttribute("stroke-dashoffset", String(1 - seg(p, 0.66, 0.92)));
      }
    });
  }

  /* --- device banner parallax -------------------------------------------- */

  function buildDeviceParallax(gsap) {
    var img = document.querySelector("[data-device-img]");
    if (!img) return;
    gsap.to(img, {
      y: -20,
      ease: "none",
      scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: true }
    });
  }

  /* --- boot -------------------------------------------------------------- */

  function startMotion() {
    var gsap = window.gsap;
    if (!gsap || !window.ScrollTrigger) {
      abandonMotion();
      return;
    }
    gsap.registerPlugin(window.ScrollTrigger);

    buildHeroIntro(gsap);
    buildReveals(gsap);
    buildChannels(gsap);
    buildCounters(gsap);
    buildDeviceParallax(gsap);
    buildDrill(gsap);

    window.ScrollTrigger.refresh();
  }

  if (root.classList.contains("motion-ready")) {
    loadScript(GSAP_SRC, GSAP_SRI)
      .then(function () { return loadScript(ST_SRC, ST_SRI); })
      .then(startMotion)
      .catch(function (error) {
        console.warn("Motion layer unavailable; falling back to static page.", error);
        abandonMotion();
      });
  }

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
