# Gemini 3.7 (Antigravity) mobile audit — 2026-08-21

Received from Kyle; audited at iPhone 17 Pro Max geometry (440×956 @3x) with its own capture
scripts (26 continuous-scroll frames + 12 interaction states). Overall score 7.4/10.
STATUS: **verified 2026-08-21 (round 17)** — two adversarial verifiers (browser reproduction at
440×956 with damped-camera settle + source analysis). **10 confirmed → fixed in round 17; 3
refuted.** Verdicts per finding are inline below; the full story is CHANGELOG Era 8.

Verdict key: P0#1 REFUTED (tool at 672.7 px after settle vs round-16's 671 — mid-flight
capture, the round-15 harness class) · P0#2 CONFIRMED P0, worse than reported (~1,750 px of
caption-over-copy; fixed) · P1#3 PARTIAL→P2 (scroll-up state only; fixed) · P1#4 CONFIRMED→P3
(fresh-load approach band; fixed) · P1#5 REFUTED (no authored rest clips) · P1#6 CONFIRMED P1
(+ a root cause the audit missed: the stand-down never re-evaluated at rest; fixed) · P2#7–#9
CONFIRMED (fixed) · P2#10 REFUTED (entrance mid-flight) · P3#11–#13 CONFIRMED (fixed).

## Its ranked findings (condensed)

P0#1 — ch2 tool desync at CH-05/Inspect persists (shots 06–08: tool off-screen, black void).
  [VERIFY FIRST: instant-scroll capture with no settle shows the damped camera mid-flight.]
P0#2 — `.surface-caption` ("surface looks the same"), position:fixed, stays pinned over
  Benefits and FAQ after the fluid slider reveals it. [Likely real — occlusion union covers
  the device card only; benefits/FAQ are inside chapter 4's progress span.]
P1#3 — ChatFi launcher occludes Download-schematic / Copy-summary on all three verdict cards
  at 440×956. [Plausible; fit chip suppresses at qualifier, launcher does not.]
P1#4 — spec-grid numbers blank mid-scroll (tiles held at opacity 0 pre-trigger; "10,000"
  missing, empty black boxes). [Capture-timing vs real late-trigger — measure.]
P1#5 — fixed header+chapter bar hard-clip headings at many scroll stops (shots 04/05/15/18/
  20/21/22). [scroll-margin-top fix suggested; note many shots are mid-scroll states, not
  anchor rests — verify which are real reading positions.]
P1#6 — "Check your well fit" chip collides with signal-strip badge 03, Inspect container,
  Access Portal corner (shots 02/07/13). [The hit-test stand-down shipped in round 14 covers
  live copy; verify these three specific elements are in its union.]
P2#7 — "Esc closes" hint on touch devices → "tap Close to exit".
P2#8 — Inspect Tool pill sits far-left in a full-width container (70% dead space).
P2#9 — qualifier Q1 options below the fold on arrival at 956px.
P2#10 — "Benefits of WellFi" double-text ghosting (shot 14). [Likely the entrance animation
  mid-flight in an instant-scroll capture — verify at rest.]
P3#11 — hero proof chips bisected by the fold at y=0 on 956px.
P3#12 — fluid slider end-labels clipped at fold pre-scroll.
P3#13 — header tagline pops (no crossfade) between y=0 and y=450.

## What it confirmed working (protect in regressions)

Chapter bar + CONTENTS sheet (formations listed, active indicator) · commissioning flow
(place → glowing line → 2600 kPa settle, matches ch4 baseline) · qualifier UX end-to-end
(readback, verdicts, reasoning, ≥50px targets) · ChatFi modal (clean sheet, disclaimer,
closes without losing scroll) · fluid slider kinematics (debounce, ghost trend, 300 kPa
pump-off) · native FAQ accordions · zero horizontal overflow · DPR-3 typography.

Full verbatim report: in the session-2 conversation log (Kyle's paste); this file is the
actionable condensation.
