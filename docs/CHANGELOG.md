# Yotin-web changelog — the three.js world build

A step-by-step record of the rebuild: what changed, the rules we keep, who did the work
(agents, skills, MCPs), what broke, what improved, and what we learned. Newest first within
each era. Companion docs: the authoritative spec
(`docs/superpowers/specs/2026-08-19-yotin-threejs-world-design.md`), the effort study
(`docs/effort-evaluator-2026-08-19.md`), and the dated handover notes in `docs/`.

**Status:** all work is on local `master` — nothing pushed; production (yotin-energy.vercel.app)
still serves the old static site. Launch blocker: the brand-architecture paragraph (Kyle, spec §14).

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
