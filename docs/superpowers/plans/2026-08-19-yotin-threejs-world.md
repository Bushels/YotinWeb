# Yotin three.js World — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild yotinenergy.com as one persistent three.js "Clearwater slice" world driven by native scroll, per `docs/superpowers/specs/2026-08-19-yotin-threejs-world-design.md` (the spec is authoritative; this plan sequences it).

**Architecture:** Fixed WebGL canvas behind the existing semantic DOM; a native-scroll conductor (exact vs damped progress) drives an authored camera rig and world channels; the island scene (ported verbatim from the R3F hero, converted to a Clearwater "bench" topology) is the one world; DOM stays the source of truth; three gates (graybox → chapters 0/3/6 → the rest + test migration).

**Tech Stack:** three 0.185.1 (WebGLRenderer), Vite 8 (Rolldown) multi-page static build, vanilla ES modules, existing CSS `animation-timeline` + IO fallback, Node test runner, Playwright (SwiftShader) for frames/budgets.

## Global Constraints (from the spec — verbatim values)

- Claims: "160+" everywhere; `manufacturer` removed from Product JSON-LD; public specs only (10,000 psia · 150 °C · 46 mm · 5+ yr · RS-485 / 4-20 mA); "field-proven in mature wells worldwide"; no operators, geography, ROI, cadence; every in-world number carries "representative values"; every printed physics figure has a `source` field.
- No metres printed. Formation names only. Caption: "Representative Clearwater well, Western Canada — schematic, not to scale."
- One-candle colour rule; cyan only ch. 3 / ch. 6 verdict / logomark after the circuit closes.
- Qualifier logic file untouched; exact answers never leave masked DOM (`data-clarity-mask`); GA4/Clarity ids + localhost guards; bounded analytics vocabulary.
- FAQ markup byte-identical; anchors/ids unchanged; operator routes allow-listed; no-JS / reduced-motion / no-WebGL2 complete pages; import gate before any three.js download.
- Budgets §6 (critical ≤ 290 KB, ui ≤ 60, world ≤ 170, reduced-motion 79/211 excl. fonts; ≤ 55 calls / 100 k tris desktop; ≤ 7.5 viewports desktop, ≤ 8.5 phone).
- Kyle's rules: simplest robust; premium visuals; adversarial audit before touching shipped hero geometry.

## Source of truth for code

The spike at `<scratchpad>/spike/src/` (`world/{layout,wellPath,cycle,pulseMaterial,terrain,forest,wellSystem,wellfiTool,props,field,island}.js`, `conductor.js`, `cameraRig.js`, `chapters.js`) is copied into `src/` in Task 2 and then edited in place. Do not rewrite it from memory.

## File structure

```
package.json, vite.config.js, .nvmrc            build (Task 1)
index.html, privacy.html                         entries (existing, edited)
public/                                          robots.txt, sitemap.xml, assets/, baytex/, obsidian/, tamarack/ (allow-list)
src/main.js                                      boot: gate → import('./boot.js') | stills
src/boot.js                                      renderer, scene, world, conductor, rig, interactions, ui
src/world/*.js                                   from the spike (+ readout.js, wind.js, wellBuilder.js)
src/conductor.js, src/cameraRig.js, src/chapters.js
src/interactions.js                              raycast FSM + DOM twins
src/ui/{probe,rail,reveal,icons,motionToggle,stills}.js
src/legacy/{nav,counters,qualifier,chatfi}.js    lifted from main.js unchanged in behaviour
src/styles/*.css                                 styles.css split: base, layout, world, chapters, ui
test/*.test.js                                   existing + new (see Task 5/12)
scripts/{manifest.mjs,budget.mjs,frames.mjs,stills.mjs,scroll-length.mjs}
```

---

## GATE 1 — graybox

### Task 1: Vite scaffold that reproduces today's site byte-for-byte in behaviour
**Files:** create `package.json`, `vite.config.js`, `.nvmrc`; move static passthrough into `public/`; keep `index.html`/`privacy.html` at root as Vite entries; `vercel.json` gains `buildCommand`/`outputDirectory`; `.gitignore` adds `dist/ node_modules/`.
- [ ] `npm init -y`; `npm i -D vite@8 three@0.185.1`; `engines.node` = 22; commit lockfile.
- [ ] `vite.config.js`: `build.rollupOptions.input = { main: 'index.html', privacy: 'privacy.html' }`, `publicDir: 'public'`, `base: '/'`, `build.assetsInlineLimit: 0`, manualChunks: `three` → `world` chunk.
- [ ] Move `robots.txt sitemap.xml assets/ baytex/ obsidian/ tamarack/` into `public/` (git mv). `s/` stays untracked/excluded.
- [ ] Run `npm run build && npx vite preview --port 4173`; Playwright smoke: `/`, `/privacy`, `/baytex` return 200 and today's `<title>`; `test/*.test.js` still pass (they read source paths — update path constants where files moved).
- [ ] Commit `build: vite scaffold, static passthrough, no behaviour change`.

### Task 2: World modules (bench topology, Clearwater) into `src/world/`
**Files:** copy spike `src/world/*.js` → `src/world/`; delete the `cavity` branch (spec: production has one topology; keep the spike untouched as the dev comparison); apply spec §3: candle at `outside-intermediate`; two legs leaving the notch; positive steel cased vs negative troughs for open-hole; hairline cut edges; contact darkening; forest ⅓ darker; golden-hour light; bullet pulse removed.
**Interfaces (produces):** `buildIsland({tier, glbScene:null}) → { root, parallax, paths, placements, tools, relay, pad, lights, materials, state, pointer, update(t, elapsed, opts), setWind(v), setForestPointer(x,z,s) }`; `buildField({collar, tier}) → { mesh, uniforms, probeAt(v), update(dt, elapsed), setBreath(v), setReveal(v) }`.
- [ ] Copy + strip cavity branch; add `layout.js` constants exactly: `PAY_TOP=-2.4`, `BENCH_Y=-2.55`, `NOTCH={minX:-1.6,maxX:7,minZ:-0.6,maxZ:5}`.
- [ ] `wellPath.js`: `BENCH_JUNCTIONS` toes: J1 `[3.9,4.6]`, J2 `[5.6,4.1]`, J3 `[6.6,3.2],[6.7,2.2]`, J4 `[6.8,1.35],[5.2,-1.6]` — the last two legs (J4b and a new J3b variant) must cross `z=-0.6` into rock; expose `boreMouths()` returning wall-intersection points for the cut-face rings.
- [ ] `terrain.js`: bench material `#241812` r0.42; add `contactDarkening` (a baked radial gradient plane in the inner corner) and `cutEdges` (LineSegments in sand `rgba(232,220,200,.35)` along every cut boundary).
- [ ] `wellSystem.js`: open-hole trunk/legs rendered as troughs only (dark rock-walled), no tube mesh; toe witness ring helper `buildBoreWitness(point, tangent)`; cased stays positive steel; `RADII` = spec telescope.
- [ ] `field.js`: replace lattice with blue-noise jittered, gradient-aligned strokes on the four planes (bench, x=−1.6 wall, z=−0.6 wall, front face x<−1.6); cull below `0.06`; shimmer = value-noise, no `sin(t+r)`; halo sprite at the collar.
- [ ] Node test `test/world-geometry.test.js` (jsdom-free — pure math): heel y ≈ −2.43; every lateral point y within ±0.02 of `BENCH_Y+0.07`; ≥ 2 lateral toes with `z < -0.6`; junction params `[0.10,0.30,0.50,0.72]`; radii telescope strictly decreasing.
- [ ] Commit `feat(world): bench topology, Clearwater strata, staggered fishbone, section-plane field`.

### Task 3: Conductor, camera rig, chapters, DOM restructure
**Files:** copy `conductor.js`, `cameraRig.js`, `chapters.js`; edit `index.html` (DOM order: `#insight` above `#benefits`; `spec-grid` above `journey-list`; strip h2→h3; add `data-chapter` on sections; add `#world` fixed canvas + `#rail`); `src/boot.js`; `src/styles/world.css`.
**Interfaces:** `createScrollConductor({sections, damping, reducedMotion, onUpdate, onChapterChange})`; `createCameraRig(camera, CHAPTERS, {mobile}) → {apply(progress, dt, aspect), parallax, setMobile, poseAt}`; `CHAPTERS[i] = {id, section, weight, camera:{position,target,fov,mobile}, world:{light,cutaway,candle,field,wind,fog,dim}, poses?:[…]}`.
- [ ] Chapters data per spec §4 (7 chapters; ch. 4 has two poses); mobile endpoints authored so the emergency pullback is skipped when a mobile endpoint exists.
- [ ] `boot.js`: renderer (ACES, sRGB, DPR by tier), scene, island + field, rig, conductor; world channels interpolate per frame; on-demand render + 0 RAF when hidden/covered; `Timer.connect(document)`.
- [ ] `main.js`: capability gate (`prefers-reduced-motion`, `saveData`, WebGL2, tier 0) → `import('./boot.js')` else `stills`; inject `modulepreload` only after the gate.
- [ ] Playwright `scripts/frames.mjs`: capture chapters at 1440×900 / 1366×768 / 390×844; console must be clean; `renderer.info` at 0/3/6 within budget.
- [ ] Commit `feat(world): scroll conductor, camera rig, chapter ledger; DOM order per spec`.

### Task 4: Rail (casing tally + chapter nav), motion toggle, reduced-motion stills path
**Files:** `src/ui/rail.js`, `src/ui/motionToggle.js`, `src/ui/stills.js`, `scripts/stills.mjs`, `src/styles/ui.css`.
- [ ] Rail = DOM from first paint: `<nav aria-label="Chapters">` with real anchors (`aria-current`), tally names, formation legend (visible twins for strata), descent/return markers; hash sync via `history.replaceState`; reserved left gutter (`--rail-w`) copy never enters.
- [ ] Motion toggle in the fixed layer (`aria-pressed`, `localStorage('yotin-motion')`), stops render loop, wind, DOM idles.
- [ ] `scripts/stills.mjs` renders 7 WebP stills (≤ 22 KB each) from the built site at fixed chapter poses; `stills.js` swaps them per section with IO; "Show the 3D world" once, only if WebGL2 + tier ≥ 1, loads paused; event `world_optin`.
- [ ] Commit.

### Task 5: CI gates (Gate-1 subset)
**Files:** `scripts/manifest.mjs` (asset → bucket), `scripts/budget.mjs` (gzip sizes, caps, report), `scripts/scroll-length.mjs`, `test/ids-resolve.test.js`, `test/cache-key.test.js`, `test/routes-allowlist.test.js`, `test/physics-sources.test.js`.
- [ ] Manifest: emitted URLs → exactly one bucket; report prints asset/bucket/bytes/total/cap; fail on cap.
- [ ] Scroll length ratio asserted at 1440×900, 1366×768 (≤ 7.5) and 390×844 (≤ 8.5) via Playwright.
- [ ] Reduced-motion smoke: zero `world` bucket requests incl. preloads.
- [ ] Commit; **Gate 1 review**: adversarial audit of the geometry (subagent) + frame review at three widths.

## GATE 2 — chapters 0 / 3 / 6 to final

### Task 6: Chapter 0 surface + chapter 3 signal (materials, candle, field, Close the Circuit)
- [ ] Golden-hour light; sand-tinted flow; wind motes (tier ≥ 2); word-mask H1 (CSS-only); logomark sand until circuit closes.
- [ ] Ch. 3: field reveal on entry/activation; conductive-bed shadow + hover chip with units + `source`; Close the Circuit state machine ("no difference, no reading"); stake drag (qualitative) with range twin; digits first appear on close; portal screen on; label "visual timing not representative".
- [ ] Interactions module: raycast against proxies only, FSM idle/hover/focus/active/unavailable, DOM twins, `hotspot_activate` events.
- [ ] Commit per sub-step; frames re-captured; colour budget assertions.

### Task 7: Chapter 6 fit — qualifier world response + Download schematic
- [ ] `wellBuilder.js` consumes normalized state `{view, lift, fluid, temp, verdict}` from a thin adapter around the existing qualifier render (no logic change); pump marker distinct from proposed collar; 0.9 standoff line; coupling label; masked caption; `Download schematic` PNG (title-block, local-only, masked).
- [ ] Two-column stage ≥ 1100 px; 40 vh band < 1100 px, dropped < 560 px height.
- [ ] Commit; tests: qualifier tests unchanged and green; `data-clarity-mask` on stage + caption asserted.

## GATE 3 — chapters 1 / 2 / 4 / 5, migration, polish

### Task 8: Chapters 1, 2, 4, 5 interactions (strata legend, Inspect tool + chips + gap hotspot, x-ray + fluid-level + focus rig + trend ghost + "surface looks the same", wind + "Two unseen fields")
### Task 9: Probe cursor (gated), icons sprite (8 animations, once), reveal fallback (IO), print stylesheet
### Task 10: Test migration (`site-features.test.js` pointer-bridge block → new hooks), privacy notice (Clarity, localStorage, date), README spec sheet + before/after, `vercel.json` headers for hashed assets, allow-list assertion
### Task 11: Self-improvement loop — Playwright frames at three widths + reduced-motion + no-WebGL; panel critique (Opus/Codex/lead) scores P0–P3; fix; repeat until two consecutive rounds raise nothing above P3

## Execution

Gate 1 Tasks 1–5 executed inline by the lead (highest context on the spike), with a subagent adversarial audit at the gate; Gate 2/3 tasks dispatched to subagents where independent (Task 7 wellBuilder, Task 9, Task 10) with two-stage review, per superpowers:subagent-driven-development.
