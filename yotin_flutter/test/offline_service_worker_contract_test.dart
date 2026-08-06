import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

File _projectFile(String path) {
  for (final candidate in <String>[path, 'yotin_flutter/$path']) {
    final file = File(candidate);
    if (file.existsSync()) return file;
  }
  throw StateError('Could not find $path.');
}

File _repositoryFile(String path) {
  for (final candidate in <String>[path, '../$path']) {
    final file = File(candidate);
    if (file.existsSync()) return file;
  }
  throw StateError('Could not find repository file $path.');
}

void main() {
  test('offline worker is explicit, route-scoped, and same-origin only', () {
    final worker = _projectFile(
      'web/field_review_service_worker.js',
    ).readAsStringSync();
    final bridge = _projectFile(
      'lib/platform/offline_field_review_cache_web.dart',
    ).readAsStringSync();

    expect(worker, contains("self.skipWaiting()"));
    expect(worker, contains('self.clients.claim()'));
    expect(worker, contains("cache: 'reload'"));
    expect(worker, contains('request.method !== \'GET\''));
    expect(worker, contains('url.origin === scope.origin'));
    expect(worker, contains('request.mode === \'navigate\''));
    expect(worker, contains('field-review-cache-manifest.json'));
    expect(worker, contains('name !== metadataCache'));
    expect(worker, contains('activeCacheName === pendingCacheName'));
    expect(worker, contains('async function networkFirstAsset'));
    expect(worker, isNot(contains('mpsgroup.energy')));
    expect(worker, isNot(contains('chatfi')));

    expect(bridge, contains("field_review_service_worker.js"));
    expect(bridge, contains("web.RegistrationOptions(scope: './')"));
    expect(bridge, contains('serviceWorker.ready.toDart'));
  });

  test('release build derives the offline package from compiled assets', () {
    final buildScript = _projectFile(
      'tool/build_field_review.ps1',
    ).readAsStringSync();

    expect(buildScript, contains('field_review_service_worker.js'));
    expect(buildScript, contains('field-review-cache-manifest.json'));
    expect(buildScript, contains('Get-FileHash'));
    expect(buildScript, contains("'flutter_service_worker.js'"));
    expect(buildScript, contains("'field_review_service_worker.js'"));
    expect(buildScript, contains('offline cache manifest'));
  });

  test('preview wrapper requires both offline release artifacts', () {
    final previewScript = _repositoryFile(
      'tool/build_field_review_preview.ps1',
    ).readAsStringSync();

    expect(previewScript, contains("'field_review_service_worker.js'"));
    expect(previewScript, contains("'field-review-cache-manifest.json'"));
  });
}
