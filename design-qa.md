# Design QA — Yotin Signal Atlas

**Findings**

- No actionable P0, P1, or P2 differences remain.
- [P3] The source uses more decorative signal diagrams and leader lines in the three-step strip. The implementation uses pinned Phosphor icons and the same cyan/orange signal language. This is an intentional simplification that preserves the hierarchy without fabricating bespoke graphic assets.
- [P3] The implementation includes `Our Company` and `Contact` in the desktop header. The source only showed `WellFi`; the additional links are intentional because the finished one-page site has real company and conversion sections.

**Comparison target**

- Source visual truth: `C:\Users\kyle\.codex\generated_images\019f7255-ca15-7fb1-be98-c0e4b4219ad2\exec-7ce0a539-36b5-4d33-874a-39d9eeeb4459.png`
- Browser-rendered implementation: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\11-desktop-final.png`
- Normalized full-view comparison: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\12-reference-vs-final.png`
- Viewport: 1536 × 1080 CSS pixels.
- State: desktop landing page at the top of `/`, dark theme, motion sequence settled.

**Required fidelity surfaces**

- Fonts and typography: Archivo reproduces the compact industrial display weight; IBM Plex Sans and Mono cover body and telemetry text. The final hero keeps the reference's two-line headline, tight display tracking, and oversized Yotin hierarchy with no desktop truncation.
- Spacing and layout rhythm: the final 1536 × 1080 capture matches the reference's two-column hero, hero/strip boundary, compact CTA row, and three equal signal steps. Mobile spacing was separately checked at 390 × 844.
- Colors and visual tokens: near-black/navy, warm white, telemetry cyan, and action orange map consistently to shared CSS variables. Contrast remained readable in dark and paper sections.
- Image quality and asset fidelity: the real Yotin mark and existing 1920 × 1080 WellFi cutaway are used. The cutaway retains its aspect ratio, sharpness, and black-field integration; no logo, illustration, or product image was recreated with CSS or inline SVG.
- Copy and content: the public page is limited to WellFi, Yotin's Indigenous company identity, and the candidate-well contact path. Sand-control, flow-control, slotted-liner, and multilateral marketing copy is absent.

**Focused-region evidence**

No separate crop was needed. The normalized 3072 × 1080 side-by-side comparison preserves the brand lockup, headline wrapping, telemetry labels, CTA styling, cutaway crop, and signal-strip typography at readable resolution. Mobile menu, ChatFi, and each content section were inspected in dedicated captures.

**Responsive and interaction evidence**

- Mobile hero: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\13-mobile-hero.png`
- Mobile menu: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\14-mobile-menu.png`
- ChatFi open: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\15-mobile-chat-open.png`
- ChatFi live reply: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\16-mobile-chat-live.png`
- Mobile WellFi: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\17-mobile-wellfi.png`
- Mobile company: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\18-mobile-company.png`
- Mobile contact: `C:\Users\kyle\.codex\visualizations\2026\07\17\019f7255-ca15-7fb1-be98-c0e4b4219ad2\yotin-build\19-mobile-contact.png`
- Primary interactions tested: mobile menu open; ChatFi opened from the mobile menu; live question submitted from the allowed `localhost` origin; answer received; panel closed; focus returned to the launcher.
- Console errors checked: none.

**Comparison history**

1. P1 — cached legacy CSS made the first rewritten page appear largely unstyled. Fix: versioned the stylesheet and script URLs. Post-fix evidence: `02-desktop-refreshed.png` followed by the corrected desktop captures.
2. P1 — the cutaway kept its HTML height while CSS changed only its width, stretching the grid to 1080 px and pushing the signal strip below the intended fold. Fix: set the image height to auto and normalized the hero shell/grid. Post-fix evidence: `05-desktop-corrected.png`.
3. P2 — the headline wrapped to three lines and the cutaway scale/crop was smaller and lower than the source. Fix: removed the extra hero paragraph, tuned display size, widened the cutaway, removed its base vertical offset, and enlarged/repositioned the Yotin lockup. Post-fix evidence: `11-desktop-final.png` and `12-reference-vs-final.png`.

**Open questions**

- Production ChatFi remains a release gate, not a design-QA failure: the live server still identifies and routes leads through MPS and does not allow Yotin's production origins. The UI and local request path pass.
- Confirm the public Yotin / MPS / WellFi relationship sentence and lead destination before the backend identity and CORS allowlist are changed.

**Implementation checklist**

- [x] Match the selected Signal Atlas desktop direction.
- [x] Verify the focused WellFi/Indigenous content scope.
- [x] Verify mobile hero, menu, WellFi, company, contact, and ChatFi states.
- [x] Exercise a live ChatFi answer on `http://localhost:5050/`.
- [x] Check focus return and browser console.
- [ ] Complete the separately gated production ChatFi identity/CORS change after relationship approval.

final result: passed
