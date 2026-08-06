# Yotin Flutter working agreement

## Product boundary

- The repository root is the live static marketing site. Treat root files as
  read-only unless a task explicitly authorizes a production-site change.
- This `yotin_flutter` directory is an isolated Flutter Web prototype that is
  becoming the app-grade **WellFi Field Review** PWA. It is not a replacement
  for the crawlable marketing page until the release gates below pass.
- Do not claim that the Flutter app is deployed, connected, or production-ready
  unless the current task has verified that fact.

## Sources of truth

- Preserve approved public product claims from the static site. In particular,
  the candidate-well flow and its copy in `..\main.js` are the reference.
- The public qualifier has six steps: lift, well type, bottomhole temperature,
  intermediate casing length, derived pump-landing question, and intervention
  timing. Above 150 C is a high-temperature follow-up path, not an approval.
- The derived landing threshold is the nearest 10 m to `0.9 * intermediate
  casing length`. A landing at or deeper than that threshold is an engineering
  review flag, not an automatic rejection.
- ChatFi posts `{"messages":[{"role":"user|assistant","content":"..."}]}`
  to the configured endpoint. Send only the newest 24 non-empty messages and
  cap a user message at 4,000 characters. Never fabricate a successful answer
  or "connected" status after a network, CORS, empty-stream, or HTTP failure.

## Dart and Flutter implementation rules

- Prefer immutable value state. A widget update must assign a new value, not
  mutate a state object that a `CustomPainter` compares by reference.
- Keep the package surface lean. Do not add a dependency without explaining the
  native/app capability it unlocks and checking that Flutter already does not
  supply it.
- Implement phone, tablet, and desktop layouts deliberately; do not hide an
  overflow with clipping or scroll bars.
- Respect reduced motion and avoid continuously animating off-screen content.
- Treat all output text as public-facing engineering copy: specific, honest,
  and no unsupported reliability, deployment, or performance claims.

## Gemini task protocol

1. Use Gemini 3.6 Flash High for a narrow Flutter/Dart question, a bounded
   implementation, or a second opinion. It is effective at widget APIs,
   layout reasoning, and framework-specific accessibility patterns. It is not
   the release authority.
2. Use the project-local skill catalogue selectively, not as an agent swarm:
   - `dart-run-static-analysis` for diagnostics;
   - `flutter-build-responsive-layout` for a confirmed layout issue; and
   - `flutter-add-widget-test` for a new user-visible behavior.
   Do not use `flutter-add-integration-test` until its legacy Flutter Driver
   instructions have been modernized. Do not add another agent framework.
3. For a focused Antigravity second opinion, run from this directory:

   ```powershell
   agy --model gemini-3.6-flash-high --effort high --mode plan --sandbox --disable-slash-commands -p "<narrow question; no edits or tools>"
   ```

   A sandboxed headless session cannot approve a new `read_file` permission.
   For source audits, either use the interactive Antigravity client with an
   explicit narrow allow rule or provide the necessary excerpt in the prompt.
   If a headless session reports a permission denial or times out, record that
   as no result. Do not retry with `--dangerously-skip-permissions`, make a
   broad global allow rule, or make a model response a merge gate. Use the
   Flutter compiler, tests, browser evidence, and Codex review as the release
   authority.
   Before recommending a Flutter CLI flag, renderer setting, or CDN switch,
   verify it against `flutter build web --help` from the installed SDK. Older
   examples are not authority: Flutter 3.44.7 exposes `--wasm` and
   `--static-assets-url`, not `--static-assets-user-base-url`, and exposes
   no legacy HTML-renderer selection. Record an invented or stale flag as a
   Gemini miss rather than turning it into a build experiment.
4. Read the relevant files and state the narrow files and observable
   acceptance criteria before editing.
5. Make one bounded change. Do not opportunistically rewrite unrelated UI.
6. Run Dart diagnostics after the patch. Report the exact command/result, any
   tests not run, and assumptions needing a human release gate.
7. Leave a small, reviewable diff. Codex independently verifies it before the
   task advances.

## Non-negotiable guardrails

- Do not run `dart fix --apply`, major package upgrades, or `pub upgrade
  --major-versions` without a separately reviewed change request.
- Preserve the static root, the exact R3F postMessage protocol, and the exact
  ChatFi origin policy. A preview that cannot use those integrations must show
  the working poster/email fallback rather than widening an origin wildcard.
- For every UI change, add or update one behavioral or semantic test. A visual
  screenshot is supporting evidence, not proof that keyboard and assistive
  technology users can complete the flow.
- For Flutter Web form fields, inspect the compiled browser's native input
  semantics on a fresh origin. The widget-test semantics tree and the
  renderer's actual `aria-label` can differ; keep that browser-facing name
  meaningful.
- Keep source, compiler output, and deployment proof distinct: a successful
  Dart edit is not a successful Flutter build, and a successful Flutter build
  is not a verified Vercel route.

For the canonical WellFi R3F iframe, preserve the complete ready protocol:
exact source identity, exact allowed origin, message type, and protocol
version. Never replace it with a wildcard origin or an iframe `load` event.
Use Dart 3.12 `jsIdentical` for cross-runtime WindowProxy identity and accept
only an exactly integral version value.

## Required local gates

Run the relevant gates before calling a Flutter change complete:

```text
flutter analyze
flutter test
flutter build web --wasm
```

For the route-shaped release artifact, run the project wrapper instead of a
hand-written `--output` command:

```text
.\tool\build_field_review.ps1 -NoPub
```

It stages Flutter's static asset bundle into `build/field-review/` and verifies
the files that a successful compiler exit alone does not prove. It also runs
`tool/verify_first_visit_payload.mjs`, which holds the known
Chromium/Skwasm startup path below a 2.5 MiB Brotli estimate. That is an
anti-regression gate, not a claim about a Vercel visitor transfer or repeat
visit; those remain browser-measured release gates.

For UI changes, also capture the local app at 1600, 1280, 820, and 390 px wide
and compare it with the static baseline. A passing build is necessary but not a
visual, accessibility, performance, SEO, or backend-contract sign-off.
