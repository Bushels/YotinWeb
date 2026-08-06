import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

File _publicShellFile() {
  const candidates = <String>[
    'web/index.html',
    'yotin_flutter/web/index.html',
  ];
  for (final candidate in candidates) {
    final file = File(candidate);
    if (file.existsSync()) {
      return file;
    }
  }
  throw StateError('Could not find the Flutter public fallback shell.');
}

void main() {
  test('no-JavaScript shell retains the public WellFi content contract', () {
    final html = _publicShellFile().readAsStringSync();

    for (final requiredFragment in <String>[
      'id="fallback-main"',
      'id="fallback-wellfi"',
      'id="fallback-benefits"',
      'id="fallback-insight"',
      'id="fallback-company"',
      'id="fallback-contact"',
      'Know the Unknown',
      'Data Below.',
      'Benefits of WellFi',
      'Inside the string.',
      'The name comes from',
      'CANDIDATE WELL REVIEW',
      'info@yotinenergy.com',
      'Pressure rating',
      '10,000',
      'Temperature rating',
      '150',
      'MODBUS RS-485',
      'data-flutter-ready',
    ]) {
      expect(html, contains(requiredFragment));
    }

    expect(RegExp(r'<h1\b', caseSensitive: false).allMatches(html), hasLength(1));
    expect(html, contains('assets/assets/yotin-icon.png'));
    expect(html, contains('assets/assets/wellfi-logo.webp'));
    expect(html, contains('assets/assets/wellfi-island-r3f-poster.webp'));
    expect(html, contains('assets/assets/wellfi-internal-ghost.webp'));
    expect(html, isNot(contains('src="/assets/')));
    expect(html, isNot(contains("src='/assets/")));
  });
}
