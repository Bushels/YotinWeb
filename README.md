# Yotin Energy — website

Marketing site for **Yotin Energy**, an Indigenous energy services company based in Pierceland, Saskatchewan. The public site focuses on **WellFi wireless downhole telemetry** and the Yotin company story, told through one persistent three.js world — a sectioned lease with a real well in it — that the page scrolls through in seven chapters.

## Public scope

- Yotin company positioning and Indigenous ownership.
- WellFi telemetry: pressure, temperature, vibration, and fluid-condition data without a downhole cable.
- Deep Chat-powered ChatFi interface connected to the existing Cloud Run API.
- Candidate-well contact path.

Future equipment is intentionally not included in the deployed site until it is launch-ready.

## Stack

- **three.js 0.185 (WebGLRenderer) + vanilla ES modules + Vite 8.** One persistent canvas, one world, seven camera chapters driven by native scroll (no scroll-jacking). No framework, no R3F, no WebGPU.
- `index.html` is still the page: every claim, FAQ, number and form lives in the DOM. The world is an enhancement layered under it and can be absent without losing a sentence.
- **Capability gate before any three.js byte** (`src/gate.js`): reduced motion, Save-Data, no WebGL2, or a tier-0 GPU → the *stills path* (seven pre-rendered chapter stills, lazy, zero world requests). Visitors can also pause motion (`Pause motion`, remembered in `localStorage`).
- Phosphor Icons 2.1.2 (jsDelivr). Archivo, IBM Plex Sans and IBM Plex Mono. GSAP 3.15 + ScrollTrigger load **only** on the stills path as the desktop drill-sequence fallback; the world path never requests it.
- Deep Chat 2.4.2 is integrity-pinned and lazy-loaded from unpkg only when ChatFi opens; model credentials stay server-side.
- Analytics: GA4 + Microsoft Clarity, both guarded off on localhost; anything echoing a qualifier answer carries `data-clarity-mask`.

Design spec (panel-converged, authoritative): `docs/superpowers/specs/2026-08-19-yotin-threejs-world-design.md`. Plan: `docs/superpowers/plans/2026-08-19-yotin-threejs-world.md`. After the build, a self-improvement loop (three critics — Opus 5, Codex, Fable — over captured frames with adversarial verification) ran round by round; every confirmed finding was fixed or recorded as a decision for Kyle in spec §14.

### Spec sheet — measured, CI-enforced

`npm run check` builds, writes `dist/asset-manifest.json` (every shipped byte in a bucket), fails the build when a cap is exceeded (`scripts/budget.mjs`), runs the stills colour gate (`scripts/colour-gate.mjs`: saturated cyan only in the chapter-3 still, no stale stills) and the test suites. Figures are gzip, from the current build:

| Bucket | Cap | Measured |
| --- | --- | --- |
| `critical` (HTML, CSS, fonts, ch-0 still, marks) | 290 KB | 227 KB |
| `ui` (one chunk; never imports three) | 60 KB | 21 KB |
| `world` (three + world modules, one chunk, dynamic import) | 215 KB | 201 KB |
| stills (ch 0–6, lazy) | ≤ 22 KB each after ch-0 | 103 KB total |
| Reduced-motion first paint (excl. fonts/marks/ui) | 127 KB | 73 KB |
| Reduced-motion full scroll, all-in | 470 KB | 223 KB — **zero world requests** (`scripts/rm-smoke.mjs`) |

Runtime (`npm run check:runtime`, `renderer.info` at every chapter anchor, asserted): desktop tier 3 peaks 76 calls / 121 k tris against ≤ 80 / 130 k (the sun shadow pass counted); phone tier 1 peaks 54 / 46 k against ≤ 56 / 62 k. The same job asserts no horizontal overflow at any anchor and the one-candle rule (saturated cyan present in chapter 3, absent elsewhere). Scroll length (`npm run check:scroll`): 10.4 viewports desktop · 11.6 laptop · 13.95 phone, asserted at +0.3 — the page *is* the content; the conversion path (hero → header **Check your well fit** → qualifier Q1) is one click. Interaction states (`npm run capture:interactions`): orbit, circuit closed / no-difference, x-ray, pump-off, three fit verdicts.

### Before / after

| | Before (Aug 2026) | After |
| --- | --- | --- |
| Hero | cross-origin iframe of the WellFi R3F scene, postMessage pointer bridge, CSS idle drift | same-origin three.js world under the whole page; pointer parallax + forest parting; poster = chapter-0 still |
| Scroll | native reveals + one pinned GSAP drill sequence | native scroll conductor; seven chapters; hard-cut arrival on anchor links |
| Interaction | hover reveals | hotspot registry: every 3D object has a ≥ 44 px DOM twin; hover/focus/tap/keyboard all reach the same state; Close-the-Circuit, tool channels, deployment, qualifier → schematic |
| Accessibility | reduced-motion = fewer reveals | reduced-motion / Save-Data / no-WebGL2 → complete page with stills, no world bytes; print stylesheet |
| Build | none (`python -m http.server`) | Vite multi-page build to `dist/`, hashed `/_app/` immutable, asset manifest + budgets in CI |
| Tests | 2 suites | 14 suites / 121 tests + 5 scripted gates (budget, colour, reduced-motion smoke, runtime, scroll): geometry ledger, ids resolve, claims ("160+", no count-up through false values, no metres), physics sources, stills path, tool twins, fit privacy, routes allow-list, cache keys, privacy notice |

## Structure

```text
index.html, privacy.html   the pages (all copy, FAQ/JSON-LD, qualifier config)
styles.css, main.js        legacy design system + progressive layer (nav, qualifier, ChatFi, stills-path drill)
src/main.js                entry: gate → legacy → UI mounts → dynamic import('./boot.js') when the world is on
src/gate.js                synchronous capability decision (world vs stills)
src/boot.js                renderer, rig, island, conductor, interactions, pointer, hard cuts, pause/visibility
src/chapters.js            CHAPTERS (anchors, channels) and camera POSES
src/conductor.js           native-scroll progress (exact + damped), chapter events, jumpTo
src/cameraRig.js           Catmull-Rom camera through POSES (camera-convention lookAt)
src/interactions.js        hotspot registry: raycast FSM + DOM twins, chapter gating, analytics
src/world/                 layout ledger, well paths, terrain bench, well system, WellFi tool, field, forest, wind, circuit, props
src/ui/                    rail, signal (circuit), descent, probe, tool, deployment, fit, motion toggle, stills
src/styles/                world, rail, signal, probe, tool, fit, stills, print
public/                    copied verbatim: assets (stills, marks, fonts), robots, sitemap, operator routes
scripts/                   manifest, budget, colour-gate, scroll-length, rm-smoke, stills (Playwright + sharp), frames, capture-all, interactions
test/                      node:test suites (npm test)
docs/superpowers/          design spec and plan
vercel.json                build command, immutable /assets and /_app, security headers
```

## Design system

The accent family is **ember + sand**. Cyan is retired from all UI chrome — it
survives only as *transmission* inside the world (the EM candle at the open-hole
anchor, the field strokes, a closed measurement loop), where it reads as
*signal* rather than as brand (the one-candle rule, spec §2). Hairlines are sand-tinted
(`rgba(232,220,200,…)`) rather than white; a cold white rule on near-black was
the strongest "generic dark template" tell on the page.

| Token | Value | Use |
| --- | --- | --- |
| `--ember` | `#f27622` | eyebrows, icons, primary CTA, counters |
| `--ember-ink` | `#9f470d` | the only ember safe for text on `--paper` |
| `--sand` | `#e8dcc8` | secondary accent, hairlines, quiet structure |

## Motion

Motion is an enhancement, never a dependency. The world renders on demand (a frame when scroll, pointer or a
wind tick asks for one), pauses when the tab is hidden, survives context loss, and is gated by `src/gate.js`
before a byte of three.js is requested. One-candle colour rule: cyan is *transmission only* (the EM candle at
the open-hole anchor, the field strokes, a closed circuit), ember is surface, sand is readable light.

On the stills path the seven chapter stills (`public/assets/stills/ch0–6.webp`, regenerated by
`node scripts/stills.mjs`) sit where the canvas would be, reveals are plain CSS, and the desktop drill
sequence in `#benefits` keeps its GSAP fallback. Mobile, touch, reduced-motion and no-JS all keep the
static grids.

## Candidate-well qualifier

Six questions in `#contact`. The decision logic — question set, thresholds,
flags and verdict — lives in **`qualifier-logic.js`**; `main.js` renders it and
owns nothing about the outcome. Selecting an answer auto-advances, no Next
buttons. The verdict is computed client-side and shown **before** any contact
details are requested.

**It can decline to say yes, and that is the point.** A qualifier that always
says yes is a lead form with extra steps, and this audience spots that
immediately. Every threshold traces to a spec published elsewhere on the page —
nothing is invented.

Three outcomes: **Strong fit** (nothing flagged), **Likely fit — worth a
review** (flags raised, each with a plain-language reason), and **above 150 °C**,
which is a *waitlist, not a rejection* — 150 °C is the tool's current rating and
a higher-temperature version is in development, so that answer routes to a
follow-up rather than a dead end. It outranks every other flag.

### The pump-landing rule, and the derived question

The collar needs roughly **10% of the intermediate casing's length of standoff
above the shoe** — `(shoe depth − pump depth) >= 0.10 × intermediate length`.
Landed deeper than that, WellFi runs **outside** the intermediate instead of
inside the tubing.

This tracks the EM physics recorded in the WellFi hero design spec: the
formation is the antenna, and an emitter sitting at the cemented cased shoe
couples at roughly 0.1%.

Rather than ask the engineer to compute a proportion, the qualifier asks for
the **intermediate casing length as a number**, then *derives* the next
question from it. Enter 1000 and the follow-up reads "Is the pump landed
shallower or deeper than **900 m**?" — one tap, no arithmetic. That is why the
length step is a numeric input and not bands: a banded answer would make the
derived threshold meaningless.

The input is `type="text"` with `inputmode="numeric"` rather than
`type="number"`, which raises the phone keypad without inheriting number-input
quirks (scroll-wheel value changes, locale parsing, spinners).

Failing the standoff is a **deployment-method note, not a disqualifier** — the
well is still a candidate, the install just changes.

### Above 150 °C is a waitlist, not a rejection

Nothing in the qualifier hard-disqualifies any more. Over 150 °C returns
"**high-temp version in development**", explains that the higher-temperature
build is in progress, and switches the CTA to *Have Yotin follow up*. The
mailto subject changes to `Candidate well — awaiting 150 °C+ WellFi` so the
team can triage the waitlist separately from live candidates.

Submission is a prefilled `mailto:` carrying the full well summary, plus a
**Copy summary** button. The copy button is the real fallback: corporate
machines often have no mail client bound, and a dead `mailto:` is a dead lead.
The direct address stays visible above the widget regardless.

Without JavaScript the widget stays `hidden` and the direct email remains the
contact path.

## Cache keys

No manual keys any more. Vite hashes every bundle into `/_app/` and `vercel.json` serves `/_app/` and
`/assets/` as `immutable`; `index.html` is never cached for more than a revalidation. `styles.css` and
`main.js` are bundled through the same pipeline (`test/cache-key.test.js` asserts nothing is referenced
by an unhashed URL). Regenerated stills are new bytes at the *same* URL — bump the still file names
(or `scripts/stills.mjs` output names) if a still changes after launch.

## Analytics

Google Analytics 4 is **live** on property `G-9VQJHQ1L59` as of 2026-08-06.
The snippet in `index.html` keeps its regex guard on the Measurement ID, so
blanking the id disables everything cleanly rather than firing hits at a
property that does not exist.

`anonymize_ip` is set explicitly. GA4 truncates IPs by default; the flag is
there so an audit can see the intent in the source rather than trusting a
default.

**Local development never reaches the property.** The snippet sets
`window["ga-disable-G-9VQJHQ1L59"] = true` on `localhost`, `127.0.0.1` and
`[::1]`. GA4 reads that flag before transmitting, so the tag still loads and
the whole code path runs — it just sends nothing. This is deliberate in
preference to filtering internal traffic by IP after the fact: a developer
cannot skew the numbers by forgetting, and the funnel stays testable locally.

### Outstanding — now user-facing, not theoretical

- **Privacy notice.** The site now sets Google cookies and sends visitor data
  on every page view. Under PIPEDA a short plain-language notice is the
  minimum, and there is currently no privacy link on the page. This was
  acceptable to defer while the tag was inert; it is not any more.
- **Consider Vercel Web Analytics** alongside or instead. It is cookie-free and
  needs no banner. It will not give the custom qualifier funnel below, so it is
  a complement rather than a swap if the verdict split matters.

### Property settings still worth doing

1. Add `www.yotinenergy.com` and `yotin-energy.vercel.app` as additional stream
   domains if you want them counted.
2. Admin → Data Settings → Data Retention: raise event retention from the
   2-month default to **14 months**. The default silently discards history.
3. Mark `qualifier_send` as a **key event** (formerly "conversion") so it
   appears in reporting as the outcome rather than as one custom event among
   nine.
4. Register `fit`, `step_key` and `answer` as **custom dimensions**. GA4 will
   not let you segment by an event parameter until you do, so the verdict split
   is collected but unreportable without this step.

### Qualifier funnel events

The candidate-well qualifier is the conversion mechanism of this page and its
only outcome is a `mailto:`, so `main.js` emits a funnel. These are custom GA4
events; they are **already in the code and already inert** — `track()` returns
immediately while `gtag` is undefined, which is the case until the Measurement
ID above is set. Nothing further needs editing in `main.js` to switch them on.

| Event | Parameters | Answers |
| --- | --- | --- |
| `qualifier_view` | — | How many people reach the qualifier at all. The funnel denominator. |
| `qualifier_start` | — | How many begin, once, per attempt. `view → start` is the hook's conversion. |
| `qualifier_step` | `step_index`, `step_key`, `answer` | Which question loses people, and the distribution of answers. |
| `qualifier_input_error` | `step_key`, `reason` | Whether the casing-length field is asking for a figure visitors don't have to hand. |
| `qualifier_back` | `step_index`, `step_key` | Hesitation — a question that gets reconsidered is a question worth rewording. |
| `qualifier_result` | `fit`, `flag_count`, `flags` | The verdict split. This is a **product** signal: a page full of `future` results is roadmap information, not a marketing problem. |
| `qualifier_send` | `fit` | Mail client invoked. The closest thing to a conversion; it cannot confirm the mail was sent. |
| `qualifier_copy` | `fit`, `ok` | The mailto fallback. A high copy rate — or `ok:no` — means the primary path is failing for this audience. |
| `qualifier_restart` | `fit` | Re-runs, usually a second well. |

Two rules if you extend this, both enforced by convention rather than by code:

- **Never send free text.** Every value above is either a fixed string from
  `QUALIFIER_STEPS` or a bucket. The one number a visitor types — intermediate
  casing length — is transmitted as a range (`1500_1999`), never the exact
  figure, because a specific length plus a temperature and a lift type starts
  to describe an identifiable well.
- **Never let analytics break the funnel.** `track()` swallows its own errors.
  A qualifier that fails because a tag manager is blocked is a lost lead.

## Tests

```bash
npm test
```

```bash
npm run check
```

`npm test` runs fourteen `node:test` suites (121 tests). `npm run check` builds, runs the resource budgets,
the stills colour gate and the suites. Three more checks run on demand against the dev server: `npm run
check:rm` (Playwright, reduced-motion smoke — zero world requests, rail present with aria-current),
`npm run check:runtime` (draw calls / triangles per chapter, overflow, one-candle) and `npm run check:scroll`.

Layout bugs are visible the moment you look at the page; **wrong numbers are not**. So the suites bias
toward things a human would not notice: the qualifier's thresholds (`qualifier-logic.test.js`), FAQ ↔
JSON-LD parity, the claims contract ("160+", no manufacturer, no printed metres — `claims.test.js`),
physics figures with sources (`physics-sources.test.js`), the world's geometry ledger
(`world-geometry.test.js`), every `href="#…"` and `data-hotspot` resolving (`ids-resolve.test.js`), the
stills path importing no world module (`stills-path.test.js`, `fit-privacy.test.js`), tool/deployment
twins ≥ 44 px with labels (`tool-twins.test.js`), the operator routes allow-list, and the privacy notice
naming exactly the third parties the page contacts.

The qualifier suite exists because of a Flutter port that was later abandoned (see the
`archive/flutter-*` tags): rewriting the logic forced every implicit rule to become explicit and found a
real bug on the first run — at the minimum 50 m casing, rounding `0.9 × 50 = 45` to the nearest 10 m put
the landing threshold **on the shoe itself**.

## SEO

Implemented on-page:

- One `<h1>`, clean `h2`/`h3`/`h4` outline, no duplicate headings (the drill
  fallback is *removed* rather than hidden when the pinned version takes over,
  which previously produced two of every benefit heading).
- Three JSON-LD blocks: `Organization`, `Product` (WellFi, with spec
  `additionalProperty` rows), and `FAQPage` with five questions written against
  real search phrasing — "does WellFi need a downhole cable", "what does WellFi
  measure".
- Canonical URL, `og:locale`, full OpenGraph and Twitter cards, `en-CA`.
- Meta description rewritten to lead with the capability and the 160 figure.
- Every image has explicit `width`/`height` (including the JS-injected
  formation pass) so nothing shifts on decode; below-fold images are lazy.
- `sitemap.xml` + `robots.txt`.

### What still moves the needle — and only you can do it

Ranked by likely return for a single-page Canadian oilfield services site:

1. **Google Business Profile** for Pierceland, SK. Local pack placement for
   "downhole telemetry Saskatchewan" is winnable and a one-page site otherwise
   has no local signal at all.
2. **Backlinks from industry bodies.** PTAC, Energy Safety Canada, SIGA/
   Indigenous procurement directories, and any operator case study. A handful
   of relevant .ca links outperform any amount of on-page work.
3. **Give the content room to rank.** One page can only target one cluster.
   The highest-value additions are a WellFi spec page, a "planned PCP
   changeout" explainer, and one anonymised candidate-well case study — each
   targeting a distinct query set and each linking back to the contact CTA.
4. **Register both properties in Google Search Console** (apex + www), submit
   the sitemap, and watch Core Web Vitals. This is also the only reliable way
   to see which queries you already surface for.
5. **Get the FAQ answers onto the visible page**, not just in JSON-LD. Google
   increasingly wants the text to exist in the DOM for FAQ eligibility, and the
   questions are genuinely what an engineer asks first.
6. **Keep the 160 figure consistent everywhere**, including ChatFi's
   server-side knowledge base, which lives in the Cloud Run service and is
   **not** in this repo. A chat that says 130 while the page says 160 reads as
   carelessness.

## Local preview

```bash
npm install
```

```bash
npm run dev
```

Vite serves `http://localhost:5173/`. ChatFi's development CORS policy allows `localhost`; it rejects
`127.0.0.1`. Under a software renderer (headless Chromium / SwiftShader) the gate chooses the stills
path; append `?world=1` to force the world. `npm run preview` serves the production build on 4173.

Frames for review: `node scripts/frames.mjs --url "http://localhost:5173/?world=1" --out scratch/frames`
captures every chapter anchor; `node scripts/capture-all.mjs` does it for three viewports plus the
reduced-motion page.

## Verification

```bash
npm run check
```

```bash
npm run check:rm
```

Then look: `scratch/frames/ch*-1440x900.png` (and 1366×768, 390×844, `rm-*.png`). Visual QA of the
pre-world site is recorded in `design-qa.md`; the world's design reviews live in the spec (§13–14).

## Production status

- GitHub repository: `Bushels/YotinWeb`, branch `master`.
- Vercel project: `yotin-energy`; a push to `master` automatically creates the production deployment (build command `npm run build`, output `dist/`). The three.js world build is on `master` from 2026-08-19; the last static-site production deployment was commit `a3f4330b` (`dpl_2YoH5wH16hLfPocjVpNdE4YUgjjN`).
- Public Vercel alias: `https://yotin-energy.vercel.app`.
- Canonical production domain: `https://yotinenergy.com`; both the apex and `www` domains are claimed by the Vercel project.
- Porkbun DNS is still parked. The remaining registrar change is `A @ -> 76.76.21.21` and `A www -> 76.76.21.21`. Preserve the existing Porkbun MX records and SPF TXT record.

## ChatFi status and remaining release gates

Production CORS is complete. Cloud Run revision `chatfi-server-00023-x2x` allows the exact Yotin production origins and the MPS production origin; disallowed and lookalike origins receive no CORS permission. The release passed 183/183 unit tests, a clean TypeScript build, 20/20 live adversarial probes, and a real browser-origin POST from the Vercel alias.

Before broad promotion:

1. Approve one public sentence defining the Yotin / MPS / WellFi commercial relationship and lead destination. ChatFi still identifies MPS as the Canadian commercial contact and routes leads to MPS.
2. Add a clear privacy link, bot proof such as Turnstile, and a shared hard model-usage cap.
3. After Porkbun DNS and TLS settle, re-run desktop/mobile browser QA and a live ChatFi exchange on both `yotinenergy.com` and `www.yotinenergy.com`.

## Deploy

Reviewed commit, then `git push origin master`. Vercel builds with `npm run build` (Node 22, `.nvmrc`)
and serves `dist/`; `/assets/` and `/_app/` are immutable, `index.html` revalidates. Framework preset
**Other**. A manual `vercel --prod` deployment is not part of the release path.
