---
name: dart-run-static-analysis
description: Run evidence-based static analysis for a Dart or Flutter change, triage only the reported diagnostics, and verify a minimal reviewed repair. Use before and after a bounded change; never auto-apply fixes.
---

# Run static analysis safely

## Choose the correct analyzer

1. Read the package's `analysis_options.yaml`, `pubspec.yaml`, and the relevant
   test target before changing code.
2. For this Flutter web project, run:

   ```bash
   flutter analyze lib test --fatal-infos
   ```

3. For a pure Dart package, use `dart analyze <narrow-target> --fatal-infos`.
4. Treat the exact analyzer output as the work list. Do not invent cleanup work
   or change unrelated files just because they look inconsistent.

## Repair and verify

1. Locate the cause, not merely the flagged line.
2. Make the smallest manual repair that preserves the intended behavior.
3. Format only touched Dart files with `dart format <files>`.
4. Re-run the same analysis command and the narrowest relevant test or build.
5. Report the command, diagnostics before and after, files changed, and any
   diagnostic deliberately left unresolved.

## Guardrails

- Never run `dart fix --apply`, `flutter pub upgrade`, or a repository-wide
  formatter as an unattended side effect of analysis.
- Do not add `ignore`, `ignore_for_file`, an analyzer exclusion, a null
  assertion (`!`), or `late` merely to make a diagnostic disappear.
- Do not weaken `analysis_options.yaml` or modify dependency constraints unless
  the requested task explicitly requires it and the resulting diff is reviewed.
- A clean analyzer does not prove the user flow works; pair it with a focused
  widget, integration, or browser check when behavior changed.
