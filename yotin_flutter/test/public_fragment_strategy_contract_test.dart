import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('public fragments stay outside Flutter route-history ownership', () {
    final main = File('lib/main.dart').readAsStringSync();
    final bridge = File(
      'lib/platform/fragment_navigation_web.dart',
    ).readAsStringSync();

    // The marketing candidate is a single HTML document with native anchors,
    // not a Flutter route table. If Flutter takes browser-history ownership,
    // its route state can overwrite #wellfi-style public fragments.
    expect(main, contains('setUrlStrategy(null);'));
    expect(main, contains('reportsRouteUpdateToEngine: false,'));
    expect(main, isNot(contains('usePathUrlStrategy();')));
    expect(main, contains("normalizePublicSectionId(fragment ?? '')"));
    expect(main, contains('_lastHandledPublicFragment'));
    expect(bridge, contains("history.pushState(null, '', '#\$fragment')"));
    expect(bridge, contains('popStateEvent'));
  });
}
