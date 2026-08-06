import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

File _pubspecFile() {
  const candidates = <String>['pubspec.yaml', 'yotin_flutter/pubspec.yaml'];
  for (final candidate in candidates) {
    final file = File(candidate);
    if (file.existsSync()) {
      return file;
    }
  }
  throw StateError('Could not find the Flutter pubspec.');
}

void main() {
  test('web asset bundle is an explicit runtime allowlist', () {
    final pubspec = _pubspecFile().readAsStringSync();

    expect(pubspec, isNot(contains('    - assets/\n')));
    for (final asset in <String>[
      'assets/yotin-icon.png',
      'assets/wellfi-logo.webp',
      'assets/wellfi-island-r3f-poster.webp',
      'assets/wellfi-internal-ghost.webp',
      'assets/drill-formation.webp',
      'assets/drill-casing.webp',
    ]) {
      expect(pubspec, contains('    - $asset'));
    }

    for (final staticOnlyAsset in <String>[
      'assets/hero-multilateral.webp',
      'assets/hero-sagd-island.webp',
      'assets/og-card-2.jpg',
      'assets/slotted-liner.png',
      'assets/wellfi-island-hero-12s.mp4',
      'assets/wellfi-island-live.webp',
      'assets/yotin-wellfi-og-2026.png',
    ]) {
      expect(pubspec, isNot(contains('    - $staticOnlyAsset')));
    }
  });
}
