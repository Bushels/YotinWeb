# Handover — rounds 9–10, Mobbin research, orchestration swap (2026-08-19, session 2)

Follows `docs/handover-2026-08-19-world-build.md`. Current at the round-10 fix commit on `master`
(after `6a72eaa`; the final commit of this session carries the round-10 P1 fixes + regenerated
stills/frames). Still nothing pushed — production is the old static site.

## Orchestration (Kyle's direction this session, now standing)

**Fable orchestrates only** — briefs, launches, reads summaries/verdicts, runs stills/captures,
commits. **Opus 5 implements and critiques** (craft @ medium, truth @ high, verifiers @ medium).
**Codex is back as a critic** — run it *foreground* (`codex-companion.mjs task "..."` with stdout
to a file, backgrounded at the Bash level); the plugin's `--background` job store lost round 6's
job. Effort findings: `docs/effort-evaluator-2026-08-19.md` (craft-medium found the only real
craft P1 both rounds; high pays off only on the truth lens; implementation @ medium with a
verifier-fix-carrying brief needed zero rework across three batches). Memory:
`yotin-orchestration-effort.md`.

## What happened

- **Round 9** (4 Opus critics at low/med/high + truth, Codex, verifiers): 2 P1s confirmed
  (pane-edged copy grounds — a §13b regression; RM path printed "KPA/4-20 MA"), plus measured
  P2s. Scores 8.2–8.6.
- **Mobbin research** (Opus, `scratchpad/design/mobbin-research.md` in session
  `36c37cc2…`): five patterns, top-5 ranked changes.
- **Batch 1** (`749d1b1`): both P1s, pump move/silhouette, X-ray pressed state, caption
  projection, phone ch2 letterbox, ChatFi hush/warm, phone rail progress + CONTENTS sheet.
- **Batch 2** (`48e0aac`): verdict block (readback → VERDICT → plain label → derived reasoning
  sentence → demoted actions), circuit slider as measurement track with detent, one-panel orbit.
- **Round 10** (craft @ med + truth @ high + Codex): Codex said stop (8.7); Opus critics did not
  (7.6 / 6.5) — 6 P1s confirmed on the new surfaces, 1 refuted (open-hole-as-pipe failed source
  + pixel checks). All 6 fixed same session: future-verdict conditional consequence, stills
  caption bleed (CSS + stills regen), verdict left-aligned, placement language unified ("on the
  tubing inside casing" / "below the shoe, in open hole"), standoff rule sourced + physics-gate
  matcher widened, FAQ casing-size hedge (JSON-LD parity kept).
- `scripts/interactions.mjs` now captures companion `fit-*-verdict` frames (the DOM block is
  taller than the fold at the ch6 anchor).

## Open

**For Kyle (spec §14, unchanged):** brand-architecture paragraph (launch blocker), bench
topology + golden hour, Cree review of the yôtin passage, GA4 device split, operator routes,
schematic download, feather glyph, "Best fit" tag on Q1, contact H1, §14.9 lease-pad/hero.

**Round-10 P2s worth a look next round** (not blockers; several are truth-lens wording items):
review verdict repeats itself three times; "the standoff line" asserted before it is shown;
review-path world response pinned half under the standoff chip; ch3's invited action below the
fold at its own anchor; phone ch3 candle smear small; pale cut-ring dominates ch2; "38 % water
cut" / "158 kPa" / "drawdown drift" defensibility; strong-fit recites the temperature band as an
affirmative reason; both landing markers render in the horizontal section; return current rises
through rock with no steel drawn in it above grade.

**Loop state:** two consecutive rounds converged on "the truth lens is where the remaining work
is". Next round could be truth-only @ high + Codex, frames current, and take the P2 wording
items as one batch.
