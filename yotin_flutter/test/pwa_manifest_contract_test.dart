import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

File _projectFile(String path) {
  for (final candidate in <String>[path, 'yotin_flutter/$path']) {
    final file = File(candidate);
    if (file.existsSync()) return file;
  }
  throw StateError('Could not find $path.');
}

void main() {
  test('PWA manifest keeps the Field Review install contract', () {
    final manifest =
        jsonDecode(_projectFile('web/manifest.json').readAsStringSync())
            as Map<String, Object?>;

    expect(manifest['name'], 'Yotin Energy Field Review');
    expect(manifest['short_name'], 'Yotin Review');
    expect(manifest['start_url'], './');
    expect(manifest['scope'], './');
    expect(manifest['display'], 'standalone');
    expect(manifest['prefer_related_applications'], isFalse);

    final icons = (manifest['icons'] as List<Object?>)
        .cast<Map<String, Object?>>();
    expect(icons, hasLength(4));
    for (final icon in icons) {
      expect(
        icon['src'],
        isA<String>().having((src) => src, 'source', startsWith('icons/')),
      );
      expect(icon['type'], 'image/png');
    }
    expect(icons.any((icon) => icon['purpose'] == 'maskable'), isTrue);
  });
}
