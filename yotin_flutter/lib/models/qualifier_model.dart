import 'package:flutter/foundation.dart';

enum QualifierOutcome { strong, review, future }

@immutable
class QualifierState {
  final int currentStep;
  final String? lift;
  final String? wellType;
  final String? bottomholeTemp;
  final double? intermediateCasingLength;
  final String? pumpLanding;
  final String? interventionTiming;

  const QualifierState({
    this.currentStep = 0,
    this.lift,
    this.wellType,
    this.bottomholeTemp,
    this.intermediateCasingLength,
    this.pumpLanding,
    this.interventionTiming,
  });

  /// Calculates derived pump landing threshold (nearest 10m to 0.9 * casing length).
  static int calculateLandingThreshold(double casingLength) {
    return ((casingLength * 0.9) / 10).round() * 10;
  }

  int? get landingThreshold {
    final len = intermediateCasingLength;
    if (len == null) return null;
    return calculateLandingThreshold(len);
  }

  /// Evaluates active review/future flags based on selected options.
  List<String> get flags {
    final activeFlags = <String>[];

    if (lift == 'Natural flow or other') {
      activeFlags.add('lift');
    }
    if (wellType == 'Thermal / SAGD') {
      activeFlags.add('thermal');
    }
    if (bottomholeTemp == 'Not sure') {
      activeFlags.add('temp');
    }
    if (bottomholeTemp == 'Above 150 °C') {
      activeFlags.add('future');
    }

    if (pumpLanding != null) {
      if (pumpLanding!.startsWith('Deeper than') ||
          pumpLanding == 'Close to the shoe') {
        activeFlags.add('external');
      } else if (pumpLanding == 'Not sure') {
        activeFlags.add('landing');
      }
    }

    if (interventionTiming == 'Nothing scheduled' ||
        interventionTiming == 'Not sure') {
      activeFlags.add('timing');
    }

    return activeFlags;
  }

  bool get isHighTemp => bottomholeTemp == 'Above 150 °C';

  QualifierOutcome get outcome {
    if (isHighTemp) {
      return QualifierOutcome.future;
    }
    if (flags.isNotEmpty) {
      return QualifierOutcome.review;
    }
    return QualifierOutcome.strong;
  }

  static const Map<String, String> qualifierNotes = {
    'temp':
        'Bottomhole temperature is the one hard limit — WellFi is rated to 150 °C today, so that number is worth confirming before anything else.',
    'external':
        'Landed that deep, WellFi would run outside the intermediate rather than inside the tubing. The collar wants roughly 10% of the intermediate\'s length of standoff above the shoe; any closer and an emitter sitting at the cemented shoe barely couples to the formation. Running it outside is routine, but it changes the install and is worth confirming early.',
    'landing':
        'Where the pump sits relative to the intermediate shoe decides whether WellFi runs inside the tubing or outside the intermediate. Worth pinning down before the changeout gets scoped.',
    'timing':
        'WellFi can go in on a new completion, a planned changeout, or its own run. The economics are simply strongest when it rides along with work that is already scheduled.',
    'lift':
        'Most deployments so far are on pumped wells. Other lift types are workable but worth walking through.',
    'thermal':
        'Thermal and SAGD wells sit closest to the temperature ceiling, so the operating profile matters more than usual.',
  };

  List<String> get reviewNotes {
    final notes = <String>[];
    for (final flag in flags) {
      final note = qualifierNotes[flag];
      if (note != null) {
        notes.add(note);
      }
    }
    return notes;
  }

  String get selfCheckResultLabel {
    switch (outcome) {
      case QualifierOutcome.strong:
        return 'Strong fit';
      case QualifierOutcome.review:
        return 'Likely fit — worth a review';
      case QualifierOutcome.future:
        return 'Above 150 °C — waiting on the high-temperature version';
    }
  }

  String get emailSubject {
    return outcome == QualifierOutcome.future
        ? 'Candidate well — awaiting 150 °C+ WellFi'
        : 'Candidate well review — WellFi';
  }

  String generateSummaryText() {
    final buffer = StringBuffer();
    buffer.writeln('Candidate well review — WellFi');
    buffer.writeln();
    buffer.writeln('Artificial lift: ${lift ?? "—"}');
    buffer.writeln('Well type: ${wellType ?? "—"}');
    buffer.writeln('Bottomhole temperature: ${bottomholeTemp ?? "—"}');
    buffer.writeln(
      'Intermediate casing length: ${intermediateCasingLength != null ? "${intermediateCasingLength!.toStringAsFixed(0)} m" : "—"}',
    );
    buffer.writeln('Pump landing: ${pumpLanding ?? "—"}');
    buffer.writeln('Next planned intervention: ${interventionTiming ?? "—"}');
    buffer.writeln();
    buffer.writeln('Self-check result: $selfCheckResultLabel');
    buffer.writeln(
      'Note: Automated self-check estimate based on published specifications; not a binding deployment authorization.',
    );

    if (reviewNotes.isNotEmpty) {
      buffer.writeln();
      buffer.writeln('Engineering Notes:');
      for (final note in reviewNotes) {
        buffer.writeln('- $note');
      }
    }

    buffer.writeln();
    buffer.writeln('Sent from yotinenergy.com');
    return buffer.toString();
  }

  QualifierState copyWith({
    int? currentStep,
    String? lift,
    String? wellType,
    String? bottomholeTemp,
    double? intermediateCasingLength,
    String? pumpLanding,
    String? interventionTiming,
  }) {
    return QualifierState(
      currentStep: currentStep ?? this.currentStep,
      lift: lift ?? this.lift,
      wellType: wellType ?? this.wellType,
      bottomholeTemp: bottomholeTemp ?? this.bottomholeTemp,
      intermediateCasingLength:
          intermediateCasingLength ?? this.intermediateCasingLength,
      pumpLanding: pumpLanding ?? this.pumpLanding,
      interventionTiming: interventionTiming ?? this.interventionTiming,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is QualifierState &&
        other.currentStep == currentStep &&
        other.lift == lift &&
        other.wellType == wellType &&
        other.bottomholeTemp == bottomholeTemp &&
        other.intermediateCasingLength == intermediateCasingLength &&
        other.pumpLanding == pumpLanding &&
        other.interventionTiming == interventionTiming;
  }

  @override
  int get hashCode => Object.hash(
    currentStep,
    lift,
    wellType,
    bottomholeTemp,
    intermediateCasingLength,
    pumpLanding,
    interventionTiming,
  );
}
