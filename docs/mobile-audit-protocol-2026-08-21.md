# Mobile audit protocol — yotinenergy.com (2026-08-21)

Two lanes. Lane A runs in this repo's harness (already dispatched). Lane B is a self-contained
prompt for Gemini 3.7 in Antigravity — paste everything between the fences into a fresh
Antigravity conversation. Results from either lane feed the same fix pipeline: findings →
adversarial verification → batch → gates → commit.

## Lane A — harness (Claude-side, running)

Tall-viewport emulation at iPhone 17 Pro Max geometry (440×956 logical + URL-bar dynamic-height
simulation), reproducing the world-vs-copy phase shift Kyle found on device (tool not visible
when Flow Insight / Inspect Tool is on screen). Root-cause targets: vh vs svh/dvh band heights,
anchor measurement vs Safari's collapsing URL bar, poses authored for 390×844 aspect. Output:
measured phase shift, fixes, a permanent 440×956 leg in the capture matrix.

**What emulation cannot prove** (Kyle's phone owns these): ProMotion feel, real Safari compositing,
thermal throttling, true safe-area behaviour, tap ergonomics. Device screenshots remain the
ground truth for anything Lane A calls fixed.

## Lane B — Gemini 3.7 Flash in Antigravity (Kyle-driven)

Why Gemini here: strong OCR + vision over long screenshot sets, and a *different model family*
than the panel that built the site — fresh eyes with no authorship bias. Note on CLI vs
Antigravity: the model is the same; the harness is not. Antigravity standalone carries its own
browsing/file tools and interactive auth; `agy` print-mode hangs headless on this host, so
interactive Antigravity is the practical route.

**Kyle's part before pasting:** take 10–20 screenshots on the iPhone 17 Pro Max while scrolling
https://yotinenergy.com top to bottom (include: hero, the descent headline, the channel cards
with Flow Insight, the Inspect Tool moment, the commissioning checklist before/after placing the
receiver, the fluid-level slider with its readout, the About Yotin section, the qualifier and a
verdict). Screenshot anything that looks misaligned, cut off, or empty. Attach them all.

---- PASTE INTO ANTIGRAVITY FROM HERE ----

You are auditing the MOBILE experience of https://yotinenergy.com (a scroll-driven three.js
narrative site for WellFi wireless downhole telemetry) from the attached iPhone 17 Pro Max
screenshots, plus your own browsing of the live site if your tools allow.

YOUR LENS: a meticulous mobile-UX inspector with strong OCR. For every screenshot: (1) transcribe
the visible text exactly (OCR) and flag any truncated, overlapped, or clipped words; (2) judge
whether the 3D world content and the copy belong together at that scroll moment — the site's
contract is that the world illustrates what the copy discusses (the known defect: the tool is not
visible when the "Flow Insight" card or the "Inspect Tool" control is on screen — confirm, and
find any OTHER copy/world mismatches); (3) check fixed-layer collisions (header, chapter bar,
pause button, "Check your well fit" chip bottom-left, ChatFi launcher bottom-right) against
content; (4) check tap-target sizing and reachability; (5) note anything that renders empty,
black, or half-drawn.

DO NOT RAISE (owner decisions, final): the site intentionally never explains how the technology
works (no mechanism talk — judge credibility, not completeness); the chart glyphs near the
wellhead are licensed abstract iconography; cyan appears only in the signal chapter and verdict;
the About section deliberately shows the 3D world through the text; formation names are correct
for the Clearwater fairway; the phone number (403) 679-5330 is real.

OUTPUT: a Markdown report. For each finding: [P0 broken / P1 major / P2 / P3 polish] — which
screenshot (number them in order) — the element — what is wrong (with the OCR'd text where
relevant) — a concrete suggested fix. End with: a section listing everything that works WELL on
mobile (so fixes don't break it), and a score 0–10 for the mobile experience as a whole.

---- END PASTE ----

**Returning results:** save Gemini's report as a .md file (or paste it back to Claude in the
Yotin-web session). It enters the same pipeline as every critic's report: adversarial
verification first — nothing gets fixed on any critic's word alone, Gemini included.
