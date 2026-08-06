# WellFi Field Review — Flutter V1

This is an isolated Flutter Web prototype for the **app-grade** part of
Yotin's WellFi experience: candidate-well qualification, technical review,
and future authenticated field workflows.

It is **not** a replacement for the public marketing homepage yet.

## Architecture decision

```text
Public marketing, search, R3F product story  ->  static site at repository root
Candidate-well review and future field app   ->  this Flutter application
```

The static site remains the source of truth for public copy, semantic HTML,
structured data, no-JavaScript fallback, and the live R3F hero. Flutter earns
its place when interaction, installability, mobile field use, and typed app
state matter more than crawlability.

## What is verified in this V1

- Six-step Candidate-Well Qualifier matches the public product logic:
  high temperature is a future/waitlist path, review is not a rejection, and
  calculated landing is rounded to the nearest 10 m.
- Immutable qualifier state and result paths have unit coverage.
- ChatFi uses the newest 24 messages, caps input at 4,000 characters, exposes
  stop behavior, and never pretends a disconnected service is connected.
- The Flutter hero and drill explorer use provided Yotin/WellFi image assets;
  no hand-drawn substitute is used for brand visualizations.
- `flutter analyze`, `flutter test`, and `tool/build_field_review.ps1 -NoPub`
  pass on Flutter 3.44.7 / Dart 3.12.2.
- The release artifact self-hosts its renderer, the four Yotin typefaces,
  and Flutter's engine Roboto fallback. A clean browser trace has no
  third-party Flutter or font request.

## Run the proof loop

```powershell
flutter analyze
flutter test --reporter expanded
.\tool\build_field_review.ps1 -NoPub
```

For the full change loop and release gates, read
[`docs/quality-gates.md`](docs/quality-gates.md). Gemini task rules are in
[`GEMINI.md`](GEMINI.md); keep its changes small and make the Flutter compiler
and tests—not a model's self-assessment—the release gate.

## Before public routing or deployment

1. Capture and compare 390, 820, 1280, and 1600 px states after any visual
   change.
2. Test the approved production origin against the live ChatFi endpoint;
   confirm CORS and the intended failure path.
3. Choose the final Flutter renderer and hosting headers before enabling
   Wasm threads.
4. Keep the static homepage in front until the Flutter public story, SEO,
   accessibility, payload, and live 3D fidelity are independently proven.

The approval-gated Vercel preview requirements are in
[`docs/vercel-preview-contract.md`](docs/vercel-preview-contract.md).
