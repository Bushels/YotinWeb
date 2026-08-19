# Handover — Yotin three.js world build (2026-08-19)

For the next session. Everything below is current at commit `023c8e4` on `master`. Nothing is pushed to the
remote yet — Vercel has not built this; production is still the old static site.

## Where it stands

The site is rebuilt as one persistent three.js world under the existing DOM (all copy, FAQ, numbers and the
qualifier live in `index.html`; the world is an enhancement). Seven chapters, nine camera poses, native scroll,
a capability gate that serves a complete stills page when the world can't run. **All gates are green:**

| Gate | Command | Status |
| --- | --- | --- |
| build + budgets + stills colour gate + 125 tests | `npm run check` | PASS |
| reduced-motion smoke (zero world bytes, rail present, circuit works) | `npm run check:rm` | PASS |
| runtime / overflow / one-candle at every anchor (needs dev server on :5174) | `npm run check:runtime` | PASS — 68 calls / 108 k tris desktop, 54 / 44 k phone |
| scroll length | `npm run check:scroll` | PASS — 10.33 / 11.55 / 14.28 (asserted 10.7 / 11.9 / 14.7) |
| everything | `npm run check:all` | — |

The self-improvement loop ran **eight rounds** (Opus 5 + two Fable critics; Codex was dropped after hanging
twice — Kyle's call). Scores went 4.0 / 4.5 / 5.5 → **7.5 / 6.5 / 7.8**. Round 8's verdict: Opus and the
engineering-truth critic both said *stop*; the craft critic had three items, all acted on after the round
(return current up the casing, slab silhouette cut-edge, real wellhead assembly, single ground for the thesis
line, quieter wind). No confirmation capture has been reviewed since those last fixes — **round 9 should be
a pure confirmation run.**

## How to pick this up

```bash
cd C:/Users/kyle/MPS/Yotin-web
npm run dev -- --port 5174          # the scripts assume :5174 and ?world=1 forces the world under SwiftShader
npm run check                       # fast gates
npm run check:runtime && npm run check:scroll   # need the dev server
node scripts/capture-all.mjs --url http://localhost:5174   # 3 viewports + reduced motion → scratch/frames
npm run capture:interactions        # orbit, circuit closed/no-diff, x-ray, pump-off, 3 verdicts
```

The critique loop is `scratchpad/design/improve-round.js` in the session scratchpad
(`C:/Users/kyle/AppData/Local/Temp/claude/C--Users-kyle-MPS-Yotin-web/2d3b7b4d-…/scratchpad/design/`) — run via
the Workflow tool with `{round, framesDir, notes}`. **Always regenerate stills (`node scripts/stills.mjs --url
http://localhost:5174/?world=1`) and recapture frames before launching a round**, and tell the critics what
changed — they re-verify rather than re-raise.

Gotchas learned the hard way (all recorded in spec §13b):
- Easing must be time-based; a per-frame `* 0.06` is ~20× slower under SwiftShader / on a slow phone.
- Chapter state is `floor(p + 0.002)`, never raw `exact` vs an integer.
- Copy grounds are radial washes that reach zero *inside* their box and are clipped by the section.
- Compose poses by projecting landmarks offline (`scratch/pose-search.mjs`, `scratch/fit-pose-search.mjs`), not by nudging.
- Orphaned Vite servers and headless browsers pile up across sessions — if `page.goto` times out with curl
  healthy, kill the extra `vite` node processes (keep the one owning :5174).
- A few measurements in the loop were misleading: the STRONG FIT badge is deliberately cyan (it counts in a
  naive cyan scan), and anti-aliased glyph edges tank a contrast metric — measure glyph cores vs median ground.

## What's open

**For Kyle (spec §14):** brand-architecture paragraph (launch blocker), approve bench topology + golden hour,
Cree language review of the yôtin passage, GA4 device split, operator routes, schematic download, feather glyph,
"Best fit" tag on Q1, contact H1 repeating the hero, and §14.9 — the lease pad sits behind the hero headline at
the authored angle (recommend relaxing the "pad is brightest" line for ch. 0 rather than re-authoring the hero).

**Next session (Kyle's direction):** continue the loop and use the **Mobbin MCP** (`mcp__mobbin__search_flows`,
`search_screens`, `search_sections` — loads via ToolSearch in a fresh session; it did not resolve in this one)
for better ideas on buttons and interaction workflows. Obvious candidates to research there: the qualifier's
step flow and verdict card, the "Inspect tool" / orbit control pattern, the Close-the-Circuit instrument
(two references + a slider), the ChatFi launcher's behaviour, and the phone collapsed rail bar. Keep the
one-candle rule and the truth discipline (representative values, no metres, 160+) — those are what the critics
rated highest.

**Remaining P2s the critics listed** (not blockers): phone ch2/ch3 letterbox the world to ~130 px with dead
black beneath; the X-ray toggle's pressed state is quiet; the "earlier" trend label sits far from its line;
deployment pump marker is small; wind is baked into stills (regenerate whenever it changes).

## Pointers

- Spec (authoritative): `docs/superpowers/specs/2026-08-19-yotin-threejs-world-design.md` — §6 contract, §13b loop lessons, §14 Kyle.
- Plan: `docs/superpowers/plans/2026-08-19-yotin-threejs-world.md`.
- README has the measured spec sheet and before/after.
- Memory: `~/.claude/projects/C--Users-kyle-MPS-Yotin-web/memory/yotin-threejs-world-build.md`.
- Frames and round results: `scratch/frames/`, and `…/tasks/round{1..5}.json` in the session temp dir.
