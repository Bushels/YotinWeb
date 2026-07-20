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
main.js             navigation, motion enhancement, and Deep Chat adapter
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

## Production status

- GitHub repository: `Bushels/YotinWeb`, branch `master`.
- Vercel project: `yotin-energy`; a push to `master` automatically creates the production deployment. The connection was proven with Git-sourced production deployment `dpl_H6r2acLMEzdmfVjdSp6ECsDcqyJi`.
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
