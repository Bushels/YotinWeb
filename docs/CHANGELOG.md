# Yotin-web changelog — the three.js world build

A step-by-step record of the rebuild: what changed, the rules we keep, who did the work
(agents, skills, MCPs), what broke, what improved, and what we learned. Newest first within
each era. Companion docs: the authoritative spec
(`docs/superpowers/specs/2026-08-19-yotin-threejs-world-design.md`), the effort study
(`docs/effort-evaluator-2026-08-19.md`), and the dated handover notes in `docs/`.

**Status: LIVE.** Deployed to production 2026-08-21 (commit 42423f7, deployment READY on yotin-energy.vercel.app and yotinenergy.com) — the three.js world build replaced the old static site after 15 critique rounds. Cree review closed (the passage stands). Remaining post-launch items: Kyle's on-device confirmation of rounds 16–17, ChatFi broad-promotion gates (README), GA4/Clarity scroll-map watch (~1 week).

---

## The rules we keep (binding, spec §0 / §6 / §13b)

These survived ten critique rounds and are what the critics rated highest. They are not style
preferences — each one exists because breaking it produced a measured defect.

1. **One candle.** Saturated cyan appears only where the signal is: chapter 3, the verdict
   candle/badge, and the logomark after the circuit closes. Everything else is sand (readable
   light) and ember (CTAs, warmth). Enforced by a colour gate + per-frame cyan census.
2. **Truth discipline.** The site prints only defensible figures: 10,000 psia · 150 °C · 46 mm
   OD · 5+ yr battery · 160+ installs · MODBUS RS-485 / 4-20 mA. Everything else carries
   "representative values". The site never prints metres as its own claim (echoing the
   visitor's own entered values is allowed). No invented trends, no ROI claims, no fake data.
   A physics-sources CI gate requires a source on any figure-shaped claim.
3. **Copy grounds are washes, never panes.** Feathered to zero *inside* their own box; a flat
   scrim puts a one-pixel luminance step across the render. (Regressed once in round 8's fixes,
   caught in round 9 by pixel-scanning edges.)
4. **Time-based easing only.** A per-frame `* 0.06` is ~20× slower under SwiftShader / on a
   slow phone. (Round 6: the loop drew 40 % while the caption said "closed".)
5. **Chapter state is `floor(p + 0.002)`**, never raw float comparison.
6. **One transient at a time** in the fixed layer (rail / pause / ChatFi / panels), and the
   world is an *enhancement*: all copy, FAQ, numbers and the qualifier live in `index.html`, and
   a capability gate serves a complete stills page when WebGL can't run.
7. **Poses are composed offline** (landmark projection search scripts), not by nudging.
8. **Interaction states must be spatially true**, not captioned into truth — at separation 0 the
   stake literally stands on the wellhead and the digits go to dashes.
9. **Regenerate stills + frames before every critique round**, and tell the critics what changed
   so they re-verify rather than re-raise.
10. **Evidence before verdicts.** Findings are measured (pixel scans, contrast ratios, projected
    coordinates) and adversarially verified before anything is fixed.

---

## Era 10 — round 19: Kyle's walkthrough — see what you just did (2026-08-21, session 3)

Kyle walked the live site on his iPhone 17 Pro Max (approving the round-18 ripple on the way:
"It works! Well done and I love it") and found three things, his words verbatim in the batch
brief: the placed receiver — "I can't visually see it, would need a gap"; "same with the fluid
level slider"; and "'Why Operators Run it' covers overtop of 'Benefits of WellFi'". One
diagnose-and-author batch at high effort. Owner walkthroughs outrank rounds — verification went
into mechanism and fix, not existence.

- **Receiver visibility (P1)**: pure geometry — the commissioning card is 560 px of a ≤956 px
  screen with 264 px below its button; desktop has a free right COLUMN, a phone has a free
  BAND, and the mobile signal-b endpoint aimed the receiver dead centre behind the card. Fix in
  Kyle's stated direction: a 30svh gap under `.commission-block` (zero DOM — stills/no-JS
  byte-identical) + `POSES[4].mobile` re-composed OFFLINE by landmark projection (projector
  validated ≤3 px against browser measurements). After: receiver, footprint and chart bloom
  0 % covered at 440×956, Safari-bar-out AND 390×844; the place→line→2600 kPa beat intact.
  Free win: the footprint's world-side tap now places the receiver on phones for the first time.
- **Fluid level visibility (P1)**: not occlusion — OFF-FRAME (level rule at x −139/−92/−139)
  and drifting ~250 px vertically because ch4's pose interpolates under a 3.4-viewport phone
  chapter. Fix: **CH4_HOLD 0.38** (round-16's CH2_HOLD pattern applied to its sister chapter),
  `POSES[5].mobile` re-composed offline, a 30svh gap BELOW `.deploy-controls` (round-17 arrival
  preserved to 0.2 px), reserved min-height for the trend/readout rows (measured: the block
  grew 100–118 px UNDER THE FINGER on first release), and the pump-off caption hides over ch4's
  own panels (mobile-gated). After: level tick 0 % covered across the whole travel, all three
  geometries.
- **Eyebrow over Benefits (P2)**: REPRODUCED in emulation after all — round 17 measured
  boxes; measured in PIXELS, the H2's cap-half sat at 0.526 of its base-half luminance.
  Mechanism, two faults compounding: `display:inline` silently voids the eyebrow's 18 px
  bottom margin (1.6 px text gap), and `isolation: isolate` trapped the z-index:-1 wash
  ::before inside the eyebrow's own stacking context — its 28 px bottom bleed painted OVER the
  H2's caps at Benefits, #insight and the qualifier. Fix: **one deleted declaration** — the
  wash returns to the ancestor's negative-z level and paints as ground (after == wash-deleted
  control, 0.997 vs 0.996). The implementer's own first fix (34 px of flow spacing) was
  disproven by its own measurement — it pushed round-17's end labels 34 px below the fold —
  reverted and flagged.
- Riding in the same push: **the overUI consolidation** (`22f796c`, Kyle-initiated via the
  background-task chip, its own session) — five drifted over-UI selector lists became one
  discipline (`src/ui/overUI.js`). Round-19 gates ran on the combined tree.
- Gates: 167/167 (7 new: the CH4 hold, both mobile endpoints as literals, continuity, and two
  DESKTOP-IS-UNTOUCHED guards), budget, colour with pose fingerprint UNCHANGED (desktop
  bit-identical — no stills regeneration), rm, scroll (390×844 grew 13.44 → 14.14 of the 14.7
  cap — inside it, cap not re-pinned), runtime identical. mobile-phase.test's poseProgress
  list now reads "chapters 2 and 4"; its worldAt half unchanged and still asserted.
- **Lessons**: measure PIXELS, not boxes, when the claim is "covers overtop" — round 17's
  box-measure refutation of this exact spot was wrong in substance; a phone chapter several
  viewports tall needs the pose-hold pattern wherever a control drives a world target (ch2
  round 16, ch4 now — check ch3's beats if one ever gains a slider); reserve space for
  state-dependent readouts so a control never grows under the finger.
- Flagged, not fixed: the authored 18 px eyebrow margin is still void (1.6 px text gap;
  restoring costs 18–34 px per head and undoes round-17's ch4 arrival — owner call); the
  DESKTOP pump-off caption clamps into the desktop panels' rect (round-14-rule candidate,
  needs its own licence); usable-station latitude at the two new beats is 90–150 px (bounded
  by band minus stack height — widening costs scroll budget); the phone ch4 frame has never
  contained the tool (pre-existing — the x-ray "two legs" beat has nothing on screen there);
  `.commission-block`'s new band is probe-list UI, so a tap there places the receiver but
  never probes rock (the round-18 transparent-container tension, now with a second instance);
  and from the consolidation session: the built `main` eagerly pulls `boot` (~211 KB gz) on
  every path including stills — pre-existing since the rolldown migration, chip filed.
- **Confirmation pass (production, same day): 5/5 PASS at 440×956 AND 440×758, zero
  regressions.** Receiver/footprint/bloom 0 % covered in the open band with the full beat and
  a clean lift-reset; the world-side footprint tap places the receiver with the ripple at
  0.000 and zero rock-probe calls (instrumented); fluid tick 0 % covered at levels 0/50/100
  with ghost + 300 kPa intact; the caption reproducibly hidden at the arrival and visible
  ~900 px deeper on both geometries; eyebrow cap/base ≈ 1.0 in pixels at every washed head
  (the single 1.675 outlier chased to a luminance-threshold artifact over a flat-247 glyph
  profile — raw rows in the log) with 5.8–10.9:1 grounds; round-17 arrival numbers hold to a
  tenth of a pixel. Regression sweep clean AFTER the overUI consolidation across every path
  it feeds (fit chip shy + reachable, Inspect two-stage + Esc, channel card, ripple
  fire/silent, launcher stand-down, caption-over-copy); zero console errors; desktop
  identity untouched at 1440×900.

## Era 9 — round 18: the world answers the thumb (2026-08-21, session 3)

Kyle asked why the desktop easter eggs — the pointer parting the spruce, the micro-parallax,
the probe ring — are missing on mobile. The honest answer was not horsepower (phone tier sits
at 53/56 draw calls): touch has no hover, and the finger owns scroll. Kyle picked the tap
ripple from three researched options (scroll-coupled gusts and gyro tilt considered and
declined — the latter costs an iOS permission dialog). Spec amended in the same batch
(§5 Touch clause + §12 "The world answers the thumb", lead decision recorded).

- **NEW `src/tapRipple.js`**: pure tap classifier (one pointer, ≤ 350 ms, ≤ 12 px,
  pinch-proof solo tracking), a smoothstep envelope in real elapsed seconds (peak at 140 ms,
  hard zero at 1.49 s — §13b time-based rule), the probe.js UI-selector discipline, and the
  part-span gate `inPartSpan()` now the SINGLE source both paths call (desktop and touch can
  never drift). Fine pointers register zero listeners.
- boot.js: ground projection factored and shared; the ripple sample drives
  `setForestPointer`, else the desktop partStrength branch byte-for-byte; a live ripple keeps
  the on-demand render loop hot for its 1.5 s and not one frame longer.
- Hotspots win by construction: interactions registers its pointerdown first, proven by
  synchronous dispatch (+ one read-only `hovered` getter, the batch's single flagged
  deviation).
- Rendered verification, 16-case table at 440×956: ripples in hero and About; silent in ch2,
  on controls, cards, Inspect (two-stage tap unchanged), scroll drags, two-finger,
  long-press, and while paused (pause also kills a live ripple); desktop hover-part
  byte-identical, clicks produce nothing.
- Gates: 160/160 tests (4 new for classifier/envelope/gate/selectors), budget
  (world 209.2 / 215 KB), colour, rm, scroll, runtime — phone tier unchanged at
  53 calls / 39,926 tris: the ripple adds zero draws, as designed.
- Known edge, on record: a handset stalling > 350 ms mid-tap classifies the tap as a press —
  a graceful no-op; revisit the threshold only if Kyle reports dead taps on metal.
- Flagged, not fixed: transparent list containers count as open world per the probe
  precedent (a tap on the hero chips' empty band ripples — harmless, critics may weigh);
  five near-identical "over UI" selector lists now exist across modules (consolidation
  candidate); the launcher is unreachable at hero/About rest on phones (pre-existing —
  the round-17 flag, reconfirmed).
- **Feel is Kyle's on-device call** (§12): tap the hero and About trees on the iPhone.
- **Confirmation pass (production, same day): 7/7 PASS, zero regressions.** On prod the
  uniform rises to ~1.0 and reaches exactly 0 within ~2.0 s at both part spans; silent in ch2,
  on copy/controls (Inspect's two-stage tap and Esc verified working), on drags, two-finger
  touches, long presses, and while paused (pausing mid-ripple zeroes it next frame); desktop
  hover-part intact, clicks inert, zero console errors both viewports. Round-17 spot-checks
  all hold. Every silent case was backed by a positive control. Two NEW harness traps cleared
  and now on record: (1) CDP Input.dispatchTouchEvent inserts ~405 ms between down and up —
  the classifier correctly reads that as a press, so everything measures silent for the wrong
  reason; drive taps with Playwright's touchscreen (~1 ms). (2) setTimeout polling of a world
  uniform starves to 4–6 samples per 2.4 s under SwiftShader and aliases the whole envelope —
  wrap the mutation point (setForestPointer) for one true record per rendered frame instead.

## Era 8 — round 17: the Gemini lane verified, the fixed-overlay class closed (2026-08-21, session 3)

First different-model-family audit (Gemini 3.7 in Antigravity, Lane B of the mobile-audit
protocol) went through the same law as every critic: adversarial verification before any fix.
Two Opus verifiers — browser reproduction at 440×956 with the damped camera polled to a stop
before every capture, and a source-analysis pass writing implementer-ready fixes. Of its 13
findings: **3 refuted, 10 confirmed** (most re-severitied downward), one genuine P0.

- **Refuted as harness bugs, again**: its P0 "ch2 tool desync / black void" died on a 1.7 px
  measurement — tool at the Inspect station projects to 672.7 px after settle vs round-16's
  authored 671. Instant-scroll captures of a damped camera, the exact round-15 class; its
  header-clipping and Benefits-ghosting claims died the same way (no authored rest shows either).
- **The P0 was real and worse than reported**: the pump-off `.surface-caption` clamped itself
  over ~1,750 px of scroll — across Benefits and the FAQ, rendering the first question illegible
  on production. Fixed by the round-14 rule it had never been given: a label over the wrong thing
  hides rather than clamps (own `#benefits`/`#faq` rect in toolViz — deliberately NOT unioned
  into sideRect, which would have hidden the level chips everywhere).
- **Root cause the audit missed** (fit chip on live copy): the round-14 stand-down only ran on
  scroll events and was never re-evaluated once entrances/camera settled — a synthetic scroll at
  rest flipped it correctly, proving the predicate right and merely stale. Debounced re-check +
  `world:progress` hook, and the union gains `.signal-step`, `.portal-note`, `.tool-inspect`,
  `dt/dd`, spec tiles (containers, not text children — elementsFromPoint returns ancestors).
- The rest of the batch, all measured: ChatFi launcher stands down while the verdict action row
  is on screen (the implementer DISPROVED the verifier's one-shot observer by experiment — the
  verdict re-renders per completion, so the observer re-arms per `qualifier:state`); the fit
  chip's own tap now lands at the authored qualifier arrival (9605 vs 9355 — was 0 of 4 options
  visible); coarse-pointer orbit hint ("tap Close to exit"); Inspect capsule hugs its button
  (59 % of the row reclaimed); spec-tile entrance ratio 0.6 → 0.45 (blank approach band 188 →
  156 px, measured A/B — the top-edge alternative was rejected as the round-14a sliver-fire
  class); hero chips clear the 956 fold (953.5, was 963.5); fluid-slider end labels arrive above
  the fold (946.1, was 970.1) with the ch4 composition byte-identical; header tagline crossfades
  at 220 ms instead of popping.
- Gates: 156/156 tests, budget, colour (pose-fingerprint), rm, scroll, runtime
  (67 calls / 101,650 tris desktop · 53 / 39,926 phone) — all PASS, exit codes re-run by the
  orchestrator before commit.
- **Lesson (the class now has a name)**: persistent fixed-position overlays — projected captions,
  launchers, CTA chips — had stand-down rules scoped to the surfaces that existed when they were
  written, and nothing ever extended them to sections that later scroll underneath. When adding a
  fixed transient: enumerate everything that can ever pass beneath it, and re-evaluate its
  visibility AT REST, not only mid-gesture.
- Flagged, not fixed: the conductor's cached anchors drift ~55 px from the live rule as the
  document settles (CONTENTS/harness arrivals land high); at 390×844 the hero chips and the whole
  ch4 control block sit below that fold (pre-existing, larger than the 440×956 items closed
  here); the launcher's rest state at page top is opacity 0 with no state classes (do not read
  that as stand-down evidence); the physics-sources gate reads a "440 × 956" viewport in a
  src/ui comment as an unsourced figure product.
- **Confirmation pass (production, same day): 10/10 PASS, zero regressions.** Every fix
  measured on yotinenergy.com within a few px of the implementer's locals (hero chips 953.5,
  end labels 946.1, capsule 161.9 px, desktop caption 844.9/97.5, chip arrival focus-top 72.4);
  the launcher stand-down re-arms across a second qualifier completion and works on the stills
  lane; the round-16 tool guard holds (tool group 532.6×650.3 px, dominant at the ch2 station);
  cyan census clean; zero horizontal overflow at all seven anchors across 440/390/1440; the
  audit's protect list works end-to-end. Capture-environment fact for the next auditor:
  **production does not boot the world headless by default** — a bare URL yields the stills page
  at tier 0; world items must be captured on `?world=1` (the stills lane is then verified
  separately on the bare URL).

## Era 7 — round 15: convergence (2026-08-21)

The final confirmation round. **Truth voted STOP at 8.6** — "Fifteen rounds in, there is not a
single figure on this page that contradicts another figure on this page. That is rarer than it
sounds." **Grok voted STOP at 8.5 with zero findings.** Craft 8.3 found exactly one new P1 (a
:first-child token on the stills path); Codex 8.4's three P1s all resolved as stale-spec or
capture-harness items, not site defects — including its 392-kPa claim, which truth independently
proved was the exactly-correct interpolation at the slider position the capture parked on.

- **93e55d5** — the closure: one token deleted (stills ch6 lede ground, 3.4:1 → 7.9:1), the
  pump-off capture drives to its end stop, and the spec caught up with its own site (§0 geology
  lock → the round-11 corrected labels; §4 mobile sub-ledger → the round-11 CTA removal).
- Score trajectory across the loop: 4.0/4.5/5.5 (round 1) → 7.5/6.5/7.8 (round 8) → 8.2–8.6
  (round 9) → 6.5–7.8 (round 13, new surfaces) → 8.3–8.6 with two stop votes (round 15).
- **The loop is converged.** Remaining before deploy is Kyle's, not the critics': the §14
  decisions (Cree language review foremost), the real-device mobile audit, and the push.

## Era 6 — round 14: the confirmation panel and Grok's first stop vote (2026-08-21)

Five critics re-verified rounds 13-fix + 14a. **Grok voted STOP at 8.2** — the first stop of the
expanded panel — and cleared the restored charts against §0. Craft 8.0/7.5, Codex 7.7, truth 7.0:
not yet convergence. 8 P1s confirmed, and both of Codex's P1s failed verification (the firework
re-raise landed as P2; the fit-future "clip" refuted by pixel comparison — its second misread of
the same authored wedge). The panel confirmed the fishbone as "the best geometry work in the
project" and the return current as "the first version where the circuit is closed in the picture."

- **0b098ed** — the fixes: the ch1 half-erased headline was the hero scrim's 170px bleed (the
  implementer DISPROVED the verifier's compositor theory by experiment before finding it); sand
  headlines on every path incl. stills; fluid chip occlusion against the real panels (the
  verifier's whole-world rect was measured and replaced); ch4 figure regraded from source (tool
  mean L 52.9 → 88.8); phone tagline collision; legend 4.63:1 in bright chapters; TRUTH — the
  fluid demo now spans 2600→300 kPa (~250 m of column) and the canonical reading is the
  PRODUCING well, not the pumped-off state.
- **7597f7d (14a)** — Kyle's pass: true fishbone both sides (tris went DOWN), chips bottom-aligned
  (specificity bug), the spec-grid entrance made visible (it had fired as a 90px sliver while
  another animation fought it), charts restored under the recorded marketing doctrine ("no blatant
  lies; valueless glyphs are licensed iconography"), benefits cards translucent (the hover ground
  had never rendered — second specificity bug), (403) 679-5330 live.
- Panel lessons: implementers disproving verifier diagnoses by experiment is now an established
  move (twice this round); Codex repeats composition misreads on the fit wedge — verifiers stay
  mandatory; Grok's stop vote + cleared-glyphs note shows the lead-decision clauses work.

## Era 5 — round 13: the five-critic panel (2026-08-20–21)

First round with the expanded bench: 2× Opus craft @ medium, Opus truth @ high, Codex, and **Grok
(CLI, debut)** as the brutal-skeptic lens; Gemini/Antigravity sat out (headless auth still pending).
Scores 6.5–7.8, no stop. 8 confirmed / 2 refuted by verification. First four-of-five convergence:
the 12d chart glyphs (sparkline shapes are banned by §0 regardless of printed values — the brief's
"abstract glyphs" reading was wrong). Grok's debut earned its seat: "commissioned is an ops word —
this is a demo click", the step-01/03 contradiction, and "a vendor imagining SCADA".

- **233bca2** — the fixes: charts → an instrument panel face standing on the receiver (Kyle's
  pick of four options); the ch3 field became a dipole with a measured null plane (sector
  min/max 329, firework px 10,572 → 619) with the casing sheath as honest dominant; one
  source of truth for pump positions (all runnable, angles measured on the authored curve);
  ch4 figure regraded + captioned; ch1 scrim feathered; commissioning copy passes the foreman
  test ("Receiver on the pad. Reading at surface."); phone one-tap fit chip restored;
  evidence gaps closed (acquire-settled, ch5-facts, rm walks all seven chapters).
- Refuted by verification: the wash-seam claim (edge-response measured clean) and the at-spec
  framing (overstated). Wabiskaw omission ruled defensible against Kyle's own strat chart.
- Panel lessons: two identical-effort craft critics again found different P1 sets (diversity >
  effort, third confirmation); external critics' P1s verified in-place by the implementer
  worked well; Grok CLI = grok --single, foreground to a file, same discipline as Codex.

## Era 4 — Kyle's live walkthrough, rounds 11–12 (2026-08-20)

The owner walked the site chapter by chapter and drove two days of fixes. Pattern: Kyle's verbatim
intent → parallel Opus implementer batches (world @ high, copy/UI @ medium) → orchestrator
regenerates, spot-checks, commits. Mobbin research fed the Commission-the-Well concept choice.

- **7670722 (12d)** — ch3 light is a chapter-local curve (0.03 candle reveal → 0.30 dusk lease for
  commissioning); the acquire beat becomes the show: a data pulse climbs the string (0 extra draws,
  riding the field's return plane) and three abstract chart glyphs bloom from the wellhead (+1 draw)
  — "binary data becoming useful charts", no fake values (tested). ch3 still now encodes at q20.
- **afa39e8 (12c)** — Commission the Well (Kyle's pick of three Mobbin-researched concepts)
  replaces the slider: 01 tool in the string (ships ticked) · 02 receiver on the lease (pre-lit
  footprint, one action) · 03 reading on SCADA (an arrival). One cyan moment = the signal landing.
  Slider, V1/V2 reference cards and separation scale deleted; spatial truth kept (no receiver → no
  loop → dashes).
- **cb52ab2** — the "phone cyan leak" was LCD subpixel text antialiasing on sand glyphs, not the
  world; the capture harness now runs --disable-lcd-text (gate measures the scene, not the host).
- **1f395c9 (12b)** — the well tells the truth: shoe lands 0.13 into the top of the Lower Sand
  (round-11's deeper-shoe fix had overshot into the mudstone — Kyle caught it), collar honest in
  the intermediate at 28 % standoff, descent/tool/signal/fit poses re-authored by offline
  projection, the glowing WellFi restored (ember presence that yields to the cyan), and the trees
  answer the wind (travelling gust field, ~2° lean, zero added draws). Rail tally reads along-hole.
- **bd51e1e (12a)** — IP-protection pass: isolation sub / antenna gap / skin-depth chip and all
  mechanism language removed, journey copy recast as effect-language; real YOTIN ENERGY lockup in
  the header (teal still arrives with the signal); Blender device render replaces the ch4 figure
  (burned-in text incl. an unapproved figure cropped out); feather → seal glyph; spec-grid entrance
  animation (glyph-assembly instead of count-up — the round-1 P0 forbids tweening through false
  values); fluid-level readout with delta anchored to the ch3 figures.
- **2c7c8da (11)** — hero CTAs removed, colour logomark + load animation, brighter fishbone,
  WellFi into the intermediate (first attempt — the shoe-deeper trade round 12 corrected), and the
  formation truth pass: Ellerslie → McMurray (Lower Mannville), Joli Fou named as the seal,
  Clearwater Mudstone (completions-engineer verified; Kyle's strat column confirmed; Grand Rapids
  deliberately omitted).

New flags on record (spec §14 candidates): phone commissioning light ~0.12 (device judgment);
the static return term is strongest at surface (inverse of round-8 intent, documented in field.js);
scrolled header keeps a stray divider hairline. Collaborators: Grok 4.6 authorized (CLI),
Gemini = Antigravity (3.7 Flash) — both queued for the round-13 critique panel.

## Era 3 — rounds 9–10: orchestration swap, Mobbin research, interaction redesigns (2026-08-19, session 2)

### 989718a — round-10 fixes (six confirmed P1s, all on the newest surfaces)
- Future verdict no longer asserts a present-tense deployment for a well on the waitlist.
- Placement language unified in five places: "on the tubing inside casing" / "set below the
  intermediate shoe, in open hole" (was four incompatible phrasings).
- The 10 %-of-intermediate standoff rule sourced in place and added to the physics-sources gate.
- Verdict block left-aligned (centre-aligned under a hard-justified table was "the one dated tell").
- Stills capture hides body-level projected captions — `ch4.webp` no longer bakes
  "fluid level · now" through the benefits cards.
- FAQ hedges the exterior mount: "subject to casing size (confirm per well)" — JSON-LD parity kept.

### 48e0aac + 6a72eaa — round-9 batch 2: Mobbin-researched interaction redesigns
- **Qualifier verdict is a result, not a button**: readback of the visitor's six answers →
  VERDICT eyebrow → plain 28 px label in its earned colour → one reasoning sentence derived from
  the actual answers → demoted actions. (Pattern: Hers' echo-then-verdict, Origin's dark verdict.)
- **Close-the-Circuit slider is a measurement instrument**: sand hairline track, ticks every
  10 %, taller detent tick at "on the wellhead — no difference" (keyboard snaps onto it), the
  V₁−V₂ reading in the same card; ember only on focus/active.
- **Orbit is one panel**: chips · hairline · "drag to rotate · Esc closes · Close" (sand outline,
  not a white pill); Inspect and the panel swap through one slot.
- Capture script gains companion `fit-*-verdict` frames so critics can see the DOM block.

### 749d1b1 — round-9 batch 1: confirmed P1s + measured P2s + two Mobbin quick wins
- Copy-ground washes restored on the two regressed panes (measured max step 22–38 → 1–3 px).
- Fallback path prints units correctly (kPa / mm/s RMS / 4-20 mA); rm-smoke now asserts casing.
- "Deeper" pump marker actually lands deeper than the standoff line (geometry test added).
- X-ray pressed state: sand fill + filled dot. Side captions project without world-space lift.
- Deployment pump moved out of the build (74° → ~27°), 1.6× silhouette with shoulders.
- Phone ch2 dead strip collapsed. ChatFi launcher: sand at rest, ember when warmed, hidden in
  ch2/ch3. Phone rail bar: 2 px progress rule (cyan tip only in the signal state), CONTENTS sheet
  with all seven chapters.

### Process changes this session
- **Orchestration swap (Kyle's direction):** Fable orchestrates only; Opus 5 critiques and
  implements; Codex returned as a critic — run *foreground* via the companion CLI with output to
  a file (its `--background` job store lost round 6's job entirely).
- **Effort evaluator** (`docs/effort-evaluator-2026-08-19.md`): craft critique @ medium is the
  sweet spot; high pays off only on the truth lens; implementation @ medium with verifier-fix
  briefs needed zero rework across three batches.
- Round 9 scores 8.2–8.6 (2 P1s). Round 10: Codex said stop at 8.7; Opus craft/truth 7.6/6.5
  found 6 P1s on the new surfaces — fixed same session. 1 finding refuted by source+pixel checks.

## Era 2 — the self-improvement loop, rounds 1–8 (2026-08-19, session 1)

Scores went **4.0 / 4.5 / 5.5 → 7.5 / 6.5 / 7.8** over eight rounds (three critics; Codex was
dropped after hanging twice, replaced by a second Fable critic).

- **Round 8** (`21fe6cf`, `023c8e4`): the EM field's fourth plane carries the return current up
  the casing (line-source term); slab silhouette gets its sand cut-edge; the wellhead is a real
  assembly and no longer out-lights the darkest chapter; thesis line on one quiet ground; wind
  hugs the ground, quieter, varied. Verdict: two critics said stop.
- **Round 7** (`db8af11`): copy washes fade to zero inside their box (the radial's ending shape
  was still 0.3 at the edge — a repeated trap); Close-the-Circuit works on the reduced-motion
  path (DOM state machine, world twins); honest coupling (the field swells less for a casing-
  shorted collar). Mobile eyebrows earn their own ground (`9994e06`, 1.09:1 → 4.54:1).
- **Round 6** (`663e995`): time-based easing everywhere; fit pose frames both verdict
  placements; candle casts a tight local light; golden hour authored.
- **Round 5** (`62bc1a5`): continuous pose map + guard test; the circuit tells the spatial truth
  (stake on the wellhead at zero separation, instant loop collapse, cleared road corridor);
  signal-b re-aimed by offline pose search; feathered copy washes; phone header strip closed.
- **Round 4** (`24f305e`): opaque phone bar; matte casing + dull shoe ("no syringe"); instrument
  on the face with level rules; loop as a tube; wind gated by camera height; bedding noise.
- **Round 3** (`30974f3`): rail gutter ground + index-gated cyan; cased bore mouth on the notch
  wall; field density ∝ magnitude; qualifier before the fallback at every width; launcher yields
  on phone scroll; frames job fails fast on boot errors.
- **Rounds 1–2** (`ea105ec` through `741ae7b`): the P0s — one candle enforced, slots not
  ladders, no false spec tweens; runtime diet; rail contrast; stills colour gate; interaction
  frames driven through DOM twins (`8a446d8`).

## Era 1 — the world build itself (2026-08-19, session 1)

Rebuilt the static site as **one persistent three.js world under the existing DOM**: seven
chapters, nine camera poses, native scroll, bench topology, a representative Clearwater well
(casing → shoe → heel → open hole → laterals). Vite build; capability gate → complete stills
page. CI gates: `npm run check` (build + budgets + stills colour gate + 127 tests),
`check:rm` (zero world bytes on the fallback), `check:runtime` (draw-call/triangle caps at every
anchor: 68 / 107,734 desktop, 54 / 44,022 phone), `check:scroll`. A Flutter rewrite was
evaluated and dropped earlier (2026-08-06): 39 KB static vs ~2,300 KB Flutter.

Pre-world history (the old static site) runs `4968977` through `025718a` — baseline, WellFi
story, ChatFi/Deep Chat integration, yotinenergy.com launch.

---

## Who did the work — agents, skills, MCPs, tools

| Layer | What | Notes |
| --- | --- | --- |
| Orchestrator | **Claude Fable 5** (Claude Code) | Briefs, launches, gates, stills/captures, commits; adjudicates disputed findings by looking at one frame |
| Critique | **Opus 5** subagents via the Workflow tool | craft lens @ medium, engineering-truth lens @ high, adversarial verifiers @ medium; structured-output schemas |
| Critique | **Codex** (GPT-5.x) via the codex plugin CLI | Foreground `task` call, stdout → file; its P1s route through a verifier like everyone else's |
| Implementation | **Opus 5** subagents @ medium | Briefs carry verifier-written fixes with file:line; zero rework in 3 batches |
| Design research | **Mobbin MCP** (`search_screens/flows/sections`) | 5 patterns → top-5 ranked changes (verdict block, launcher, slider, orbit, phone rail) |
| Capture/measure | Playwright (headless chromium) via project scripts | `stills.mjs`, `capture-all.mjs`, `interactions.mjs`, `frames.mjs`, pose-search scripts |
| Gates | node --test (127), budget.mjs, colour-gate.mjs, rm-smoke.mjs, scroll-length.mjs | Never loosened to make a fix pass |
| Skills/process | superpowers (brainstorming → spec → plans), codex plugin skills | Spec §13b records the binding loop lessons |
| Memory | Claude auto-memory + Hindsight banks | Shared across Claude / Codex / Gemini sessions |

## Issues we hit (and their fixes)

- **Codex background jobs vanish** — the plugin's job store lost round 6's task ("No job
  found"). Fix: run the companion CLI foreground with stdout to a file. Worked both rounds since.
- **WebGL context loss flake** — `check:runtime` fails when two headless browsers share the
  :5174 dev server. Fix: re-run serially once before treating it as a regression.
- **Orphaned Vite/headless processes across sessions** — `page.goto` times out while curl is
  healthy. Fix: kill extra `vite` node processes, keep the one owning :5174.
- **SwiftShader easing trap** — per-frame lerp ~20× slower without GPU. Fix: time-based easing.
- **The radial-wash trap (twice)** — a radial gradient's ending shape is ~0.24–0.3 at the box
  edge, and a bleed can be eaten by the section's `overflow-x: clip`, reinstating the hard edge.
  Fix: linear wash + mask ramping across the box's own padding.
- **Misleading measurements** — the STRONG FIT badge is deliberately cyan (trips a naive cyan
  scan); anti-aliased glyph edges tank naive contrast metrics (measure glyph cores vs median
  ground); a critic measured caption distance to the *wrong line* (the fix was already in).
- **Stale stills at the same immutable URL** — public assets regenerate in place; regenerate +
  colour-gate before every round, and the ch6 screenshot once went silently stale (timeout
  raised, gate now catches staleness).
- **Critique frames cropped the evidence** — the new verdict block was below the fold at the
  authored anchor, so a critic called it "not evidenced". Fix: companion `-verdict` frames.

## Improvements (measured)

- Critic scores: 4.0/4.5/5.5 (round 1) → 7.5/6.5/7.8 (round 8) → 8.2–8.6 (round 9) →
  8.7 Codex / 7.6 craft / 6.5 truth (round 10, new surfaces judged hardest).
- Contrast: mobile eyebrows 1.09:1 → 4.54:1; every text block ≥ 9:1 worst-column (round-9 census).
- Colour budget: cyan census per 1366 frame — 0 px outside ch3/verdict/logomark.
- Runtime: 68 calls / 107,734 tris desktop, 54 / 44,022 phone — within caps incl. shadow pass.
- Payload: old static baseline 39 KB; world build critical CSS 17.3 / 22 KB cap, world chunk
  204.4 / 215 KB cap, reduced-motion first paint 71.7 / 127 KB.
- Tests: 0 → 127, plus four scripted gates wired into `check:all`.

## Lessons learned

1. **Independent critics at different lenses beat one big critic** — every confirmed P1 in
   rounds 9–10 was found by exactly one of the four critics.
2. **Adversarial verification pays for itself** — round 10's most dramatic finding ("open hole
   renders as pipe") was refuted by source + pixel checks; Codex's round-9 P1 was a misread of
   an authored wash. Nothing gets fixed on a critic's word alone.
3. **Medium effort + a verifier-fix brief beats high effort + a vague brief** — three
   implementation batches, zero rework. Put file:line and the binding rules in the brief.
4. **Fixes regress the rules they were made under** — round 8's contrast fixes reintroduced the
   pane-edge defect §13b had banned. Confirmation rounds after every batch are not optional.
5. **New surfaces need their own truth pass** — the batch-2 verdict block shipped with a truth
   bug (future path asserting a deployment) that only the truth lens caught.
6. **Make the capture show the work** — critics can only judge what the frames contain.
7. **Truth is a register, not a checklist** — the highest-praise items (skin-depth chip with
   citation, dashes instead of fake digits, geometry-as-argument) all came from refusing to
   caption things into being true.
