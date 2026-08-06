---
name: flutter-add-integration-test
description: Add focused modern Flutter integration coverage for a real end-to-end mobile, desktop, or web workflow that cannot be protected by a unit, widget, or browser test. Choose the target platform first; do not use Flutter Driver extensions in web builds.
---

# Add an integration test

## Decide whether integration coverage is the right layer

1. Name the user journey, the business risk it protects, and the target
   platform. Prefer a widget test for a single widget and browser automation
   for a deployed Flutter web journey with external integrations.
2. Use an `integration_test` only when the journey depends on app startup,
   platform behavior, plugin wiring, or multiple widgets that cannot be
   credibly protected below that layer.
3. Check whether `integration_test` is already listed under `dev_dependencies`.
   If it is absent, propose the exact `sdk: flutter` addition and wait for the
   scoped dependency change; do not alter `pubspec.yaml` as a side effect.

## Author the test

1. Create `integration_test/<journey>_test.dart`.
2. Initialize the modern binding and exercise the real app entry point:

   ```dart
   import 'package:flutter_test/flutter_test.dart';
   import 'package:integration_test/integration_test.dart';

   void main() {
     IntegrationTestWidgetsFlutterBinding.ensureInitialized();
     // Add narrowly scoped testWidgets cases here.
   }
   ```

3. Give only stable, user-meaningful controls `ValueKey`s. Do not target
   implementation-detail widget types or arbitrary screen coordinates.
4. Wait for an explicit state transition. Use `pumpAndSettle` only when the
   route has no intentional, never-ending animation.
5. Assert an observable user outcome, including the negative/error path where
   it is consequential.

## Run on the chosen platform

- Mobile and desktop: use `flutter test integration_test/<journey>_test.dart`
  with the intended connected device when needed (`-d <device-id>`).
- Web: Dart MCP can still inspect runtime errors and hot reload through DTD, but
  it cannot send Flutter Driver finder commands to a web build. Use approved
  browser automation for the web interaction. If the test specifically needs
  Flutter's web integration runner, add the small `test_driver` host script and
  run the current documented `flutter drive ... -d chrome` flow with a matching
  ChromeDriver; do not assume that runner is headless or production-safe.
- Run `flutter analyze lib test --fatal-infos` and report the actual target and
  command used.

## Flutter Web PWA route workflow

For a user-triggered offline capability, exercise the compiled route artifact
in a browser; a widget test cannot prove service-worker scope, cache content,
or an offline navigation.

1. Serve the exact route-shaped release artifact from its intended base path
   using a disposable browser profile/test host. Verify the worker URL,
   manifest URL, and cache scope are route-relative.
2. Capture the initial `Prepare for offline` state. Trigger the download and
   wait for the explicit `Ready` state; inspect Cache Storage only as supporting
   evidence, not as a substitute for a reload.
3. Disable browser network access, reload the route, and complete one local
   user action. Assert the app shell and its local workflow remain usable.
4. Check that cross-origin 3D, chat, analytics, or API dependencies were not
   cached or implied to work offline. Exercise the visible failure path where
   feasible; it must remain honest.
5. After a new compiled manifest is available, verify an older package is
   offered for explicit refresh rather than being labelled current. Preserve an
   old complete package until the new package finishes successfully.

Use browser automation for this workflow. Do not rely on a generated
`flutter_service_worker.js` to supply offline behavior in Flutter 3.44; if a
custom worker exists, keep its scope exact and its cache list derived from the
compiled artifact.

## Guardrails

- Do not import `flutter_driver` or call `enableFlutterDriverExtension()` in a
  web build.
- Do not change the production `main.dart` just to make a test controllable.
  For mobile or desktop MCP exploration, any Flutter Driver extension must be
  gated behind an explicit debug-only `--dart-define` and excluded from release
  builds.
- Do not add ChromeDriver, Firebase Test Lab, performance tooling, or a CI job
  unless that scope is explicitly requested.
- A passing local test is not proof that an externally hosted R3F or ChatFi
  integration works; retain a browser validation for that boundary.
- Do not pre-cache an external iframe, a ChatFi endpoint, credentials, or a
  broad root-site path merely to make an offline demo look complete.
