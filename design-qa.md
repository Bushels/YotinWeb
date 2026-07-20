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
