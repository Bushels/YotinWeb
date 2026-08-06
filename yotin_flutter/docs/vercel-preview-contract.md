# Approval-gated Vercel preview contract

## Status

**Not applied.** This document deliberately does not modify the public static
site, its `vercel.json`, or its production deployment. It is the exact release
contract to use once an isolated preview is authorized.

## Product boundary

```text
Static Yotin root       canonical marketing, search, structured data
        |
        +-- /field-review   Flutter candidate-well review (preview first)
```

`/field-review` is an interactive field-review tool, not a public-homepage
replacement. The static root remains the canonical crawlable document unless
it independently clears SEO, accessibility, payload, and conversion-parity
gates.

## Inputs that must be exact

1. Run `tool/build_field_review.ps1 -NoPub` successfully.
2. Publish the resulting `build/field-review/` directory as static files below
   `/field-review/` in a **Vercel preview**, never by replacing the root site.
3. Do not add `Cross-Origin-Opener-Policy` or `Cross-Origin-Embedder-Policy`
   yet. The app intentionally forces single-threaded Skwasm because its
   canonical R3F hero is cross-origin and needs a preview-origin compatibility
   test first.
4. Keep the current public-root security headers. Scope any new cache rules to
   the field-review route only.

## Hosting contract

The approved preview must demonstrate all of the following:

| Request | Required result |
| --- | --- |
| `/field-review` and `/field-review/` | One canonical form, with the other safely redirecting to it; Flutter's `/field-review/` base path must still resolve all child assets. |
| `/field-review/main.dart.wasm` | `200`, real Wasm bytes, and `Content-Type: application/wasm`. |
| `/field-review/canvaskit/skwasm.wasm` | `200`, real Wasm bytes, and `Content-Type: application/wasm`. |
| `/field-review/assets/FontManifest.json` | `200` JSON containing the local Roboto fallback. |
| `/field-review/assets/assets/fonts/roboto/v32/KFOmCnqEu92Fr1Me4GZLCzYlKw.woff2` | `200`; this is the engine's configured local fallback location. |
| Flutter HTML / bootstrap / worker | Revalidated on deploy; do not mark un-hashed files immutable. |
| Large renderer and static assets | Cache only after a repeat-visit measurement proves the invalidation strategy works. |

The release build already carries a local renderer base, local Google Fonts,
and a local engine-font fallback. A preview must not replace those with a CDN
or add a broad SPA rewrite that catches `.wasm`, font, image, or renderer
files.

## Browser release gate

Run this on the actual preview hostname, not localhost:

1. Direct-load the canonical route and refresh it once.
2. Capture 390 px and 1280 px states; verify the main landmark, H1, four
   desktop destinations, candidate-well CTA, and ChatFi open/close behavior.
3. Record the asset trace. `fonts.gstatic.com`, `www.gstatic.com`, and other
   third-party Flutter/font runtime requests must be absent. The R3F hostname
   is evaluated separately because it is the deliberate canonical scene.
4. Verify the trusted R3F ready protocol at the preview origin, then force the
   poster fallback and verify that it remains usable.
5. Exercise a harmless ChatFi request only if the preview origin has been
   explicitly approved for the endpoint. Confirm CORS success or the honest
   email fallback; never infer it from local behavior.
6. Inspect the response headers and first-/repeat-visit transfer sizes. The
   Flutter route is allowed only when it meets its app-use budget; it does not
   inherit the static homepage's marketing-page budget.

## Approval gate

An approved next change is a small root-only integration patch that adds the
route copy/build wiring and scoped Vercel headers, followed by one Vercel
**preview** deployment. Production promotion, public-home replacement,
COOP/COEP, and a root metadata change are separate decisions.
