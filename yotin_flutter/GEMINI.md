# Yotin Flutter working agreement

## Product boundary

- `C:\Users\kyle\MPS\Yotin-web` is the live static marketing site. Treat its
  files as read-only unless a task explicitly authorizes a production-site
  change.
- `C:\Users\kyle\MPS\Yotin-web\yotin_flutter` is an isolated Flutter Web
  prototype that is becoming the app-grade **WellFi Field Review** PWA. It is
  not a replacement for the crawlable marketing page until the release gates
  below pass.
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

1. Read the relevant files and set the Dart MCP workspace root before editing.
   Use the project-local official skills in `.agents/skills/` only when their
   task matches: responsive/layout repair, static analysis, widget or
   integration testing, routing, or widget preview. Do not add a second
   overlapping agent framework.
2. State the narrow files and observable acceptance criteria for the patch.
3. Make one bounded change. Do not opportunistically rewrite unrelated UI.
4. Run Dart diagnostics after the patch. Report the exact command/result, any
   tests not run, and assumptions needing a human release gate.
5. Leave a small, reviewable diff. Codex independently verifies it before the
   task advances.

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
the files that a successful compiler exit alone does not prove.

For UI changes, also capture the local app at 1600, 1280, 820, and 390 px wide
and compare it with the static baseline. A passing build is necessary but not a
visual, accessibility, performance, SEO, or backend-contract sign-off.
