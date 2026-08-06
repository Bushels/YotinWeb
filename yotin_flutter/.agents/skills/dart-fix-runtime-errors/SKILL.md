---
name: dart-fix-runtime-errors
description: Diagnose and repair a concrete Dart or Flutter runtime failure from its actual stack trace, a minimal reproduction, and a verified targeted fix. Use only when evidence of a real runtime failure exists; never silence errors with broad catches or automatic fixes.
---

# Repair a runtime failure

## Collect evidence first

1. Capture the exact exception, stack trace, device or browser, route, action,
   and whether the failure is deterministic.
2. In a running Flutter app, use the Dart MCP runtime-error and widget-inspector
   tools when available. For a web app, use browser automation to reproduce the
   interaction; Flutter Driver finder commands are not supported on web builds.
3. Read the failing source and its callers before proposing a change. Separate
   the triggering event from the underlying invariant that was broken.

## Make a bounded repair

1. Add or update the smallest regression test that can reproduce the failure.
2. Prefer an explicit nullable branch, validated parse, lifecycle check, or
   correctly typed value over a forced cast or assertion.
3. After an async gap in a `State` object, verify `mounted` before using the
   context or calling `setState`.
4. Preserve an actionable error when an operation genuinely cannot continue;
   do not convert a programming bug into an invisible success.

## Verify the actual path

1. Run `flutter analyze lib test --fatal-infos` for this project.
2. Run the new or affected test.
3. Re-run the original browser or device interaction and confirm the runtime
   error no longer appears.
4. State what was reproduced, the root cause, the changed files, and the proof
   of resolution. If reproduction failed, say so instead of claiming a fix.

## Guardrails

- Never use `dart fix --apply` as a runtime-error repair strategy.
- Do not add `catch (Error)`, `catch (_)`, an analyzer ignore, `!`, or `late`
  solely to suppress a failure.
- Do not add a generic retry or fallback until the failure mode, idempotency,
  and user-visible behavior are known.
- Keep runtime diagnostics enabled while validating; remove only temporary,
  clearly marked diagnostic code after the repair is proven.
