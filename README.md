# Yotin Energy — website

Static marketing site for **Yotin Energy**, an Indigenous-owned energy services
company (sand control, flow control, and Well-Fi wireless downhole telemetry).

Imported from the Claude Design project and rebuilt as a production-grade,
zero-build static site.

## Stack

- Plain **HTML + CSS + JS** — no framework, no build step.
- Fonts: Archivo (display), IBM Plex Sans (body), IBM Plex Mono (data) via Google Fonts.
- Hero images shipped as **WebP** (re-encoded from the 3 MB design PNGs → ~200 KB).
- Progressive enhancement: scroll reveals, stat count-ups, sticky nav, mobile menu,
  and a `yôtin` (Cree for *wind*) motif — all degrade gracefully and respect
  `prefers-reduced-motion`.

## Structure

```
index.html          # the page (all copy + JSON-LD baked in)
styles.css          # design system
main.js             # interactions (reveals, counters, nav)
assets/             # webp heroes, icon, slotted-liner schematic
robots.txt, sitemap.xml
vercel.json         # headers + asset caching
design-source/      # original Yotin Energy.dc.html (reference only, not deployed)
```

## Local preview

```bash
# any static server works, e.g.
npx serve .
# or
python -m http.server 5050
```

## Deploy to Vercel

The project needs **no build** — Vercel serves it as static files.

```bash
npm i -g vercel      # if not already installed
vercel               # preview deployment
vercel --prod        # production deployment
```

Or connect the Git repo in the Vercel dashboard (Framework preset: **Other**,
Build command: none, Output directory: `.`).

## Notes / TODO

- **Canonical domain** is assumed to be `https://yotinenergy.ca` (from the contact
  email). Update `index.html` (`og:*`, canonical, JSON-LD), `robots.txt`, and
  `sitemap.xml` if the real domain differs.
- Contact is a `mailto:` to `info@yotinenergy.ca`. Swap for a form + backend if
  lead capture is wanted later.
- The design's `heroRender` toggle (SAGD vs multilateral) is baked to SAGD in the
  hero; the multilateral render is used in the Flow Control section.
