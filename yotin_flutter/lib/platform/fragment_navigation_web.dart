import 'dart:async';

import 'package:web/web.dart' as web;

import '../models/public_section.dart';

String? currentPublicFragment() {
  final hash = web.window.location.hash;
  if (hash.isEmpty) return null;
  return hash.substring(1);
}

/// Records an in-page navigation in browser history without creating a second
/// browser event for the same Flutter tap. Flutter URL strategy is explicitly
/// disabled for this one-page document, so this native state stays independent
/// of the engine's route-history state. Back/forward remains observable via
/// `popstate`, and manually edited hashes remain observable via `hashchange`.
void updatePublicFragment(String section) {
  final fragment = publicFragmentForSection(section);
  if (fragment == null || currentPublicFragment() == fragment) return;
  web.window.history.pushState(null, '', '#$fragment');
}

/// Returns a disposer so a StatefulWidget can release both browser listeners.
void Function() listenToPublicFragmentChanges(
  void Function(String? fragment) onChanged,
) {
  final hashChanges = web.EventStreamProviders.hashChangeEvent
      .forTarget(web.window)
      .listen((_) => onChanged(currentPublicFragment()));
  final historyChanges = web.EventStreamProviders.popStateEvent
      .forTarget(web.window)
      .listen((_) => onChanged(currentPublicFragment()));

  return () {
    unawaited(hashChanges.cancel());
    unawaited(historyChanges.cancel());
  };
}
