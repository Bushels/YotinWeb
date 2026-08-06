import 'package:flutter_test/flutter_test.dart';
import 'package:yotin_flutter/models/public_section.dart';

void main() {
  test('public fragments preserve the static-site anchor contract', () {
    expect(normalizePublicSectionId('top'), 'hero');
    expect(normalizePublicSectionId('#hero'), 'hero');
    expect(normalizePublicSectionId('#wellfi'), 'wellfi');
    expect(normalizePublicSectionId('benefits'), 'benefits');
    expect(normalizePublicSectionId('insight'), 'insight');
    expect(normalizePublicSectionId('company'), 'company');
    expect(normalizePublicSectionId('contact'), 'contact');
    expect(normalizePublicSectionId('qualifier'), 'qualifier');
  });

  test('unknown fragments cannot move a public visitor', () {
    expect(normalizePublicSectionId(null), isNull);
    expect(normalizePublicSectionId(''), 'hero');
    expect(normalizePublicSectionId('#unknown'), isNull);
    expect(normalizePublicSectionId('../contact'), isNull);
  });

  test('home navigation emits the historic top fragment', () {
    expect(publicFragmentForSection('hero'), 'top');
    expect(publicFragmentForSection('wellfi'), 'wellfi');
    expect(publicFragmentForSection('unknown'), isNull);
  });
}
