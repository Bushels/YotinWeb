# WellFi Field Review — Current Handover

Updated: 2026-08-06

## Decision

Keep the public Yotin marketing root static. The Flutter project is a strong
**app-grade Field Review companion** at `/field-review/`, not a public-home
replacement or a deployment-ready route.

```text
Static Yotin root
  - canonical SEO, Organization/Product/FAQ schema, no-JavaScript document
  - lightweight poster-first R3F product story

Flutter /field-review/
  - six-step candidate-well qualifier, ChatFi interaction, mobile field flow
  - trusted bridge to the canonical WellFi R3F scene
```

## Current implementation

- Flutter `3.44.8`, Dart `3.12.2`, DevTools `2.57.0`.
- Direct dependencies are current. Keep the lean set: `google_fonts ^8.2.1`,
  `http ^1.4.0`, `url_launcher ^6.3.1`, and first-party `web ^1.1.1`.
- The hero uses the canonical R3F scene through a strict iframe protocol:
  exact source identity, exact origin, type, and integral protocol version.
  It remains poster-first and respects reduced motion and Save-Data. At
  desktop it uses the static source's wide, offset full-canvas composition and
  two-layer readability scrim rather than a framed 16:9 card. The Flutter
  `Stack` is explicitly constrained to the available hero canvas so the scene
  cannot shrink-wrap behind the copy.
- At 1280 px the header restores the public four-destination contract:
  WellFi, Benefits, Our Company, and Contact. The hero keeps the evaluation
  CTA, the footer restores those four routes, and the contact section restores
  the direct ChatFi entry path.
- The qualifier preserves the published six-step WellFi logic and test coverage.
- ChatFi retains the newest 24 non-empty messages, 4,000-character input cap,
  stop control, completed-response live announcement, partial-stream
  preservation, and an explicit email fallback.
- The Field Review includes an explicit, operator-started offline package. Its
  custom route-scoped worker derives a content-versioned file list from the
  release artifact and caches only same-origin Flutter files. The local
  qualifier remains available offline; canonical R3F and ChatFi remain
  connection-bound and are never placed in that cache. While connected, the
  worker uses the network first and only falls back to the package offline, so
  an old downloaded review cannot mask a newer release.
- The built Flutter route exposes a `main` landmark and an H1 after startup.
  The no-JavaScript fallback is independently usable; its skip link is hidden
  after the fallback becomes inert, avoiding a live link into hidden content.

## Verified local gates

```text
flutter analyze                         PASS
flutter test --concurrency=1            PASS (35 tests)
.\tool\build_field_review.ps1 -NoPub   PASS
packaged 1280 / 390 browser checks      PASS
explicit offline reload + qualifier      PASS (local only)
```

The wrapper creates `build/field-review/`, stages the static asset bundle that
Flutter otherwise leaves in `build/web`, and verifies the entrypoint, Wasm,
manifest, icons, poster, and R3F assets.

## Non-negotiable remaining release gates

1. The live Vercel root does not build or serve `/field-review/`; production
   currently returns a route 404. Add a deliberate build-artifact, rewrite,
   header, and one-canonical-path plan before any deploy request.
2. Prove Wasm MIME type, compression, cache policy, direct route loading,
   PWA scope, explicit offline reload, R3F production origin, and ChatFi CORS
   on the approved domain.
3. The Flutter first visit is materially heavier than the static root. The
   Wasm app plus renderer is roughly multi-megabyte before common R3F/font
   traffic, while the static marketing core is far smaller. Set real
   first-visit and repeat-visit budgets before promotion.
4. Preserve the static root until Flutter independently proves full public
   crawlability, structured data, no-JavaScript content, and accessibility.
5. If full public-home accessibility parity is ever reopened, build and test a
   native Flutter keyboard-skip control. Do not reactivate the fallback link
   after that fallback becomes inert.

## Gemini / Antigravity operating rule

- Use Gemini 3.6 only as a manual, scoped Flutter second opinion. It is not an
  unattended release authority.
- In this Codex shell, invoke the supported AGY route rather than the
  UI-session-bound `agentapi.bat` wrapper:
  `C:\Users\kyle\AppData\Local\agy\bin\agy.exe --model gemini-3.6-flash-high --effort high --print ...`.
  AGY starts its own language-server session; the UI wrapper requires an
  unavailable `ANTIGRAVITY_LS_ADDRESS` and must not be pointed at guessed ports.
- The nine selected upstream skills in `.agents/skills/` are shared with
  Antigravity, Gemini CLI, Codex, Cursor, and OpenCode. Four project-local
  guardrails now make the generic bundle safe for this Flutter Web prototype:
  static analysis is manual and reviewed, runtime repair requires a real
  stack trace, web integration testing uses browser automation rather than a
  Flutter Driver extension, and routing requires a real path table. Do not
  add the other upstream skills or new runtime packages until a concrete
  capability demands them.
- Start a dedicated, minimal Antigravity profile for this project: Dart MCP and
  the Yotin Flutter workspace only. The global MCP cluster caused previous
  Gemini runs to stall while unrelated MCPs connected.
- `GEMINI.md` and `docs/quality-gates.md` are controlling documents. The
  original Antigravity handover was superseded: it refers to removed packages,
  a 2D hero, and an older qualifier design.

## 3D decision

The current R3F bridge is working. Its former composition issue (a framed,
shrink-wrapped secondary visual) was repaired with source-matched full-canvas
geometry and a measured width constraint; the remaining 3D decision is not a
renderer failure.

`flutter_scene` / FScene is a genuine R&D candidate for a future Flutter-native
3D application, but do not install it here now: it is pre-1.0, requires Flutter
master rather than stable 3.44.8, adds another WebGL/build pipeline, and does
not solve the static-root SEO or first-visit payload problem. Revisit only as
an isolated spike with a performance and visual-composition acceptance test.

## Safe next task

The next useful vertical slice is a deployment-planning task, not another UI
rewrite: specify how the exact `build/field-review/` artifact gets built and
served at `/field-review/`, then run origin/header/CORS/payload tests against a
non-public preview. No deploy, package addition, or static-root change is
authorized by this handover.
