# Approval-gated Vercel preview contract

## Status

**Protected preview deployed, not promoted.** On 2026-08-06, the isolated
`/field-review` route was built locally, injected into Vercel's prebuilt
static output, and deployed as a protected Vercel preview. The public static
site and production deployment remain unchanged.

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
| Flutter HTML / bootstrap / custom offline worker / cache manifest | Revalidated on deploy; do not mark un-hashed files immutable. The worker and manifest must preserve the route-scoped, same-origin cache contract. |
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
7. While online, explicitly prepare the offline Field Review package. Then
   disable network access, reload the route, and advance one qualifier answer.
   The local qualifier may work; the canonical R3F scene and ChatFi must remain
   visibly connection-bound rather than being implied to work offline.

## Protected preview evidence - 2026-08-06

- Preview deployment: `dpl_6tfjrcYyBwzcpR8v7qMZaDiwqQBZ` at
  `https://yotin-energy-o08y3h1fl-kyles-projects-d3ab6818.vercel.app/field-review`.
  It remains behind Vercel Deployment Protection.
- The local build/copy wrapper generated Vercel output containing 43 Flutter
  route files (28.10 MiB raw). It excludes `yotin_flutter/` and `tool/` from
  Vercel's source upload, then injects only the verified compiled artifact
  below `/field-review/`.
- Vercel HTTP verification confirmed `/field-review` returns `200`,
  `/field-review/` redirects to the canonical path, both required Wasm files
  return `200` with `Content-Type: application/wasm`, and the local font
  manifest and Roboto fallback return successfully. `/yotin_flutter/pubspec.yaml`
  returns `404`, so the Flutter source is not published.
- The unique protected preview hostname is deliberately *not* in the exact
  production R3F or ChatFi origin allowlists. The route therefore must retain
  its safe WellFi poster and honest ChatFi email fallback there. No wildcard
  origin was added merely to make a preview appear live.
- The compiled browser exposes the intermediate-casing field through its native
  accessible name, `Intermediate casing length (m), e.g. 1000`. Invalid input
  has a live semantic error and emits an assertive Flutter announcement when
  the platform advertises announcement support.
- The deployed HTML includes a route-relative, no-JavaScript public WellFi
  document with the hero, signal path, measurement channels, public specs,
  benefits, tool/company context, and a direct candidate-well email path.
  `assets/assets/yotin-icon.png`, `wellfi-logo.webp`, the poster, and the
  internal-tool image all resolve from the compiled route rather than the
  static-root `/assets/` path. The build and widget contract reject drift.
- The preview correctly returns `404` for both Flutter source and the
  intentionally omitted `field-review/assets/assets/yotin-wellfi-og-2026.png`.
  The runtime bundle uses an explicit six-image allowlist instead of copying
  the static site’s entire asset directory.

- The newer explicit offline worker and generated cache manifest have local
  browser proof only. They have not been injected into or validated on this
  protected preview yet; the next preview build must carry both files and run
  the browser release-gate step above.

## Next authorization gate

The preview pipeline is now real. Before a production route or full live
integration test, authorize one of these deliberately bounded paths:

1. Sign into Vercel in the validation browser and complete the visual
   preview checks with the expected poster/email fallback; or
2. Create one stable, protected preview alias and add that exact origin to
   both the R3F and ChatFi allowlists, then test live integrations there.

Production promotion, public-home replacement, COOP/COEP, a root metadata
change, and broad Vercel-origin allowlists remain separate decisions.
