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
- GSAP 3.15.0 + ScrollTrigger, pinned from jsDelivr, for progressive motion.
- Phosphor Icons 2.1.2, pinned from jsDelivr.
- Archivo, IBM Plex Sans, and IBM Plex Mono via Google Fonts.
- Existing WebP WellFi cutaway with the prior continuous uplink/downhole-pulse behavior restored; all motion collapses safely under `prefers-reduced-motion`.
- Deep Chat 2.4.2 is integrity-pinned and lazy-loaded from unpkg only when the panel opens, keeping its roughly 400 KB bundle off the initial page load.
- A custom stream adapter preserves the existing `{ messages: [{ role, content }] }` Cloud Run contract; requests abort when the panel closes or the visitor presses stop.
- Model credentials remain server-side. The browser never connects directly to Gemini.

## Structure

```text
index.html          page content, SEO, JSON-LD, and ChatFi shell
styles.css          Yotin design system and responsive layouts
main.js             navigation, motion enhancement, and native ChatFi client
assets/             approved brand, WellFi, and current social-card assets
robots.txt
sitemap.xml
vercel.json         caching and security headers
```

## Local preview

```powershell
Set-Location "C:\Users\kyle\MPS\Yotin-web"
py -3 -m http.server 5050
```

Open `http://localhost:5050/`. ChatFi's development CORS policy allows `localhost`; it intentionally rejects `127.0.0.1`.

## Verification

```powershell
node --check .\main.js
rg -n -i "sand control|flow control|slotted|multilateral" .\index.html .\main.js .\styles.css
```

Visual QA is recorded in `design-qa.md`.

## ChatFi release gate

The UI is ported, but the live backend currently allows the MPS production origin and localhost—not the Yotin production domains. Its system prompt, fallback messages, lead routing, and corpus also describe MPS. Before enabling ChatFi on production:

1. Approve one public sentence defining the Yotin / MPS / WellFi commercial relationship and where leads go.
2. Update the backend origin allowlist and public-facing identity in one coordinated change.
3. Add a clear privacy link, bot proof, and a shared hard model-usage cap.
4. Re-run the server unit, type, adversarial, CORS, consented-lead, and mobile gates.

## Deploy

Vercel serves this directory directly. Framework preset: **Other**; no build command; output directory `.`.
