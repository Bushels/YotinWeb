# Yotin Energy — website

Static marketing site for **Yotin Energy**, an Indigenous energy services company based in Pierceland, Saskatchewan. The public v1 focuses on **WellFi wireless downhole telemetry** and the Yotin company story.

## Public scope

- Yotin company positioning and Indigenous ownership.
- WellFi telemetry: pressure, temperature, vibration, and fluid-condition data without a downhole cable.
- Deep Chat-powered ChatFi interface connected to the existing Cloud Run API.
- Candidate-well contact path.

Future equipment is intentionally not included in the deployed site until it is launch-ready.

## Stack

- Plain **HTML + CSS + JavaScript** — no framework or build step.
- Reveals use **native CSS scroll-driven animation** (`animation-timeline: view()`). No library, no main-thread scroll handlers, and progress is bound to scroll position rather than fired once on a threshold.
- GSAP 3.15.0 + ScrollTrigger, integrity-pinned from jsDelivr, is loaded **only** for the scrubbed drill sequence, or as the reveal fallback on browsers without native scroll-driven animation. Phones download none of it.
- Phosphor Icons 2.1.2, pinned from jsDelivr.
- Space Grotesk for the WellFi hero, plus Archivo, IBM Plex Sans, and IBM Plex Mono via Google Fonts.
- The hero embeds the canonical live WellFi R3F scene from `mpsgroup.energy/wellfi/animation`; the local WebP poster is first paint, and the permanent fallback for reduced-motion, Save-Data, and any load failure.
- Deep Chat 2.4.2 is integrity-pinned and lazy-loaded from unpkg only when the panel opens, keeping its roughly 400 KB bundle off the initial page load.
- A custom stream adapter preserves the existing `{ messages: [{ role, content }] }` Cloud Run contract; requests abort when the panel closes or the visitor presses stop.
- Model credentials remain server-side. The browser never connects directly to Gemini.

## Structure

```text
index.html          page content, SEO, JSON-LD, and ChatFi shell
styles.css          Yotin design system and responsive layouts
main.js             navigation, motion enhancement, drill sequence, Deep Chat adapter
assets/             approved brand, WellFi, and current social-card assets
robots.txt
sitemap.xml
vercel.json         caching and security headers
```

## Design system

The accent family is **ember + sand**. Cyan is retired from all UI chrome — it
survives only inside the embedded R3F well scene and the EM transmission glow,
where it reads as *signal* rather than as brand. Hairlines are sand-tinted
(`rgba(232,220,200,…)`) rather than white; a cold white rule on near-black was
the strongest "generic dark template" tell on the page.

| Token | Value | Use |
| --- | --- | --- |
| `--ember` | `#f27622` | eyebrows, icons, primary CTA, counters |
| `--ember-ink` | `#9f470d` | the only ember safe for text on `--paper` |
| `--sand` | `#e8dcc8` | secondary accent, hairlines, quiet structure |

## Motion

Motion is an enhancement, never a dependency. Modern browsers animate reveals
purely in CSS. Only browsers **without** `animation-timeline: view()` get the
`motion-ready` class from the inline `<head>` script, and that class — not CSS
alone — is what hides elements for the GSAP fallback. If GSAP fails to load,
`main.js` removes the class and the page renders fully and statically. Verified
by deliberately corrupting the GSAP SRI hash: all 43 animated elements stayed
visible.

The `#benefits` drill sequence keeps its six benefits in the DOM once, as the
static fallback grid. When the viewport is wide enough, has a fine pointer, and
motion is allowed, `main.js` promotes that same content into a 260 vh pinned
cutaway and **removes** the fallback. Mobile, touch, reduced-motion, and no-JS
all keep the static grid.

### Travelling spotlight pattern

Several groups (signal strip, telemetry channels, spec tiles, company marks)
use a sweep rather than a plain reveal: each item rises out of a dim rest
state, peaks, then settles back as the next takes over. The keyframe floor is
~0.3 and the settle is ~0.75 — **never 0** — because an item on screen has to
stay readable whether or not it currently holds the highlight.

Items that share a grid row get identical `view()` progress, so the cascade
only exists because each item's `animation-range` is offset by 5–9% of the
cover phase. Those offsets are scoped to the breakpoint whose layout needs
them: once a grid wraps, rows stagger naturally and keeping the offsets would
leave the last item dim well after it is on screen.

### Three traps in scroll-driven animation (all hit on this site)

1. **`overflow: hidden` creates a scroll container.** A `view()` timeline binds
   to its nearest scroll-container ancestor, so any `overflow: hidden` between
   the element and the document silently freezes it — no error, just a stuck
   animation. Worse, `body { overflow-x: hidden }` computes `overflow-y` to
   `auto`, making `<body>` a scroll container even though the *document*
   scrolls. That put `.company-mark` at −461% progress. **Use `overflow: clip`**
   (with a `hidden` line before it as the fallback). Applies to `body`,
   `.hero`, `.channel-card`, `.device-banner`.
2. **The range must resolve to 100% while the element is comfortably visible.**
   Ending at `cover 46%` left the signal strip stuck at 0.76 opacity on a
   1440px-tall monitor, because an element already on screen at load never
   reaches that point. `cover 30%` puts the element's top at ~66% down the
   viewport, and that ratio barely moves between 720px and 1440px tall.
3. **Prefer `cover` over `entry` for reveals.** An `entry`-based end is scaled
   by the *element's* height, so it drifts badly between a 130px card and a
   500px block. `cover` is scaled by the viewport.

A fire-and-forget tween has a fourth failure mode worth remembering: triggering
at `top 88%` meant the 0.7s animation finished while the element was still in
the bottom 13% of the screen, so nothing ever appeared to respond to scrolling.
Scroll-*linked* beats scroll-*triggered* for anything the reader is looking at.

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

## Cache keys — read before editing CSS or JS

`vercel.json` serves `styles.css` and `main.js` with
`Cache-Control: public, max-age=86400, must-revalidate`, and `index.html`
references them with a manual key: `styles.css?v=YYYYMMDD-N`.

**Any commit that changes either file must bump that key in the same commit.**
Without it, anyone who loaded the site in the previous 24 hours gets the *new*
HTML against the *old* cached CSS and JS. The origin and CDN are correct, so
this is invisible in a fresh browser or behind a cache-busted URL — it only
hits real returning visitors. It has bitten this project twice.

To verify a deploy landed, check the **asset** under its new key, not the HTML:

```bash
curl -s "https://yotinenergy.com/styles.css?v=20260724-3" | grep -c animation-timeline
```

## Analytics

Google Analytics 4 is wired but **inert**. `index.html` contains a gated
snippet that makes no request and defines no globals until
`GA_MEASUREMENT_ID` is a real `G-XXXXXXXXXX` value. A placeholder id would fire
hits at a non-existent property and quietly poison the data, so the guard is a
regex rather than a comment.

To turn it on:

1. Sign in to <https://analytics.google.com> as **kyle@bushelsenergy.com**.
2. Admin → Create → Property. Name `Yotin Energy`, timezone
   `(GMT-07:00) Edmonton`, currency `CAD`.
3. Create a **Web** data stream for `https://yotinenergy.com`. Leave Enhanced
   Measurement on — it gives scroll depth, outbound clicks and site search for
   free, which matters on a one-page site.
4. Copy the **Measurement ID** (`G-…`) into `GA_MEASUREMENT_ID` in
   `index.html`, bump the `?v=` keys, commit, push.
5. Add `www.yotinenergy.com` and `yotin-energy.vercel.app` as additional
   stream domains if you want them counted.
6. In Admin → Data Settings → Data Retention, raise event retention from the
   2-month default to 14 months.

Two things to settle before switching it on:

- **Privacy notice.** GA sets cookies and sends visitor data to Google. The
  README release gates already list a privacy link as outstanding; that should
  land first, and under PIPEDA a short plain-language notice is the minimum.
- **Vercel Web Analytics** is a cookie-free alternative that needs no banner
  and no consent plumbing. If the goal is just traffic shape rather than
  Google-ecosystem reporting, it is materially less work.

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
node --test test/qualifier-logic.test.js test/faq-parity.test.js
```

Node's built-in runner. No dependencies, no `package.json`, no build step — the
site keeps its plain HTML/CSS/JS property, and `test/` is excluded from the
deploy. (Pass the files explicitly; `node --test test/` does not resolve the
directory reliably on Windows.)

Two things are covered, and the choice is deliberate. Layout bugs are visible
the moment you look at the page; **wrong numbers are not**. The qualifier
decides what an operator is told about their own well, and its constants are
real product limits — the 150 °C rating, the ~10% standoff rule. A wrong
threshold does not throw or look broken. It returns a confident, wrong answer.

- `qualifier-logic.test.js` — thresholds and rounding, casing-length bounds and
  their error text, flag-to-note coverage, and all three verdict paths
  including that above-150 °C outranks everything else.
- `faq-parity.test.js` — the FAQ exists twice in `index.html`, as JSON-LD for
  crawlers and as rendered `<details>` for people. This fails if they drift.

Both suites exist because of a Flutter port that was later abandoned (see the
`archive/flutter-*` tags). Rewriting the qualifier in another language forced
every implicit rule to become explicit, and the exercise showed the failure
mode was never bad code — it was *two copies of the same sentences and numbers
that no compiler checks*. Extracting the logic here found a real bug on the
first run: at the minimum 50 m casing, rounding `0.9 × 50 = 45` to the nearest
10 m put the landing threshold **on the shoe itself**, so the question offered
an impossible "deeper" option and an unflagged "shallower" option that included
landing at the shoe — the exact case the rule exists to catch.

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

```powershell
Set-Location "C:\Users\kyle\MPS\Yotin-web"
py -3 -m http.server 5050
```

Open `http://localhost:5050/`. ChatFi's development CORS policy allows `localhost`; it intentionally rejects `127.0.0.1`.

The hero's live R3F scene points at `127.0.0.1:3001` on localhost, so the hero
shows the poster locally unless the WellFi dev server is also running
(`cd wellfi-marketing/site && next dev -p 3001`). This is expected; production
uses `mpsgroup.energy`.

## Verification

```powershell
node --check .\main.js
rg -n -i "sand control|flow control|slotted|multilateral" .\index.html .\main.js .\styles.css
```

Visual QA is recorded in `design-qa.md`.

## Production status

- GitHub repository: `Bushels/YotinWeb`, branch `master`.
- Vercel project: `yotin-energy`; a push to `master` automatically creates the production deployment. The final Option 3 implementation is commit `a3f4330bdc8c7ccfbcaebc89937192594da24f96`, released Ready as Git-sourced production deployment `dpl_2YoH5wH16hLfPocjVpNdE4YUgjjN`.
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

The normal release path is a reviewed commit followed by `git push origin master`. Vercel serves this directory directly and deploys that Git commit automatically. Framework preset: **Other**; no build command; output directory `.`. A manual `vercel --prod` deployment is not part of the release path.
