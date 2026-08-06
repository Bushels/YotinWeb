---
name: flutter-setup-declarative-routing
description: Design a small, testable Flutter route model with `MaterialApp.router` only when the product needs durable URL deep links, browser history, or independent screens. Choose a router after validating the required paths and hosting behavior; do not add routing to a one-screen or anchor-navigation flow.
---

# Set up declarative routing deliberately

## Confirm the need

1. Write the public path table: path, owning screen, parameters, authenticated
   state, refresh behavior, and not-found behavior.
2. Do not introduce routing for in-page anchors, a one-screen marketing flow,
   or a button that should scroll to an existing section. This field-review
   prototype currently falls into that category.
3. Confirm the web host rewrites every application path to Flutter's
   `index.html`; otherwise a deep link may work in-app but fail on refresh.

## Choose and implement the smallest router

1. Prefer Flutter's built-in routing primitives when the table is small and the
   app has no nested shell or complex redirect requirements.
2. Consider a maintained router package such as `go_router` only when the route
   table demonstrates a concrete need for nested navigation, redirect logic, or
   typed URL handling. Research its current compatibility first.
3. Propose any dependency change separately; never run `flutter pub add` just
   because routing was mentioned.
4. Map paths to immutable screen constructors, validate path parameters before
   use, and provide a deliberate not-found screen.
5. Keep browser history and URL state observable in a test. Do not encode core
   navigation state only in widget-local state.

## Verify

1. Check direct navigation, refresh, browser back/forward, malformed
   parameters, and the not-found path at the target viewport.
2. Run `flutter analyze lib test --fatal-infos` and focused routing/widget
   tests.
3. For a deployed web build, validate a direct deep link against the real host,
   not only a local development server.

## Guardrails

- Do not add platform universal-link configuration, authentication redirects,
  or a persistent navigation shell unless the product specifically needs them.
- Do not change server rewrite rules or public URL structure without explicit
  approval; those are deployment contracts.
- Keep a single source of truth for route ownership. Avoid a mixture of manual
  `Navigator.push`, package routing, and scroll offsets for the same journey.
