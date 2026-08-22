# Handover — session 3 close (2026-08-22)

Site **LIVE** at yotinenergy.com, HEAD `219999a`+. **Mobile is fully owner-verified end to
end** — rounds 16–19 each carry a production confirmation pass AND Kyle's on-device sign-off
("Did the mobile test. Worked perfectly."). `docs/CHANGELOG.md` Eras 8–10 are the full record
of this session; the spec is current (round-18 §5/§12 clauses incl. the on-device approval).

## What this session closed

1. **ChatFi IP leak** (chatfi-server @ `b74a5e2`, Cloud Run rev `00029-jsf`): corpus scrub +
   output-side ip-mechanism gate + guardrail carve-out + 4 mechanism probes; live gate
   **24/24** after tuning three matcher false-positives against real served texts. The
   isolation-sub probe deflects verbatim.
2. **Round 17**: Gemini audit adversarially verified (3/13 refuted as its harness bugs), 10
   fixes shipped (`affe629`), prod-confirmed 10/10.
3. **Round 18**: the tap ripple (`a414cdb`), prod-confirmed 7/7, owner-approved on device.
4. **Round 19**: Kyle's walkthrough — receiver visibility gap + CH4_HOLD/fluid visibility +
   the eyebrow paint-order fault (`df99416`, with the overUI consolidation `22f796c` riding),
   prod-confirmed 5/5 at both phone geometries, owner-verified on device.

## Open (nothing urgent, nothing in flight)

- **Kyle / spec §14**: GA4 device split · operator routes · contact H1 · BEST FIT badge on
  Q1 · static return term (field.js note) · schematic download · feather glyph · §14.9 hero
  pad · watch GA4/Clarity scroll maps (~1 week from 2026-08-21).
- **ChatFi rulings**: receiver-hardware detail (USB/DIN-rail/3 W) · corpus/01 filename ·
  the EM-telemetry family-name boundary · README promotion gates (Turnstile/cost cap,
  privacy link, Yotin/MPS sentence) before broad promotion.
- **Flagged-not-fixed ledger** (CHANGELOG Eras 8–10, candidates for a future round): the
  18 px eyebrow margin still void (1.6 px text gap — costs 18–34 px per head, undoes r17's
  arrival; owner call) · desktop pump-off caption clamps into desktop panels (needs its own
  licence) · conductor cached anchors drift ~55 px from the live rule · 390×844 hero-chip
  fold (pre-existing) · phone ch4 frame has never contained the tool · commission-band taps
  place but never probe (transparent-container tension, 2 instances) · **built `main`
  eagerly pulls `boot` ~211 KB gz on every path incl. stills** (pre-existing since the
  rolldown migration — chip filed, the biggest perf win available).
- **Gemini re-audit**: protocol doc Lane B is hardened (settle discipline + do-not-raise
  list) — fire it after the next content change or on a Clarity signal, not before.

## Method notes for the next session

Standing arrangement unchanged (Fable orchestrates, gates exit-code-first, foreign-edit
check before commits; Opus implements/critiques via Workflow — medium with verifier briefs,
HIGH for diagnose-and-author, which paid for itself in round 19). New this session, now in
the skills: measure PIXELS not boxes on any "covers overtop" claim; the pose-HOLD pattern
(CH2 r16, CH4 r19) wherever a control drives a world target on a tall phone chapter;
fixed-overlay stand-down rules rot — enumerate what scrolls beneath, re-evaluate at rest;
CDP touch dispatch ≈405 ms = press-not-tap (use Playwright touchscreen); wrap the mutation
point instead of polling uniforms; every silent case needs a positive control. Parallel
sessions are real: HEAD moved mid-batch this session (the overUI chip) — re-gate on the
combined tree and say so in the commit.

Dev server on :5174 may still be an orphan from session 2 — kill or reuse
(`npm run dev -- --port 5174`; preview_start refuses while the orphan holds the port).
