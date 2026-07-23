# Design QA - Yotin canopy hero

## Outcome

- No actionable P0, P1, or P2 differences remain after the final comparison pass.
- The selected Option 3 direction is implemented: a persistent Yotin canopy above a distinct, full-bleed WellFi hero.
- The real 12-second WellFi H.264 export and existing Yotin brand assets are used. No product or brand assets were recreated in CSS.

## Comparison target

- Source visual: `C:\Users\kyle\.codex\generated_images\019f8174-46b6-7ba0-9099-0f377f3cb2f6\exec-32f75174-16d3-48ac-aca2-1435aec9d1b9.png`
- Browser implementation: `C:\Users\kyle\.codex\visualizations\2026\07\20\019f8174-46b6-7ba0-9099-0f377f3cb2f6\yotin-option-3-desktop-final-verified.jpg`
- Mobile implementation: `C:\Users\kyle\.codex\visualizations\2026\07\20\019f8174-46b6-7ba0-9099-0f377f3cb2f6\yotin-option-3-mobile-390-final-verified.jpg`
- Full normalized comparison: `C:\Users\kyle\.codex\visualizations\2026\07\20\019f8174-46b6-7ba0-9099-0f377f3cb2f6\yotin-option-3-qa-final-side-by-side.jpg`
- Focused brand/content comparison: `C:\Users\kyle\.codex\visualizations\2026\07\20\019f8174-46b6-7ba0-9099-0f377f3cb2f6\yotin-option-3-qa-final-focus-left.jpg`
- Desktop viewport: 1487 x 1058 CSS pixels.
- Mobile viewport: 390 x 844 CSS pixels.
- State: top of the landing page; animated video active; mobile menu closed.

## Required fidelity surfaces

- Fonts: Space Grotesk for the WellFi hero, Archivo for the Yotin brand, and IBM Plex Mono for telemetry labels and controls.
- Layout: 130 px desktop canopy, lower-left hero copy, full-bleed cutaway, proof chips, and rectangular CTAs match the selected direction.
- Brand: Yotin remains the master identity through the persistent icon, wordmark, Indigenous company tagline, and orange/cyan palette.
- Copy: `WELLFI`, `Know the Unknown.`, all three proof chips, and both hero actions match the selected composition.
- Assets: `assets/yotin-icon.png`, `assets/wellfi-island-live.webp`, and `assets/wellfi-island-hero-12s.mp4` are used directly.
- Structure: one H1, no horizontal overflow, and no sand-control marketing copy in the public page.

## Visible findings

- [P3] The selected mock uses a multicolour one-pixel canopy divider. The implementation uses a solid telemetry-cyan divider to remain consistent with the existing site tokens.
- [P3] The implementation is a live 12-second video. Scene brightness and telemetry state vary by frame, so a still comparison will not always match the selected poster frame exactly.

## Comparison history

1. [P1] The previous split hero made WellFi feel like one card inside the Yotin page. Fixed by adding the canopy and expanding the real WellFi scene across the full hero.
2. [P2] Copy, chips, CTAs, and scene geometry were smaller and lower than the selected direction. Fixed by matching the desktop measurements and headline scale.
3. [P2] The Yotin wordmark and Indigenous tagline widths drifted from the selected direction. Fixed with desktop-only optical scaling while preserving mobile proportions.
4. Final comparison: no actionable P0, P1, or P2 mismatch remains.

## Responsive and interaction evidence

- Desktop: 1487 x 1058, no horizontal overflow, 86.27 px computed headline, video ready state 4, 12-second duration.
- Mobile: 390 x 844, no horizontal overflow, mobile brand/tagline visible, buttons stacked, cutaway crop readable.
- Mobile menu: opens with `aria-expanded=true`, exposes navigation, closes with `aria-expanded=false`, and restores the hidden state.
- Explore WellFi: unique hero link navigates to the WellFi section.
- Header brand: returns to the top state.
- ChatFi: opens from the hero, exposes the dialog, closes, and restores the page state.
- Fresh desktop and mobile browser console errors: none.
- Source checks: JavaScript syntax, whitespace, page delivery, video delivery/MIME, one-H1 structure, and content-scope checks pass.

## Existing production handoff - unchanged

- GitHub-to-Vercel deployment was previously verified for `Bushels/YotinWeb` on `master`.
- Production ChatFi CORS was previously verified for the Yotin, Vercel, MPS, and localhost QA origins.
- The separate public-identity decision remains open: approve how ChatFi describes the Yotin / MPS / WellFi relationship and where leads should route.
- Porkbun DNS remains an external handoff. Preserve the existing mail MX/SPF records when replacing only the apex and `www` parking records, then verify TLS, both hostnames, responsive rendering, and a live ChatFi exchange on the `.com` domain.

final result: passed

---

# Design QA - WellFi intermediate-casing correction

## Outcome

- No actionable P0, P1, or P2 differences remain after the corrected geometry and load-performance pass.
- The WellFi tool now reads as installed in the middle of the visible intermediate-casing run, before the J-build turns toward the horizontal section.
- The poster is available for first paint and the animation starts during browser idle time; the hero no longer waits on a delayed entrance animation.

## Comparison target

- Source visual truth: `C:\Users\kyle\AppData\Local\Temp\codex-clipboard-b3585d3f-9871-4777-9e99-a3108b33d7a4.png`
- Earlier source-state capture at casing parameter 0.50: `C:\Users\kyle\.codex\visualizations\2026\07\20\019f8174-46b6-7ba0-9099-0f377f3cb2f6\marketing-param050-before.jpg`
- Corrected source-state capture at casing parameter 0.34: `C:\Users\kyle\.codex\visualizations\2026\07\20\019f8174-46b6-7ba0-9099-0f377f3cb2f6\marketing-param034-after.jpg`
- Browser first-paint implementation: `C:\Users\kyle\.codex\visualizations\2026\07\20\019f8174-46b6-7ba0-9099-0f377f3cb2f6\yotin-mid-casing-first-paint-final.jpg`
- Browser playing-state implementation: `C:\Users\kyle\.codex\visualizations\2026\07\20\019f8174-46b6-7ba0-9099-0f377f3cb2f6\yotin-mid-casing-playing-final.jpg`
- Full normalized before/after comparison: `C:\Users\kyle\.codex\visualizations\2026\07\20\019f8174-46b6-7ba0-9099-0f377f3cb2f6\wellfi-hero-before-after.png`
- Mobile implementation: `C:\Users\kyle\.codex\visualizations\2026\07\20\019f8174-46b6-7ba0-9099-0f377f3cb2f6\yotin-mobile-hero-final.jpg`
- Mobile-menu implementation: `C:\Users\kyle\.codex\visualizations\2026\07\20\019f8174-46b6-7ba0-9099-0f377f3cb2f6\yotin-mobile-menu-final.jpg`
- Desktop CSS viewport: 1603 x 745 at device scale factor 1.
- Source pixels: 1602 x 745. Implementation pixels: 1588 x 738 because the in-app browser capture excludes its scrollbars.
- Normalization: both desktop inputs were proportionally scaled and padded to 1602 x 745 before horizontal comparison; combined comparison is 3204 x 745.
- Mobile CSS viewport: 390 x 844 at device scale factor 1.
- State: landing-page hero, animation playing, navigation closed unless the menu capture is named.

## Required fidelity surfaces

- Fonts and typography: existing Archivo, Space Grotesk, and IBM Plex Mono hierarchy is unchanged; headline wrapping, proof-chip letter spacing, and CTA weights remain readable at desktop and mobile widths.
- Spacing and layout rhythm: Yotin canopy, left-copy column, proof chips, and CTA alignment remain unchanged. The corrected scene keeps the product clear of the headline and places it within the intermediate-casing run.
- Colors and tokens: existing Yotin orange and telemetry cyan remain unchanged. Poster-to-video transition retains the same dark scene treatment and contrast.
- Image quality and asset fidelity: the canonical WellFi scene export is used directly. The 24 fps H.264 MP4 is 540,624 bytes and the WebP poster is 44,768 bytes; no CSS or SVG substitute is used.
- Copy and content: public copy is unchanged except the scene accessibility label now accurately describes the middle-of-intermediate placement.
- Responsiveness: no horizontal overflow at 1603 x 745 or 390 x 844. Mobile crop keeps the tool, well pad, strata, headline, chips, and both actions legible.
- Accessibility and behavior: navigation exposes `aria-expanded`; ChatFi opens as a dialog, locks page scrolling, closes, and restores the page. The hero remains visible before animation playback.

## Findings and comparison history

1. [P1] The supplied production capture showed WellFi at the end of the intermediate casing, visually at the casing shoe. The matching source capture at casing parameter 0.50 confirmed the geometry issue.
2. Fix: changed the canonical below-pump casing parameter from 0.50 to 0.34, rebuilt the poster and MP4, and replaced the Yotin hero assets.
3. Post-fix evidence: the corrected source capture and browser implementation both place the tool in the vertical intermediate run, before the casing turns toward horizontal.
4. [P2] The previous hero eagerly autoloaded the MP4 and waited for deferred GSAP/ScrollTrigger code to apply and then reverse an entrance state after window load.
5. Fix: removed the hero entrance dependency, retained an immediately visible poster, deferred video preload/play until idle time, reduced the video from 30 fps to 24 fps, and removed 117,502 bytes of third-party animation JavaScript.
6. Post-fix evidence: first-paint capture shows the complete hero immediately; playing-state capture retains full opacity and identity transforms.
7. Final comparison: no actionable P0, P1, or P2 finding remains.

## Focused-region evidence

- A separate focused crop was not required. At the normalized desktop size, the WellFi tool, its label, the intermediate-casing boundary, and the casing turn are all directly readable in the full comparison.

## Responsive and interaction evidence

- Desktop: complete hero visible immediately, one H1, no horizontal overflow, no GSAP scripts, and video playback reaches ready state 4.
- Mobile: 390 x 844, no horizontal overflow, tool remains visible in the intermediate-casing run, and CTA stack remains usable.
- Mobile menu: opens with `aria-expanded=true`, exposes all navigation actions, and closes with `aria-expanded=false`.
- ChatFi: dialog opens, page scrolling locks, close control works, and the closed state is restored.
- Fresh mobile browser console errors: none.

final result: passed
