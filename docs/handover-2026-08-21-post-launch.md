# Handover — post-launch state (2026-08-21, session 2 → session 3)

Site is **LIVE** at yotinenergy.com (world build, commit `a5227ec` on master, auto-deploys on push).
Loop converged round 15 (truth STOP 8.6, Grok STOP 8.5). Round 16 (mobile phase fix) shipped.
Read `docs/CHANGELOG.md` first — it is the full record. Invoke the **orchestrated-build** and
**design-improvement-loop** skills to resume the method; `docs/effort-evaluator-2026-08-19.md`
has the effort table (craft@medium, truth@high, implementers@medium with verifier-fix briefs).

## In flight at handover (check these FIRST)

1. **ChatFi IP-leak batch** (repo `C:/Users/kyle/MPS/chatfi-server`, Cloud Run, Gemini 3.7 Flash).
   Production ChatFi leaks the transmission mechanism (probe: "is there an isolation sub or gap
   in the tubing string?" → it explained the dipole in full). An Opus batch was dispatched:
   corpus/01 scrub to effect-language, output-side IP redaction gate (model priors leak too —
   corpus scrub alone is insufficient), adversarial evals, then deploy (or hand Kyle the exact
   gcloud command if auth is interactive). **Check the chatfi-server working tree for its
   changes + report** (task output: `.../tasks/wf425dtx5`-era files in the session temp dir, or
   just `git -C C:/Users/kyle/MPS/chatfi-server status`). Then: review → commit (repo's own
   style) → deploy → **re-probe production ChatFi with the exact question above** until it
   deflects. Also flagged: ChatFi volunteers receiver hardware detail (USB port, DIN-rail,
   3 W @ 24 V) from corpus/03 — Kyle to rule if that stays.
2. **Gemini 3.7 mobile audit received** → `docs/gemini-mobile-audit-2026-08-21.md`. GOOD report,
   but per the loop's law: **verify adversarially before fixing anything** — especially:
   - Its P0 "ch2 tool desync persists": may be its OWN harness bug — its audit script scrolled
     instantly to fixed y-positions; with the conductor's damped camera, an immediate screenshot
     shows the camera mid-flight (the exact harness-bug class round 15 documented). The round-16
     fix measured tool 535–671 px at those stations AFTER settle. Reproduce with a settle wait
     before accepting. Also confirm whether it audited prod (post-3cfa933) or local.
   - Its P0 "surface-caption pinned over Benefits/FAQ": PLAUSIBLE AND LIKELY REAL — the
     world-projected 'surface looks the same' caption is position:fixed, gated on chapter-4
     progress, and benefits/FAQ live inside chapter 4's span; the round-14 occlusion union
     covers the device card only. Verify, then fix (hide once #benefits enters, or occlude vs
     those sections too).
   - Its P1 ChatFi-launcher-over-verdict-actions: plausible (the fit chip suppresses at the
     qualifier; the ChatFi launcher does not). Verify at 440×956, fix per its suggestion or
     hide-at-qualifier.
   - P1 "spec numbers blank mid-scroll": the glyph-assembly entrance holds tiles at opacity 0
     pre-trigger — mid-scroll captures show empties. May be capture-timing, may be a real
     too-late trigger on tall phones. Measure.
   - Its P2s (Esc-closes on touch, Inspect pill dead space, qualifier options below fold, hero
     chips clipped, ghosting on Benefits title, slider labels clipped, tagline pop) are cheap
     and mostly credible — batch after verification.
3. **Round-16 on-device confirmation**: Kyle re-scrolls the tool chapter on his iPhone 17 Pro
   Max (the fix is live). Flagged residual: the tool reads THROUGH the 0.82 mobile control
   panels — if Kyle wants transparency, follow the round-14a benefits precedent WITH contrast
   measurement.

## Standing arrangement

Fable orchestrates only (never implements beyond one-token/doc fixes — and NEVER let a red
`npm run check` through: **gate exit code first, then commit; two chaining slips both shipped
red**). Opus implements/critiques via the Workflow tool; Codex + Grok are foreground-CLI
critics (`codex-companion.mjs task` / `grok --single`, stdout to a file); Gemini/Antigravity is
interactive-only on this host (Kyle drives it; protocol in `docs/mobile-audit-protocol-2026-08-21.md`).
**Kyle runs parallel sessions** — before committing, `git status` for foreign edits and ASK
(the llms.txt/robots/vercel.json work was his; it got swept into a commit mid-edit).

## Open for Kyle (spec §14 + post-launch)

GA4 device split · operator routes · contact H1 · BEST FIT badge on Q1 · static return term
(field.js note) · ChatFi hardware-detail ruling · README ChatFi promotion gates (privacy link,
Yotin/MPS relationship sentence) · watch GA4/Clarity scroll maps (~1 week).

## Infrastructure notes

Dev server: `npm run dev -- --port 5174` (launch.json: yotin-world-dev). Gates: `npm run check`
/ `check:rm` / `check:runtime` (--settle 3200 on ch6 flake) / `check:scroll`; capture matrix now
includes 440×956; stills staleness is pose-fingerprint-based. The critique-round runner is
`improve-round.js` + `impl-batch2.js` in the session-2 scratchpad
(`.../36c37cc2-aa14-46b6-9daf-c72436fb375d/scratchpad/design/`) — copy them forward or re-create
from the design-improvement-loop skill. Obsidian vault `Yotin-web/` mirrors repo docs (repo =
truth; refresh mirrors on change).
