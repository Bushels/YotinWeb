# Handover — session 3 close (2026-08-21, round 17 shipped + confirmed)

Site **LIVE** at yotinenergy.com. Round 17 (Gemini-audit fixes) deployed as `affe629` and
**confirmed on production: 10/10 PASS, zero regressions** (verdicts in `docs/CHANGELOG.md`
Era 8; the audit doc `docs/gemini-mobile-audit-2026-08-21.md` carries per-finding verdicts).
Method: orchestrated-build + design-improvement-loop skills, both current.

## What happened this session

1. **Gemini 3.7 mobile audit adversarially verified** (2 Opus verifiers: browser reproduction
   at 440×956 with damped-camera settle + source analysis). 3/13 refuted as its own
   instant-scroll harness bugs — its P0 "ch2 desync" died on a 1.7 px measurement against
   round-16's 671 px. 10 confirmed (1 real P0: pump-off surface caption clamped over
   Benefits/FAQ for ~1,750 px). All 10 fixed by one Opus implementer from verifier-written
   briefs, gates re-run by the orchestrator (156/156 + budget/colour/rm/scroll/runtime, exit
   codes 0), committed `affe629`, pushed, Vercel READY, then a production confirmation pass.
2. **ChatFi IP-redaction completed and committed** (`chatfi-server` @ `083c69e`): the died
   session-2 batch's corpus scrub was reviewed and inherited; the new batch added the
   `ip-mechanism` rule in FORBIDDEN_RULES (one source gating released output + corpus lint +
   inbound history), the acknowledge-then-pivot served deflection, the guardrail carve-out
   (mechanism question ONLY may be named proprietary; never-announce stands for every other
   secret), 4 mechanism probes (live gate 20 → 24), README drift fixes (130+ → 160+).
   229/229 vitest, tsc clean. **NOT DEPLOYED — gcloud was blocked by session permissions.**

## In flight / blocked on Kyle

1. **ChatFi deploy — DONE (2026-08-21, later this session).** Kyle's first deploy attempt
   died on the gcloud project-drift trap (active project was agnonymous; Cloud Run API not
   enabled there, so nothing deployed anywhere); the retry with `--project=wellfi-chatfi`
   landed rev `chatfi-server-00029-jsf`. The isolation-sub probe now serves the
   acknowledge-then-pivot deflection verbatim. Live gate: first run 22/24 — both failures
   proven from the transcript log to be MATCHER false-positives on correct answers ("150 °C"
   spec citation; a denial echoing "booking tool here"). Matchers tuned per the probes-file
   doctrine (spec-unit exemption on both bracket twins; assertive lead-ins on both booking
   arms), 10/10 correct-behavior resamples, offline evidence pinned in evals.test.ts,
   **final gate 24/24** (chatfi commits `083c69e` + `b74a5e2`; README stamped).
2. **On-device confirmation, rounds 16–17** — Kyle re-scrolls the tool chapter AND the
   Benefits→FAQ stretch (post-pump-off) on the iPhone 17 Pro Max. Emulation cannot prove
   ProMotion/Safari compositing/safe-area (protocol doc, Lane A limits).
3. **Kyle rulings** (also in the Obsidian open-items note): ChatFi receiver-hardware detail
   (USB/DIN-rail/3 W @ 24 V — stays?); `corpus/01-em-telemetry-physics.md` FILENAME (content
   scrubbed; rename or leave); the EM-telemetry family-name boundary (gate stops ChatFi
   confirming the mechanism — priors-guessing by readers is out of scope); spec §14 leftovers
   (GA4 device split, operator routes, contact H1, BEST FIT badge, static return term,
   schematic download, feather glyph); README ChatFi promotion gates; GA4/Clarity watch
   (~1 week from 2026-08-21); 390×844 fold geometry (hero chips + ch4 block below that fold,
   pre-existing — decide if it matters).

## Flagged, not fixed (round-18 candidates)

- Conductor's cached `anchors` drift ~55 px from the live rule as the document settles —
  CONTENTS/keyboard/harness arrivals land high. (The fit chip now computes the live rule.)
- 390×844: hero chips (915.6 of 844) and the whole ch4 control block below the fold.
- The physics-sources gate flags "440 × 956" in src/ui comments as a figure product.
- Launcher's rest state at page top is opacity 0 with NO state classes — don't misread as a
  stand-down in future audits.

## Infrastructure notes

- Dev server: session-2's Vite on :5174 was reused all session and is likely still running
  (healthy). Kill or reuse next session (`npm run dev -- --port 5174`; launch.json
  yotin-world-dev — note preview_start refuses while the orphan holds the port).
- **Production does not boot the world headless by default**: bare URL → stills page tier 0.
  Capture world items on `?world=1`; verify the stills lane separately on the bare URL.
  (Plausibly part of why external auditors' captures mislead.)
- New traps recorded in the loop skill's territory (CHANGELOG Era 8 + Obsidian lessons):
  instant-scroll audits of a damped camera; one-shot IntersectionObserver on the re-rendered
  verdict node; fixed overlays' stand-down rules rot (enumerate what can ever scroll beneath
  a fixed transient; re-evaluate at REST).
- Records all current: CHANGELOG Era 8, audit doc verdicts, Obsidian mirrors (Changelog,
  Issues+Lessons, Open Items, hub), auto-memory + index, one Hindsight mps retain.

## Standing arrangement (unchanged)

Fable orchestrates only (gate exit codes FIRST-HAND before commit; check `git status` for
Kyle's parallel-session edits and ASK if foreign files appear). Opus implements/critiques via
the Workflow tool (implementers medium with verifier-fix briefs; truth high). Codex/Grok
foreground-CLI to a file. Gemini/Antigravity interactive-only (Kyle drives; protocol doc).
