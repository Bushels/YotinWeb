# Effort-level evaluator — what each effort level bought (2026-08-19)

Orchestration for this session: **Fable 5 orchestrates** (brief, launch, read results, run gates, commit);
**Opus 5 critiques and implements**; **Codex critiques** (foreground CLI run logged to a file — the round-6
`--background` job vanished, so never detach it). Fable reads summaries and frames only when adjudicating a
disputed finding.

## Experiment 1 — same critique prompt, same 34 frames, Opus 5 at three efforts (round 9)

All four Opus critics received the identical brief (spec §0/3/4/5/6/12 rubric, lead notes, "re-verify rather than
re-raise", stop condition). Only `effort` differed. Verifiers (Opus, medium) adjudicated every P0/P1.

| Critic | effort | wall | turns | output tok | findings | real P1s found | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| craft | low | 2.1 min | 33 | 8.8 k | 5 (3 P2, 2 P3) | 0 of 2 | score 8.6, "stop" |
| craft | medium | 6.0 min | 65 | 31 k | 7 (1 P1, 4 P2, 2 P3) | **1** — hard-edged copy panes (§13b regression, traced to `world.css:101`, pixel-measured) | score 8.5 |
| craft | high | 12.1 min | 88 | 57 k | 8 (4 P2, 4 P3) | 0 of 2 — and explicitly pronounced the washes clean | score 8.6, "stop" |
| engineering truth | high | 14.9 min | 115 | 75 k | 5 (1 P1, 1 P2, 3 P3) | **1** — RM path prints "4-20 MA"/"KPA" (CSS scoped to `html.world-on`); plus a real truth P2 (the "deeper" marker sits on the standoff line, `wellBuilder.js:17` vs `fit.js:108`) | score 8.5 |
| verifier ×2 | medium | 0.5 / 1.7 min | 8 / 24 | 1.9 k / 7 k | — | both confirmed, source-traced | — |
| Codex (GPT-5.x) | default | ~9 min | — | — | 6 (1 P1, 5 P2) | 0 — its P1 (fit-future "occluded") was a misread of the authored ch6 copy ground; refuted by comparing with fit-strong | score 8.2 |

What the numbers say:

- **Low is a smoke test.** It verifies the named fixes and restates known P2s; it does not find new problems. Use it
  to confirm a targeted change landed, not to judge a round.
- **Medium is the sweet spot for the craft lens.** Half the cost of high and it found the only real craft regression
  of the round — because it *measured* pixel rows at a few edges rather than surveying everything.
- **High spends its extra budget on breadth and measurement** (cyan pixel census per frame, worst-column contrast
  under every text block, four P3 polish notes). That is valuable for a ship/no-ship call, but it is not more
  likely to catch a specific regression — the high critic saw the same frames and signed off the panes.
- **High earns its keep on the truth lens**, where the work is reading source and cross-checking it against frames
  (`wellBuilder.js` vs `fit.js`, CSS scoping vs the RM still). Both of its P1/P2 hits came from source reading.
- **Independent critics at different efforts are not redundant** — the P1s were found by one critic each. Two
  medium craft critics would likely have been cheaper than one high and at least as sharp.
- **Codex is a worthwhile fourth eye** (it confirmed the round-8 return-current fix the way an engineer would and
  noted the launcher-vs-collar collision first), but its one P1 was a composition misread — route its P1s through a
  verifier, same as the others.

Recommended loop shape going forward: craft ×2 at **medium** · truth ×1 at **high** · Codex default · verifiers at
**medium** · the Fable orchestrator reads only the summary JSON and adjudicates disputed P1s by looking at one frame.

## Experiment 2 — implementation at different efforts (batch 1 vs batch 2)

Batch 1 (nine contained fixes: two P1s, truth P2, four measured P2s, two Mobbin CSS wins) ran through the plain
Agent tool, which has no effort knob — it inherits the session default. Batch 2 (three design-level interaction
changes from the Mobbin research) runs through the Workflow runner at an explicit effort. Results:

| Batch | effort | wall | output tok | items done | gate failures fixed by the agent | orchestrator rework needed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 — contained fixes (9 items, A–I) | inherited (default) | 58 min | 324 k (subagent total) | 9/9 — two done better than briefed (E was a misdiagnosis it re-measured; A avoided the verifier's radial trap) | 2 (WebGL context-loss flake, re-ran serially) | none — committed as-is (749d1b1) |
| 2 — interaction redesign (verdict block, circuit instrument, orbit merge) | **medium** (explicit) | 21 min | 190 k (subagent total) | 3/3, incl. a live-verified keyboard detent and a well-reasoned flagged deviation (kept ember on the main CTA per §0 rather than blindly following “secondary”) | 0 | none — one flagged deviation accepted |

Reading of experiment 2: **medium was enough for implementation even at design level.** The riskier batch (three
interaction redesigns) at explicit medium cost ~59 % of the contained batch and needed zero rework — because the
brief carried the verifier fixes / research recommendations with file-level pointers. The lesson is that implementer
effort matters less than brief quality: put the measurements, the file:line pointers, and the binding rules (§13b)
in the brief, and medium executes them faithfully while still exercising judgment (batch 1’s E re-measure, batch 2’s
CTA deviation). Reserve high-effort implementation for briefs that say “diagnose and fix” rather than “apply this”.
