# Design QA — Yotin Signal Atlas

**Findings**

- No actionable P0, P1, or P2 differences remain.
- The July 18 follow-up restores the prior continuous downhole signal behavior and reduces the hero headline without changing the approved WellFi/Indigenous composition.
- The July 18 ChatFi follow-up replaces the native chat surface with integrity-pinned Deep Chat 2.4.2 while retaining the existing Cloud Run request contract. Browser QA found and fixed the initial loader failure: the ESM bundle had been inserted as a classic script, so the browser stopped at its final `export` statement. The loader now declares `type="module"` and automatically falls back from jsDelivr to unpkg. Fresh-tab desktop and mobile exchanges pass with no console errors.
- The July 19 WellFi merge restores the locked `Know the Unknown` hierarchy, the approved proof chips, `Data Below. Insight Above.`, and `Know the Unknown — One Changeout Away.` The decorative CSS signal loops were replaced with the original verified 12-second WellFi island export, including the surface readout for pressure, temperature, and vibration. The 947 KB H.264 asset is hash-identical to the original WellFi export and keeps the existing 84 KB poster as its first-paint, reduced-motion, and autoplay fallback.
- [P3] The source uses more decorative signal diagrams and leader lines in the three-step strip. The implementation uses pinned Phosphor icons and the same cyan/orange signal language. This is an intentional simplification that preserves the hierarchy without fabricating bespoke graphic assets.
- [P3] The implementation includes `Our Company` and `Contact` in the desktop header. The source only showed `WellFi`; the additional links are intentional because the finished one-page site has real company and conversion sections.

**Comparison target**

- Static composition truth: `C:\Users\kyle\.codex\generated_images\019f7255-ca15-7fb1-be98-c0e4b4219ad2\exec-7ce0a539-36b5-4d33-874a-39d9eeeb4459.png`
- Motion truth: the continuous uplink and radiating downhole pulse in baseline commit `4968977` (`index.html` and `styles.css`).
- Pre-change browser capture: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\20-hero-before-animation-return.png`
- Browser-rendered implementation: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\22-hero-motion-frame-b.png`
- Normalized full-view comparison: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\23-before-vs-restored.png`
- Normalized motion-state comparison: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\24-motion-frame-comparison.png`
- Viewport: 1536 × 1080 CSS pixels.
- State: desktop landing page at the top of `/`, dark theme, entrance sequence settled, continuous signal animation active.

**Required fidelity surfaces**

- Fonts and typography: Archivo reproduces the compact industrial display weight; IBM Plex Sans and Mono cover body and telemetry text. The hero headline is now 56 px at 1536 px wide instead of 64 px, remains two lines, and scales to approximately 41 px at 390 px without truncation. The oversized Yotin lockup remains unchanged.
- Spacing and layout rhythm: the final 1536 × 1080 capture matches the reference's two-column hero, hero/strip boundary, compact CTA row, and three equal signal steps. Mobile spacing was separately checked at 390 × 844.
- Colors and visual tokens: near-black/navy, warm white, telemetry cyan, and action orange map consistently to shared CSS variables. Contrast remained readable in dark and paper sections.
- Image quality and asset fidelity: the real Yotin mark and existing 1920 × 1080 WellFi cutaway are used. The cutaway retains its aspect ratio, sharpness, and black-field integration; no logo, illustration, or product image was recreated with CSS or inline SVG.
- Copy and content: the public page is limited to WellFi, Yotin's Indigenous company identity, and the candidate-well contact path. Sand-control, flow-control, slotted-liner, and multilateral marketing copy is absent.

**Focused-region evidence**

No separate crop was needed. The normalized 3072 × 1080 side-by-side comparison preserves the brand lockup, headline wrapping, telemetry labels, CTA styling, cutaway crop, and signal-strip typography at readable resolution. Mobile menu, ChatFi, and each content section were inspected in dedicated captures.

**Responsive and interaction evidence**

- Mobile hero: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\13-mobile-hero.png`
- Mobile menu: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\14-mobile-menu.png`
- ChatFi open, native interface before Deep Chat: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\15-mobile-chat-open.png`
- ChatFi live reply, native interface before Deep Chat: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\16-mobile-chat-live.png`
- Mobile WellFi: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\17-mobile-wellfi.png`
- Mobile company: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\18-mobile-company.png`
- Mobile contact: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\19-mobile-contact.png`
- Mobile animated hero at 390 × 844: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\25-mobile-hero-motion.png`
- Tablet animated hero at 834 × 1112: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\26-tablet-hero-motion.png`
- Primary interactions retested with Deep Chat 2.4.2: mobile menu open; ChatFi opened from the mobile menu; live questions submitted from the allowed `localhost` origin; streamed answers received; panel closed; focus returned to the launcher.
- Responsive Deep Chat geometry passed at 390 × 844 and 320 × 568. The page had no horizontal overflow; the 390 px chat panel stayed within 8 px side/bottom insets, and the 320 px panel fit within a 304 × 552 px box while keeping its header, message body, input, close control, and disclosure visible.
- Console errors checked in a new tab after the loader fix: none.
- Motion verification: the uplink dash offset changed from `-42.494px` to `-78.7415px` over 900 ms; the pulse ring transform and opacity changed at the same time, proving that both continuous animation channels were running.

**Comparison history**

1. P1 — cached legacy CSS made the first rewritten page appear largely unstyled. Fix: versioned the stylesheet and script URLs. Post-fix evidence: `02-desktop-refreshed.png` followed by the corrected desktop captures.
2. P1 — the cutaway kept its HTML height while CSS changed only its width, stretching the grid to 1080 px and pushing the signal strip below the intended fold. Fix: set the image height to auto and normalized the hero shell/grid. Post-fix evidence: `05-desktop-corrected.png`.
3. P2 — the headline wrapped to three lines and the cutaway scale/crop was smaller and lower than the source. Fix: removed the extra hero paragraph, tuned display size, widened the cutaway, removed its base vertical offset, and enlarged/repositioned the Yotin lockup. Post-fix evidence: `11-desktop-final.png` and `12-reference-vs-final.png`.
4. P2 — the redesigned hero kept its entrance and scroll motion but lost the baseline's continuous downhole pulse/uplink behavior; the 64 px headline also carried more weight than requested. Fix: restored the baseline signal path and radiating tool-node cycle, kept it attached to the real WellFi image at every breakpoint, and reduced the headline to a 42–56 px responsive range. Post-fix evidence: `21-hero-motion-frame-a.png`, `22-hero-motion-frame-b.png`, `23-before-vs-restored.png`, `25-mobile-hero-motion.png`, and `26-tablet-hero-motion.png`.
5. P1 — Deep Chat displayed the contact fallback because its ESM bundle was loaded as a classic script. Fix: load the pinned bundle as a module, retain SRI, and add an automatic second CDN source. Post-fix evidence: successful fresh-tab desktop and 390 px mobile responses with an empty error/warning console.
6. P1 — the Yotin adaptation had drifted from WellFi's strongest approved positioning and replaced the original relay story with independent decorative loops. Fix: restore the approved slogans and use the original poster-first 12-second H.264 export instead of importing the full R3F runtime. Source, asset hash, HTTP 200 delivery, `video/mp4` MIME type, one-H1 structure, and no-sand-control scope pass. Final browser recapture is pending because the in-app browser remained on its earlier connection-refused interstitial after the local server restarted.

**Open questions**

- Production ChatFi remains a release gate, not a design-QA failure: the live server still identifies and routes leads through MPS and does not allow Yotin's production origins. The UI and local request path pass.
- Confirm the public Yotin / MPS / WellFi relationship sentence and lead destination before the backend identity and CORS allowlist are changed.

**Implementation checklist**

- [x] Match the selected Signal Atlas desktop direction.
- [x] Verify the focused WellFi/Indigenous content scope.
- [x] Verify mobile hero, menu, WellFi, company, contact, and Deep Chat states.
- [x] Revalidate a live ChatFi answer from the allowed `http://localhost:5050/` origin after the Deep Chat integration.
- [x] Check Deep Chat focus return, 390/320 px geometry, and a fresh browser console.
- [x] Replace the historical native-interface functional checks with live Deep Chat desktop/mobile interaction evidence.
- [ ] Recapture the July 19 animated hero at desktop, 390 px mobile, and the dark surface-readout frame after the in-app browser interstitial is manually reloaded.
- [ ] Complete the separately gated production ChatFi identity/CORS change after relationship approval.

final result: prior responsive site and ChatFi gates passed; July 19 WellFi merge is source/asset validated and awaits its final browser recapture; production identity/CORS remains the release gate
