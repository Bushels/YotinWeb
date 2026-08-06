# Flutter 3.44 agent workflow

The project uses a small, first-party Flutter agent-skill set copied from
[`flutter/agent-plugins`](https://github.com/flutter/agent-plugins) at commit
`141bccd9a3a9d43d698752272ecf56a32026d174`.

Installed project-local skills live in `.agents/skills/`:

- `dart-run-static-analysis` and `dart-fix-runtime-errors` for compiler and
  runtime repair.
- `flutter-build-responsive-layout` and `flutter-fix-layout-issues` for the
  desktop-to-mobile visual gate.
- `flutter-add-widget-test` and `flutter-add-integration-test` for behavior
  coverage.
- `flutter-setup-declarative-routing` for a later multi-page app phase.
- `flutter-add-widget-preview` is retained as an experimental visual-review
  tool, not a release dependency.

`flutter-add-integration-test` also carries the project's Flutter Web PWA
route workflow: test the compiled route, explicit cache preparation, offline
reload, a local workflow action, and the honest external-integration boundary.
This is deliberately browser automation rather than a Flutter Driver extension
or a service-worker mock. Use a disposable browser profile and a test-only
host because the journey intentionally writes Cache Storage.

## Operating rule

Use the skills through the existing Antigravity Dart MCP / Agentic Hot Reload
workflow during implementation, then keep the independent quality gate:

1. `flutter analyze`
2. `flutter test`
3. `.\tool\build_field_review.ps1 -NoPub` for the route-shaped Wasm artifact
4. browser comparison against the existing public site at the same viewport

The skills reduce repair-loop friction; they do not replace public-claim,
accessibility, browser, or release review.

## Gemini 3.6 second-opinion lane

Use the supported AGY command in this shell for one narrow, read-only or
bounded task at a time:

```powershell
& 'C:\Users\kyle\AppData\Local\agy\bin\agy.exe' `
  --model 'gemini-3.6-flash-high' `
  --effort high `
  --print '<bounded prompt>'
```

Do not use `agentapi.bat` from an ordinary shell: it is bound to the active
Antigravity UI session and requires an address that is not safely discoverable
or transferable. The current global MCP profile can make AGY slow while
unrelated services initialize, so use it as a manual second signature and let
Codex retain the automated compiler, test, and browser gates.
