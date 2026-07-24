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
- GSAP 3.15.0 + ScrollTrigger, integrity-pinned from jsDelivr, for the load-in, scroll reveals, spec counters, and the pinned drill sequence.
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

Motion is an enhancement, never a dependency. An inline `<head>` script adds
`motion-ready` to `<html>`; that class — not CSS alone — is what hides animated
elements. If GSAP fails to load, `main.js` removes the class and the page renders
fully and statically. Verified by deliberately corrupting the GSAP SRI hash: all
43 animated elements stayed visible.

The `#benefits` drill sequence keeps its six benefits in the DOM once, as the
static fallback grid. When the viewport is wide enough, has a fine pointer, and
motion is allowed, `main.js` promotes that same content into a 380 vh pinned
cutaway. Mobile, touch, reduced-motion, and no-JS all keep the static grid.

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
