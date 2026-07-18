/* Yotin Energy — progressive interaction layer. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header and navigation */
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

  /* GSAP enhancement — the content remains fully usable if the CDN is unavailable. */
  function initMotion() {
    if (reduceMotion || !window.gsap) return;
    var gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    var intro = gsap.timeline({ defaults: { ease: "power3.out" } });
    intro
      .from(".brand-lockup", { autoAlpha: 0, y: -18, duration: 0.75 })
      .from(".hero-message > *", { autoAlpha: 0, y: 24, duration: 0.62, stagger: 0.1 }, "-=0.35")
      .from(".hero-visual > img", { autoAlpha: 0, x: 58, scale: 0.98, duration: 1.05 }, "-=0.72")
      .from(".reading", { autoAlpha: 0, duration: 0.4, stagger: 0.12 }, "-=0.28")
      .from(".signal-step", { autoAlpha: 0, y: 22, duration: 0.5, stagger: 0.12 }, "-=0.12");

    if (!window.ScrollTrigger) return;
    [
      [".section-intro > *", ".wellfi-section"],
      [".journey-list li", ".journey-list"],
      [".spec-grid > div", ".spec-grid"],
      [".company-grid > *", ".company-section"],
      [".contact-grid > *", ".contact-section"]
    ].forEach(function (group) {
      gsap.from(group[0], {
        scrollTrigger: { trigger: group[1], start: "top 78%", once: true },
        autoAlpha: 0,
        y: 28,
        duration: 0.62,
        stagger: 0.09,
        ease: "power3.out"
      });
    });

    gsap.to(".hero-visual > img", {
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 },
      yPercent: 5,
      ease: "none"
    });
  }

  window.addEventListener("load", initMotion, { once: true });

  /* ChatFi */
  var panel = document.querySelector("[data-chatfi-panel]");
  var openButtons = Array.prototype.slice.call(document.querySelectorAll("[data-chatfi-open]"));
  var closeButton = document.querySelector("[data-chatfi-close]");
  var messagesEl = document.querySelector("[data-chatfi-messages]");
  var form = document.querySelector("[data-chatfi-form]");
  var input = document.querySelector("[data-chatfi-input]");
  var sendButton = document.querySelector("[data-chatfi-send]");
  var launcher = document.querySelector(".chatfi-launcher");
  var apiBase = (document.body.getAttribute("data-chatfi-api") || "").replace(/\/$/, "");
  var lastOpener = null;
  var activeController = null;
  var sending = false;
  var history = [];

  function appendMessage(role, content, status) {
    if (!messagesEl) return null;
    var message = document.createElement("div");
    message.className = "chatfi-message";
    message.setAttribute("data-role", role);
    if (status) message.setAttribute("data-status", status);
    message.textContent = content;
    messagesEl.appendChild(message);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return message;
  }

  function seedGreeting() {
    if (history.length) return;
    var greeting = "I’m ChatFi. Ask how WellFi works, what it reads, or whether it fits your wells.";
    history.push({ role: "assistant", content: greeting });
    appendMessage("assistant", greeting);
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
    seedGreeting();
    panel.hidden = false;
    document.body.classList.add("chatfi-open");
    if (launcher) launcher.hidden = true;
    updateVisualViewport();
    window.setTimeout(function () { if (input) input.focus(); }, 20);
  }

  function closeChat() {
    if (!panel) return;
    if (activeController) {
      activeController.abort();
      activeController = null;
    }
    sending = false;
    if (sendButton) sendButton.disabled = false;
    panel.hidden = true;
    document.body.classList.remove("chatfi-open");
    if (launcher) launcher.hidden = false;
    if (lastOpener && typeof lastOpener.focus === "function") lastOpener.focus();
  }

  function autoSizeInput() {
    if (!input) return;
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 130) + "px";
  }

  async function sendMessage(text) {
    var trimmed = text.trim();
    if (!trimmed || sending || !apiBase) return;

    sending = true;
    if (sendButton) sendButton.disabled = true;
    history.push({ role: "user", content: trimmed });
    if (history.length > 24) history = history.slice(history.length - 24);
    appendMessage("user", trimmed);
    if (input) {
      input.value = "";
      autoSizeInput();
    }

    var thinking = appendMessage("assistant", "Reading the signal…", "thinking");
    activeController = new AbortController();

    try {
      var response = await fetch(apiBase + "/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: activeController.signal
      });

      if (!response.ok) throw new Error("ChatFi returned " + response.status);
      if (!response.body) throw new Error("ChatFi response was empty");

      var reader = response.body.getReader();
      var decoder = new TextDecoder();
      var reply = "";
      thinking.removeAttribute("data-status");
      thinking.textContent = "";

      while (true) {
        var part = await reader.read();
        if (part.done) break;
        reply += decoder.decode(part.value, { stream: true });
        thinking.textContent = reply;
        if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
      }
      reply += decoder.decode();
      reply = reply.trim();
      if (!reply) throw new Error("ChatFi response contained no text");
      thinking.textContent = reply;
      history.push({ role: "assistant", content: reply });
    } catch (error) {
      if (error && error.name === "AbortError") {
        if (thinking && thinking.parentNode) thinking.parentNode.removeChild(thinking);
      } else {
        if (thinking) {
          thinking.setAttribute("data-status", "error");
          thinking.textContent = "ChatFi can’t connect from this site yet. Email info@yotinenergy.ca and the team will help directly.";
        }
      }
    } finally {
      activeController = null;
      sending = false;
      if (sendButton) sendButton.disabled = false;
      if (input && !panel.hidden) input.focus();
    }
  }

  openButtons.forEach(function (button) { button.addEventListener("click", openChat); });
  if (closeButton) closeButton.addEventListener("click", closeChat);
  if (input) input.addEventListener("input", autoSizeInput);

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (input) sendMessage(input.value);
    });
  }

  if (input) {
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (form && typeof form.requestSubmit === "function") form.requestSubmit();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (panel && !panel.hidden) closeChat();
      else if (navToggle && navToggle.getAttribute("aria-expanded") === "true") closeNav(true);
      return;
    }

    if (event.key !== "Tab" || !panel || panel.hidden) return;
    var focusable = Array.prototype.slice.call(panel.querySelectorAll("button:not([disabled]), textarea:not([disabled]), a[href]"));
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
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
