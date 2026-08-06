# Flutter Field Review quality loop

This is a self-paced checkpoint loop, not a production deployment workflow.
The static marketing site remains the public baseline while this app is proved.

```text
Narrow Gemini task
        |
        v
Dart MCP diagnostics + small diff
        |
        v
Codex contract and public-copy review
        |
        v
flutter analyze + flutter test
        |
        v
local Wasm build and four-width screenshots
        |
        v
release checkpoint: advance, rework, or keep isolated
```

## Gates

| Gate | Must prove |
| --- | --- |
| Qualifier | Immutable state; published six-step result logic; unit-tested strong, review, and high-temperature paths. |
| Responsive layout | No overflow at 390, 820, 1280, and 1600 px; navigation and ChatFi remain operable. |
| ChatFi | Newest 24-message context, 4,000-character cap, explicit stop, accurate availability state, and transparent email fallback. |
| Public web | The static root retains canonical metadata, JSON-LD, semantic HTML, no-JavaScript contact fallback, and R3F poster/failure behavior. |
| Motion | Reduced-motion mode and off-screen widgets do not keep high-cost animation running. |
| Release | A build, diagnostics, tests, screenshots, and an approved hosting/header plan exist before any public routing or deployment decision. Build with `tool/build_field_review.ps1`, which enforces an absolute Flutter output path, self-hosts the renderer/font fallback contract, and verifies the complete artifact. |

## Current non-goals

- Do not replace the public static homepage during this prototype.
- Do not add state-management, 3D, or animation packages merely to match a web
  implementation. Add them only after a measurable app capability requires it.
- Do not test the live ChatFi endpoint in an automated suite or infer CORS
  support without testing the final approved origin.

## V1 evidence - 2026-08-05

- Flutter 3.44.7 / Dart 3.12.2 is installed and the `dart mcp-server` command
  is available for Antigravity or Gemini.
- `flutter analyze` passed with no issues.
- `flutter test --concurrency=1 --reporter expanded` passed all 21 tests,
  including immutable qualifier state, protocol trust conditions, 24-message
  ChatFi context, partial-stream preservation, direct desktop navigation and
  hero-CTA actions, and the mobile navigation/dialog regression gate.
- `tool/build_field_review.ps1 -NoPub` completed a Wasm build at
  `build/field-review/` and verified the compiled entry point, asset manifest,
  Yotin icon, WellFi poster, favicon, manifest, and app icons.
- The packaged artifact was rendered at true 1280 x 720 and 390 x 844
  viewports. At desktop the R3F scene fills the intended hero canvas; at phone
  width the compact header, copy, CTAs, and scene reflow without overflow.
  Browser checks confirmed the desktop hero CTA reaches the qualifier and the
  header ChatFi entry opens and closes its dialog.
- 1280 x 720 and 390 x 844 side-by-side browser comparisons were made against
  the live static homepage. The Flutter route preserves the approved copy,
  typography, logo, orange/cyan system, and canonical WellFi visual while
  adding the interactive signal strip, field-review sequence, qualifier, and
  ChatFi entry point.
- The desktop shell now exposes the same four public destinations as the
  static site at 1280 px: WellFi, Benefits, Our Company, and Contact. The
  evaluation CTA remains in the hero rather than crowding the header.
- The live R3F scene now uses the static source's wide, offset, full-canvas
  desktop geometry and two-layer readability scrim instead of a framed 16:9
  side card. Its `Stack` is explicitly constrained to the available canvas
  width, so the source scene cannot shrink-wrap behind the copy. The hero can
  still grow within the page scroll container for shorter viewports or
  increased text size rather than trapping copy in a rigid-height Flex.
- Flutter’s footer restores the four public routes and the contact section
  restores the direct ChatFi conversion path. ChatFi now shows the AI
  disclosure, announces completed assistant responses, and preserves a partial
  streamed answer before presenting its email fallback.
- A read-only AGY/Gemini 3.6 Flash High review was run against this exact
  layout/conversion diff. Its fixed-height and partial-stream concerns were
  repaired; its proposed fifth desktop nav item was rejected because the
  public static navigation contract is intentionally four destinations.
- The exact `/field-review/` artifact was loaded locally. Its fallback shell
  marked itself Flutter-ready only after startup, the trusted R3F iframe
  reached opacity `1`, and both the candidate-well CTA and ChatFi open/close
  flows worked at the final mobile breakpoint.
- The built route now exposes one `main` landmark and a level-one `Know the
  Unknown.` heading after Flutter paints. The no-JavaScript fallback keeps its
  own skip link; after Flutter makes that fallback inert, it hides the fallback
  link rather than leaving a focusable control that points into hidden content.

## Remaining release gates

- Complete the protected-preview browser gate at 390, 820, 1280, and 1600 px.
  The server route is verified, but the in-app validation browser is not
  signed into Vercel Deployment Protection yet.
- Decide whether live-preview proof merits one stable protected alias added to
  the existing exact R3F and ChatFi origin allowlists. The unique Vercel
  preview hostname is intentionally rejected today, so it must demonstrate
  the safe poster/email fallback instead of pretending to be production.
- Set and test a first-visit/repeat-visit payload budget before public use.
  The current Wasm app plus its renderer is materially heavier than the static
  marketing shell; do not replace the root based on local visual success.
- If a Flutter route is ever asked to meet full public-home accessibility
  parity, design and verify a native Flutter keyboard skip mechanism. Do not
  re-enable the static fallback skip link after the fallback becomes inert.
- Keep the static root as the canonical SEO and no-JavaScript document until
  those production checks pass; this prototype does not replace it by itself.

## V1 hardening evidence - 2026-08-06

- The first hardened `tool/build_field_review.ps1 -NoPub` artifact had 50
  files and 30.34 MiB raw. The current explicit runtime-asset allowlist has
  43 files and 28.10 MiB raw, removing 2.23 MiB of unused static-site media.
  Neither number is a first-visit transfer claim; both are release-artifact
  measures. The earlier unpruned bundle was 45.47 MiB raw.
- The release wrapper now rejects a missing local renderer, a missing local
  Google Font, a missing `FontManifest` Roboto family, or a missing
  engine-fallback mirror. It also rejects unneeded renderer symbols,
  WebParagraph experiments, and WIMP artifacts.
- A fresh isolated browser origin loaded the compiled route with 23 observed
  app assets, no console warnings/errors, and no third-party Flutter or font
  request. The semantic tree exposed the Field Review main landmark and the
  level-one `Know the Unknown.` heading after Flutter started.
- No public-root files, Vercel routing, Vercel deployment, R3F origin setting,
  or ChatFi setting changed during this hardening pass. The exact preview
  acceptance criteria are in
  [`vercel-preview-contract.md`](vercel-preview-contract.md).

## Protected preview evidence - 2026-08-06

- `tool/build_field_review_preview.ps1` now runs the verified Flutter release
  wrapper, generates Vercel's static output locally, injects only the compiled
  `/field-review/` artifact, validates its required assets, and registers the
  clean route mapping before `vercel deploy --prebuilt --yes` uploads it.
- Protected preview deployment `dpl_6PcVT9KXEkqEek5hBN9rSrNq9TkY` was accepted
  by Vercel. HTTP checks confirmed the canonical route, Wasm MIME type,
  self-hosted fonts, noindex/cache headers, and a `404` for the excluded Flutter
  source path.
- This is a preview-only integration. The static root, live R3F origin policy,
  ChatFi CORS policy, and production deployment were not changed.
- The Dart analyzer now enforces strict casts, inference, and raw types. The
  qualifier's numeric field has a native browser-accessible label, a live
  validation error, and a widget test for its assertive announcement event.

## Public fallback hardening evidence - 2026-08-06

- The route HTML now carries a complete no-JavaScript WellFi document rather
  than a small loading/fallback card: hero, signal path, measurement channels,
  public specifications, benefits, tool context, company context, and the
  direct candidate-well email path. It remains visible unless Flutter has
  painted a first frame, then becomes inert and hidden.
- The fallback uses only route-relative packaged assets. The build wrapper
  fails if its base href, public sections, or four required visual assets are
  absent, or if a root-only `src="/assets/"` path is introduced.
- `test/public_shell_contract_test.dart` locks the public-content landmarks,
  one-H1 rule, published specifications, direct contact path, readiness
  hand-off, and route-relative fallback assets. `flutter test
  --concurrency=1 --reporter expanded` passed all 23 tests; strict analysis
  also passed.
- Protected deployment `dpl_6tfjrcYyBwzcpR8v7qMZaDiwqQBZ` served the complete
  fallback document at `/field-review`, its Wasm at `application/wasm`, and
  its packaged WellFi logo at `image/webp`; the excluded Flutter source path
  and intentionally unbundled OG artwork both returned `404`. The 43-file
  artifact is 28.10 MiB raw, so this proof does not waive the first-/repeat-
  visit payload gate.
- The explicit asset allowlist keeps the six images used by Flutter or the
  fallback and rejects seven unused static-site assets in both a source test
  and the compiled `AssetManifest`. `flutter test --concurrency=1 --reporter
  expanded` passed all 24 tests after the change.
- A sandboxed headless Gemini/Antigravity source audit correctly stopped on a
  missing `read_file` permit. The project agreement now requires either an
  interactive narrow allow rule or prompt-provided source excerpts; it forbids
  `--dangerously-skip-permissions` as a shortcut.

## First-visit payload budget - 2026-08-06

- A fresh 390 px browser run against the current public static site measured
  202,368 bytes of known same-origin transfer (document plus six resources).
  Its deliberate cross-origin R3F iframe has no Timing-Allow-Origin data, so
  this is a baseline observation, not a total-page claim.
- A fresh local 390 px run of the compiled Flutter route measured 6,771,905
  bytes of known same-origin transfer with the uncompressed local test server.
  The critical Chromium/Skwasm path contains the Dart Wasm payload, Skwasm
  renderer, local fonts, fallback document, and six packaged images.
- `tool/verify_first_visit_payload.mjs` now Brotli-compresses that explicit
  startup set at quality 11. The current estimate is 2,368,895 bytes against
  a 2,621,440-byte (2.5 MiB) app-route ceiling; a new startup resource that
  exceeds the ceiling fails the release build wrapper.
- This gate limits regression for the interactive field-review route. It does
  **not** show that Flutter wins the static marketing homepage's cold-load
  budget, and it does not waive the required preview first-/repeat-visit
  browser trace or the separate R3F transfer measurement.

## Qualifier parity hardening - 2026-08-06

- `test/static_qualifier_parity_test.dart` reads the approved static
  `main.js` source and the Flutter qualifier source. It locks the six public
  steps, option copy, 50–6,000 m casing range, 0.9x derived landing rule,
  high-temperature waitlist subject, direct email hand-off, and clipboard
  fallback against silent cross-surface drift.
- The widget suite now completes the complete high-temperature flow at 1,000 m
  casing length and verifies the derived 900 m choice, waitlist verdict,
  follow-up CTA, and copy-summary action remain visible. This supplements,
  rather than replaces, the model's strong/review/future tests.
- A live browser run against the current static production page exercised that
  same branch without opening its mail link: PCP, heavy oil, above 150 °C,
  1,000 m casing, shallower than 900 m, and intervention within three months.
  It produced the identical waitlist wording, distinct 150 °C+ email subject,
  and copy-summary fallback that Flutter now protects.
- A fresh browser run of the compiled Flutter route on an isolated local
  origin completed the same six-answer branch without opening the email link
  or copying the summary. Its semantic tree exposed `HIGH-TEMP VERSION IN
  DEVELOPMENT`, `HAVE YOTIN FOLLOW UP`, and `COPY SUMMARY`, along with the
  complete selected-well summary.
