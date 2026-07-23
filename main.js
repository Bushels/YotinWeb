/* Yotin Energy — progressive interaction layer. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /*
   * The poster paints first. The canonical live R3F scene then loads from the
   * WellFi site and cross-fades only after its renderer reports a real frame.
   */
  var heroScene = document.querySelector("[data-wellfi-live]");
  var liveFrame = null;
  var liveOrigin = "";
  var liveInView = true;
  var liveReady = false;
  var liveTimeout = 0;
  var liveObserver = null;

  function sendLiveActivity() {
    if (!liveFrame || !liveFrame.contentWindow || !liveOrigin) return;
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

  /* ChatFi */
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
      smoothScroll: !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    };
    chat.errorMessages = {
      displayServiceErrorMessages: false,
      overrides: { default: CHATFI_ERROR, service: CHATFI_ERROR }
    };
    chat.inputAreaStyle = {
      backgroundColor: "#09131b",
      borderTop: "1px solid rgba(255, 255, 255, 0.12)",
      padding: "12px 14px 14px"
    };
    chat.textInput = {
      characterLimit: 4000,
      placeholder: { text: "Ask about WellFi…", style: { color: "#718087" } },
      styles: {
        text: { color: "#f3f6f7", fontSize: "14px", lineHeight: "1.45" },
        container: {
          minHeight: "48px",
          maxHeight: "130px",
          backgroundColor: "#03070b",
          border: "1px solid rgba(255, 255, 255, 0.16)",
          borderRadius: "14px"
        },
        focus: { border: "1px solid #68c8dc", boxShadow: "0 0 0 3px rgba(104, 200, 220, 0.12)" }
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
        ai: { bubble: { backgroundColor: "#132631", borderBottomLeftRadius: "4px" } },
        user: { bubble: { backgroundColor: "#e47d3d", color: "#03070b", borderBottomRightRadius: "4px" } }
      },
      intro: { bubble: { backgroundColor: "#132631", color: "#dfe6e9", borderBottomLeftRadius: "4px" } },
      error: { bubble: { backgroundColor: "#391a17", color: "#ffd7cf" } },
      loading: {
        message: { styles: { bubble: { backgroundColor: "#132631", color: "#8c9ba2" } } }
      }
    };
    chat.submitButtonStyles = {
      submit: {
        container: {
          default: { width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "#68c8dc" },
          hover: { backgroundColor: "#8bd7e6" },
          click: { backgroundColor: "#4fb5c9" }
        },
        svg: { styles: { default: { filter: "brightness(0) saturate(100%)" } } }
      },
      stop: { container: { default: { backgroundColor: "#e47d3d" } } },
      position: "inside-end",
      tooltip: { text: "Send message" }
    };
    chat.auxiliaryStyle = "a { color: #68c8dc; } ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-thumb { background: #203846; border-radius: 999px; }";

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
