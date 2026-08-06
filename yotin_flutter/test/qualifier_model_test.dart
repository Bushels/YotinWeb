import 'package:flutter_test/flutter_test.dart';
import 'package:yotin_flutter/models/qualifier_model.dart';

void main() {
  group('QualifierState threshold rounding', () {
    test(
      'calculateLandingThreshold rounds nearest 10m to 0.9x casing length',
      () {
        expect(QualifierState.calculateLandingThreshold(1000.0), 900);
        expect(QualifierState.calculateLandingThreshold(1523.0), 1370);
        expect(QualifierState.calculateLandingThreshold(1526.0), 1370);
        expect(QualifierState.calculateLandingThreshold(1530.0), 1380);
        expect(QualifierState.calculateLandingThreshold(500.0), 450);
        expect(QualifierState.calculateLandingThreshold(6000.0), 5400);
      },
    );

    test(
      'landingThreshold getter calculates threshold from intermediateCasingLength',
      () {
        const stateWithoutLength = QualifierState();
        expect(stateWithoutLength.landingThreshold, isNull);

        const stateWithLength = QualifierState(
          intermediateCasingLength: 1000.0,
        );
        expect(stateWithLength.landingThreshold, 900);
      },
    );
  });

  group('QualifierState outcome assessment', () {
    test(
      'strong fit outcome when all responses are standard without flags',
      () {
        const state = QualifierState(
          currentStep: 6,
          lift: 'Progressing cavity pump (PCP)',
          wellType: 'Heavy oil',
          bottomholeTemp: 'Under 100 °C',
          intermediateCasingLength: 1000.0,
          pumpLanding: 'Shallower than 900 m',
          interventionTiming: 'Within 3 months',
        );

        expect(state.outcome, QualifierOutcome.strong);
        expect(state.flags, isEmpty);
        expect(state.reviewNotes, isEmpty);
        expect(state.selfCheckResultLabel, 'Strong fit');
        expect(state.emailSubject, 'Candidate well review — WellFi');
      },
    );

    test('review fit outcome when any review flag is triggered', () {
      const stateWithReviewFlags = QualifierState(
        currentStep: 6,
        lift: 'Natural flow or other',
        wellType: 'Thermal / SAGD',
        bottomholeTemp: 'Not sure',
        intermediateCasingLength: 1000.0,
        pumpLanding: 'Deeper than 900 m',
        interventionTiming: 'Nothing scheduled',
      );

      expect(stateWithReviewFlags.outcome, QualifierOutcome.review);
      expect(
        stateWithReviewFlags.flags,
        containsAll(['lift', 'thermal', 'temp', 'external', 'timing']),
      );
      expect(stateWithReviewFlags.reviewNotes.length, 5);
      expect(
        stateWithReviewFlags.selfCheckResultLabel,
        'Likely fit — worth a review',
      );
      expect(
        stateWithReviewFlags.emailSubject,
        'Candidate well review — WellFi',
      );
    });

    test(
      'future high-temperature follow-up outcome when temp is above 150 °C',
      () {
        const highTempState = QualifierState(
          currentStep: 6,
          lift: 'Progressing cavity pump (PCP)',
          wellType: 'Thermal / SAGD',
          bottomholeTemp: 'Above 150 °C',
          intermediateCasingLength: 1000.0,
          pumpLanding: 'Shallower than 900 m',
          interventionTiming: 'Within 3 months',
        );

        expect(highTempState.isHighTemp, isTrue);
        expect(highTempState.outcome, QualifierOutcome.future);
        expect(
          highTempState.selfCheckResultLabel,
          'Above 150 °C — waiting on the high-temperature version',
        );
        expect(
          highTempState.emailSubject,
          'Candidate well — awaiting 150 °C+ WellFi',
        );
      },
    );
  });

  group('QualifierState immutability and copyWith', () {
    test('copyWith creates a new instance with updated properties', () {
      const initial = QualifierState();
      final updated = initial.copyWith(
        currentStep: 1,
        lift: 'Progressing cavity pump (PCP)',
      );

      expect(initial.currentStep, 0);
      expect(initial.lift, isNull);

      expect(updated.currentStep, 1);
      expect(updated.lift, 'Progressing cavity pump (PCP)');
      expect(updated, isNot(equals(initial)));
    });

    test('value equality comparison operator ==', () {
      const state1 = QualifierState(
        currentStep: 2,
        lift: 'Rod pump',
        wellType: 'Light oil',
      );
      const state2 = QualifierState(
        currentStep: 2,
        lift: 'Rod pump',
        wellType: 'Light oil',
      );

      expect(state1, equals(state2));
      expect(state1.hashCode, equals(state2.hashCode));
    });
  });
}
