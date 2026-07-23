# Yotin WellFi Live R3F Hero — Design QA

## Evidence

- Source visual truth: `C:\Users\kyle\.codex\visualizations\2026\07\23\wellfi-motion-audit\01-mps-r3f-original.png`
- Rendered implementation: `C:\Users\kyle\.codex\visualizations\2026\07\20\019f8174-46b6-7ba0-9099-0f377f3cb2f6\yotin-r3f-matched-phase.png`
- Side-by-side comparison: `C:\Users\kyle\.codex\visualizations\2026\07\20\019f8174-46b6-7ba0-9099-0f377f3cb2f6\yotin-r3f-matched-comparison.png`
- Responsive evidence: `C:\Users\kyle\.codex\visualizations\2026\07\20\019f8174-46b6-7ba0-9099-0f377f3cb2f6\yotin-r3f-responsive-audit\01-1600.png` through `04-520.png`
- Source pixels: 1280 × 720
- Implementation pixels: 1265 × 712
- Comparison normalization: implementation scaled to 1280 × 720 beside the 1280 × 720 source; device scale factor 1
- CSS viewport: 1280 × 720
- State: dark relay/readout beat with the WellFi tool visible on the lower intermediate casing
- Route: `http://127.0.0.1:5050/` loading the canonical local R3F surface from `http://127.0.0.1:3001/wellfi/animation`

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: the Yotin display, body, and mono treatments are unchanged. The live scene does not replace or redraw any Yotin typography.
- Spacing and layout rhythm: the established Yotin copy column, proof chips, and actions remain in place. The larger Yotin crop is intentional; the canonical island is positioned behind the existing branded composition rather than replacing it.
- Colors and tokens: the Yotin cyan/orange/void palette is unchanged. The embedded scene uses the canonical WellFi lighting, cyan production flow, red transmitting tool, and readout colors.
- Image quality and asset fidelity: the final hero uses the canonical live WebGL/R3F scene. It no longer enlarges a 1280 × 720, low-bitrate, double-speed recording. The existing local poster remains the immediate-paint and failure fallback.
- Copy and content: hero copy, proof claims, CTAs, telemetry values, and accessible description are unchanged.
- Accessibility and behavior: reduced-motion and Save-Data users retain the static poster; the decorative iframe is removed from the accessibility tree; the existing visual label and screen-reader telemetry summary remain. The live frame pauses through the parent/child activity message when the hero or tab is not visible.
- Responsiveness: browser-rendered checks at 1600, 1280, 820, and 520 px preserve the intended scene crop, tool visibility, copy hierarchy, CTAs, and mobile navigation without overlap or horizontal overflow.
- Interactions: `Explore WellFi` navigated to `#wellfi`; the hero `Ask ChatFi` control opened the labelled ChatFi dialog and the close control restored the closed state.
- Console: no browser errors or warnings were present in the Yotin page or canonical animation surface during the final rendered check.

## Full-view Comparison

The combined comparison confirms the same island geometry, forest, strata, intermediate-casing tool position, telemetry readout, lighting state, and production-flow paths. The only major composition difference is intentional: Yotin retains its own header, copy, proof, and CTA canopy while cropping the same scene larger behind that content.

## Focused-region Comparison

A separate crop was not required. At 1280 × 720, the matched-state full view keeps the important fidelity region—surface readout, lower intermediate-casing WellFi, and illuminated lateral flow—large enough to judge directly. The R3F source is shared rather than visually approximated.

## Comparison History

1. Initial implementation — blocked:
   - P1: Yotin used a 24 fps, low-bitrate MP4 encoded at 2× scene speed, so the motion felt rushed and less fluid than the MPS source.
   - P2: playback was deferred behind an idle callback with a timeout of up to 1200 ms, creating a noticeable load pause.
2. Architecture fix:
   - Replaced the recording with the canonical live R3F animation surface.
   - Kept poster-first paint, added renderer-ready crossfade, GPU-tier behavior, reduced-motion/Save-Data fallback, and offscreen/tab frame-loop pausing.
   - Removed ChatFi and Google Identity work from the animation-only route.
3. Cache-handoff fix:
   - The first local pass exposed a stale stylesheet because the public cache key had not changed.
   - Bumped the Yotin stylesheet and script versions to `20260723-3`, then reloaded and re-captured.
4. Final pass:
   - Removed iframe-load readiness; only the origin-validated renderer message can reveal the live frame.
   - Replaced the Yotin fallback still with the canonical R3F poster and delayed the ready signal until the child poster-to-canvas fade completes.
   - Capped the embedded canvas at 1.35 DPR, reducing its maximum framebuffer workload below the original full-viewport MPS hero.
   - Matched-state side-by-side comparison showed no remaining P0/P1/P2 visual mismatch.
   - Primary CTA and ChatFi open/close behavior passed.
   - Both browser consoles were clean.

## Final Result

final result: passed
