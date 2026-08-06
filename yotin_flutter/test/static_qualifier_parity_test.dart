import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  final staticQualifierSource = File('../main.js').readAsStringSync();
  final flutterQualifierSource = File(
    'lib/widgets/candidate_well_qualifier.dart',
  ).readAsStringSync();
  final flutterQualifierModelSource = File(
    'lib/models/qualifier_model.dart',
  ).readAsStringSync();
  final flutterSources = '$flutterQualifierSource\n$flutterQualifierModelSource';

  test(
    'Flutter qualifier retains the approved static candidate-well contract',
    () {
      const publicValues = <String>[
        'Artificial lift',
        'What lifts the well?',
        'Progressing cavity pump (PCP)',
        'Electric submersible pump (ESP)',
        'Rod pump',
        'Natural flow or other',
        'Well type',
        'What is it producing?',
        'Heavy oil',
        'Light oil',
        'Gas',
        'Thermal / SAGD',
        'Bottomhole temperature',
        'How hot does it get downhole?',
        'Under 100 °C',
        '100 – 150 °C',
        'Above 150 °C',
        'Intermediate casing length',
        'How long is your intermediate casing, approximately?',
        'Pump landing',
        'Next planned intervention',
        'When is the next pump change or planned intervention?',
        'Within 3 months',
        '3 – 12 months',
        'Nothing scheduled',
      ];

      for (final value in publicValues) {
        expect(
          staticQualifierSource,
          contains(value),
          reason: 'Static qualifier no longer contains "$value".',
        );
        expect(
          flutterSources,
          contains(value),
          reason: 'Flutter qualifier drifted from static copy: "$value".',
        );
      }

      expect(
        staticQualifierSource,
        contains('var threshold = Math.round((len * 0.9) / 10) * 10;'),
      );
      expect(
        flutterQualifierModelSource,
        contains('return ((casingLength * 0.9) / 10).round() * 10;'),
      );
      expect(staticQualifierSource, contains('min: 50'));
      expect(staticQualifierSource, contains('max: 6000'));
      expect(
        flutterQualifierSource,
        contains('if (val < 50 || val > 6000)'),
      );
    },
  );

  test('both qualifier paths retain honest lead hand-off fallbacks', () {
    const highTemperatureSubject = 'Candidate well — awaiting 150 °C+ WellFi';

    expect(staticQualifierSource, contains(highTemperatureSubject));
    expect(flutterQualifierModelSource, contains(highTemperatureSubject));
    expect(staticQualifierSource, contains('navigator.clipboard.writeText'));
    expect(flutterQualifierSource, contains('Clipboard.setData'));
    expect(
      staticQualifierSource,
      contains('mailto:" + QUALIFIER_EMAIL'),
    );
    expect(
      flutterQualifierSource,
      contains(r'mailto:info@yotinenergy.com?subject=$subject&body=$body'),
    );
  });
}
