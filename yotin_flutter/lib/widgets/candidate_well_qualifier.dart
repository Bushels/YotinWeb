import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/qualifier_model.dart';
import '../theme/yotin_theme.dart';

class CandidateWellQualifierWidget extends StatefulWidget {
  const CandidateWellQualifierWidget({super.key, this.firstDecisionKey});

  // Allows a page-level conversion CTA to land on the actual first choice,
  // rather than merely the top edge of this longer self-check card.
  final GlobalKey? firstDecisionKey;

  @override
  State<CandidateWellQualifierWidget> createState() =>
      _CandidateWellQualifierWidgetState();
}

class _CandidateWellQualifierWidgetState
    extends State<CandidateWellQualifierWidget> {
  QualifierState _state = const QualifierState();
  final TextEditingController _casingController = TextEditingController();
  String? _casingError;
  String? _actionStatus;
  bool _copied = false;

  @override
  void dispose() {
    _casingController.dispose();
    super.dispose();
  }

  void _selectOption(int stepIndex, String value) {
    QualifierState newState = _state;
    switch (stepIndex) {
      case 0:
        newState = _state.copyWith(lift: value, currentStep: 1);
        break;
      case 1:
        newState = _state.copyWith(wellType: value, currentStep: 2);
        break;
      case 2:
        newState = _state.copyWith(bottomholeTemp: value, currentStep: 3);
        break;
      case 4:
        newState = _state.copyWith(pumpLanding: value, currentStep: 5);
        break;
      case 5:
        newState = _state.copyWith(interventionTiming: value, currentStep: 6);
        break;
    }
    setState(() {
      _state = newState;
    });
  }

  void _submitCasingLength() {
    final text = _casingController.text.trim();
    final raw = text.replaceAll(RegExp(r'[^\d.]'), '');
    final val = double.tryParse(raw);

    if (val == null || val <= 0) {
      _showCasingError('Enter the approximate length in metres.');
      return;
    }

    if (val < 50 || val > 6000) {
      _showCasingError(
        'That looks outside the usual range (50–6,000 m). Double-check the figure.',
      );
      return;
    }

    setState(() {
      _casingError = null;
      _state = _state.copyWith(intermediateCasingLength: val, currentStep: 4);
    });
  }

  void _showCasingError(String message) {
    setState(() {
      _casingError = message;
    });
    if (MediaQuery.supportsAnnounceOf(context)) {
      SemanticsService.sendAnnouncement(
        View.of(context),
        message,
        Directionality.of(context),
        assertiveness: Assertiveness.assertive,
      );
    }
  }

  void _goBack() {
    if (_state.currentStep > 0) {
      setState(() {
        _state = _state.copyWith(currentStep: _state.currentStep - 1);
      });
    }
  }

  void _restart() {
    setState(() {
      _casingController.clear();
      _casingError = null;
      _actionStatus = null;
      _state = const QualifierState();
    });
  }

  Future<void> _copySummary() async {
    try {
      await Clipboard.setData(
        ClipboardData(text: _state.generateSummaryText()),
      );
      if (!mounted) return;
      setState(() {
        _copied = true;
        _actionStatus =
            'Copied — paste it into an email to info@yotinenergy.com.';
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _actionStatus =
            'Copy failed. Email info@yotinenergy.com with the details above.';
      });
    }
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() => _copied = false);
      }
    });
  }

  Future<void> _sendEmail() async {
    final subject = Uri.encodeComponent(_state.emailSubject);
    final body = Uri.encodeComponent(_state.generateSummaryText());
    final uri = Uri.parse(
      'mailto:info@yotinenergy.com?subject=$subject&body=$body',
    );

    var launched = false;
    try {
      launched = await launchUrl(uri);
    } catch (_) {
      launched = false;
    }
    if (!mounted) return;
    setState(() {
      _actionStatus = launched
          ? 'Opening your email client.'
          : 'Your email client could not open. Copy the summary or email info@yotinenergy.com.';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: YotinTheme.cardDecoration(glow: true),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Badge & Title
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 12,
            runSpacing: 8,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: YotinTheme.ember.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: YotinTheme.ember),
                ),
                child: Text(
                  'INTERACTIVE QUALIFIER',
                  style: YotinTheme.fontMono.copyWith(
                    fontSize: 11,
                    color: YotinTheme.ember,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              Text(
                _state.currentStep < 6
                    ? 'Step ${_state.currentStep + 1} of 6'
                    : 'Self-Check Verdict',
                style: YotinTheme.fontMono.copyWith(
                  fontSize: 12,
                  color: YotinTheme.textMuted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Candidate-Well Qualifier',
            style: YotinTheme.fontHero.copyWith(fontSize: 26),
          ),
          const SizedBox(height: 8),
          Text(
            'Evaluate your well parameters instantly against published WellFi electromagnetic telemetry limits.',
            style: YotinTheme.fontBody.copyWith(color: YotinTheme.textMuted),
          ),
          const SizedBox(height: 20),

          // 6-step progress bar
          _buildProgressBar(),
          const SizedBox(height: 24),

          // Main Step or Verdict Content
          LayoutBuilder(
            builder: (context, constraints) {
              final isDesktop = constraints.maxWidth > 850;

              final leftFlow = _state.currentStep < 6
                  ? _buildStepContent(_state.currentStep)
                  : _buildVerdictCard();

              final rightSchematic = Column(
                children: [
                  _buildWellPlacementReference(),
                  if (_state.currentStep == 6) ...[
                    const SizedBox(height: 16),
                    _buildActionButtons(),
                  ],
                ],
              );

              if (isDesktop) {
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(flex: 6, child: leftFlow),
                    const SizedBox(width: 24),
                    Expanded(flex: 5, child: rightSchematic),
                  ],
                );
              } else {
                return Column(
                  children: [
                    leftFlow,
                    const SizedBox(height: 24),
                    rightSchematic,
                  ],
                );
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildWellPlacementReference() {
    final threshold = _state.landingThreshold;
    final status = threshold == null
        ? 'Enter intermediate casing length to calculate the pump-landing reference.'
        : 'Target a pump landing shallower than $threshold m to preserve the intermediate-casing standoff reference.';

    return Semantics(
      image: true,
      label: 'WellFi placement reference. $status',
      child: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: YotinTheme.deep3,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: YotinTheme.sandLine),
        ),
        child: Column(
          children: [
            SizedBox(
              height: 208,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(12),
                ),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.asset(
                      'assets/drill-formation.webp',
                      fit: BoxFit.cover,
                    ),
                    DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            YotinTheme.voidBg.withValues(alpha: 0.12),
                            YotinTheme.voidBg.withValues(alpha: 0.56),
                          ],
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(18),
                      child: Image.asset(
                        'assets/drill-casing.webp',
                        fit: BoxFit.contain,
                      ),
                    ),
                    Align(
                      alignment: const Alignment(0.28, 0.28),
                      child: Container(
                        width: 190,
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: YotinTheme.voidBg.withValues(alpha: 0.88),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: YotinTheme.cyanSignal),
                        ),
                        child: Image.asset(
                          'assets/wellfi-internal-ghost.webp',
                          height: 34,
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(13),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.straighten,
                    size: 17,
                    color: YotinTheme.emberLit,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      status,
                      style: YotinTheme.fontBody.copyWith(
                        fontSize: 12,
                        color: YotinTheme.sandMute,
                        height: 1.45,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressBar() {
    return Row(
      children: List.generate(6, (index) {
        final isDone = index < _state.currentStep;
        final isCurrent = index == _state.currentStep && _state.currentStep < 6;

        Color color = YotinTheme.deep3;
        if (isDone) {
          color = YotinTheme.ember;
        } else if (isCurrent) {
          color = YotinTheme.emberLit;
        }

        return Expanded(
          child: Container(
            height: 4,
            margin: EdgeInsets.only(right: index < 5 ? 6.0 : 0.0),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildStepContent(int step) {
    switch (step) {
      case 0:
        return _buildOptionsStep(
          label: 'Artificial lift',
          question: 'What lifts the well?',
          questionKey: widget.firstDecisionKey,
          selectedValue: _state.lift,
          options: const [
            _OptionData('Progressing cavity pump (PCP)', tag: 'Best fit'),
            _OptionData('Electric submersible pump (ESP)'),
            _OptionData('Rod pump'),
            _OptionData('Natural flow or other'),
          ],
          onSelect: (val) => _selectOption(0, val),
        );
      case 1:
        return _buildOptionsStep(
          label: 'Well type',
          question: 'What is it producing?',
          selectedValue: _state.wellType,
          options: const [
            _OptionData('Heavy oil'),
            _OptionData('Light oil'),
            _OptionData('Gas'),
            _OptionData('Thermal / SAGD'),
          ],
          onSelect: (val) => _selectOption(1, val),
        );
      case 2:
        return _buildOptionsStep(
          label: 'Bottomhole temperature',
          question: 'How hot does it get downhole?',
          selectedValue: _state.bottomholeTemp,
          options: const [
            _OptionData('Under 100 °C'),
            _OptionData('100 – 150 °C', tag: 'At spec'),
            _OptionData('Above 150 °C'),
            _OptionData('Not sure'),
          ],
          onSelect: (val) => _selectOption(2, val),
        );
      case 3:
        return _buildNumberInputStep();
      case 4:
        final threshold = _state.landingThreshold;
        final question = threshold != null
            ? 'Is the pump landed shallower or deeper than $threshold m?'
            : 'Where does the pump land in the intermediate casing?';
        final hint =
            'That is 10% of your intermediate above the shoe — the standoff WellFi needs to run inside the tubing.';
        final options = threshold != null
            ? [
                _OptionData(
                  'Shallower than $threshold m',
                  tag: '< $threshold m',
                ),
                _OptionData('Deeper than $threshold m', tag: '> $threshold m'),
                const _OptionData('Not sure'),
              ]
            : const [
                _OptionData('Well above the shoe'),
                _OptionData('Close to the shoe'),
                _OptionData('Not sure'),
              ];

        return _buildOptionsStep(
          label: 'Pump landing',
          question: question,
          hint: hint,
          selectedValue: _state.pumpLanding,
          options: options,
          onSelect: (val) => _selectOption(4, val),
        );
      case 5:
        return _buildOptionsStep(
          label: 'Next planned intervention',
          question: 'When is the next pump change or planned intervention?',
          selectedValue: _state.interventionTiming,
          options: const [
            _OptionData('Within 3 months', tag: 'Ideal timing'),
            _OptionData('3 – 12 months'),
            _OptionData('Nothing scheduled'),
            _OptionData('Not sure'),
          ],
          onSelect: (val) => _selectOption(5, val),
        );
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildOptionsStep({
    required String label,
    required String question,
    GlobalKey? questionKey,
    String? hint,
    required String? selectedValue,
    required List<_OptionData> options,
    required ValueChanged<String> onSelect,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: YotinTheme.deep2,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: YotinTheme.sandLine),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: YotinTheme.fontMono.copyWith(
              fontSize: 11,
              color: YotinTheme.sand,
            ),
          ),
          const SizedBox(height: 6),
          KeyedSubtree(
            key: questionKey,
            child: Text(
              question,
              style: YotinTheme.fontHero.copyWith(
                fontSize: 18,
                color: YotinTheme.textWhite,
              ),
            ),
          ),
          if (hint != null) ...[
            const SizedBox(height: 6),
            Text(
              hint,
              style: YotinTheme.fontBody.copyWith(
                fontSize: 12,
                color: YotinTheme.textMuted,
              ),
            ),
          ],
          const SizedBox(height: 16),
          Column(
            children: options.map((opt) {
              final isSelected = selectedValue == opt.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: InkWell(
                  onTap: () => onSelect(opt.value),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected ? YotinTheme.ember : YotinTheme.deep3,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isSelected
                            ? YotinTheme.emberLit
                            : YotinTheme.sandLine,
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            opt.value,
                            style: YotinTheme.fontBody.copyWith(
                              fontSize: 13,
                              color: isSelected
                                  ? YotinTheme.voidBg
                                  : YotinTheme.textWhite,
                              fontWeight: isSelected
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                            ),
                          ),
                        ),
                        if (opt.tag != null) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? YotinTheme.voidBg.withValues(alpha: 0.2)
                                  : YotinTheme.ember.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              opt.tag!,
                              style: YotinTheme.fontMono.copyWith(
                                fontSize: 11,
                                color: isSelected
                                    ? YotinTheme.voidBg
                                    : YotinTheme.emberLit,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          if (_state.currentStep > 0) ...[
            const SizedBox(height: 12),
            OutlinedButton.icon(
              icon: const Icon(Icons.arrow_back, size: 16),
              label: Text(
                'Back',
                style: YotinTheme.fontMono.copyWith(fontSize: 12),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: YotinTheme.sand,
                side: BorderSide(color: YotinTheme.sandLine),
              ),
              onPressed: _goBack,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildNumberInputStep() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: YotinTheme.deep2,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: YotinTheme.sandLine),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'INTERMEDIATE CASING LENGTH',
            style: YotinTheme.fontMono.copyWith(
              fontSize: 11,
              color: YotinTheme.sand,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'How long is your intermediate casing, approximately?',
            style: YotinTheme.fontHero.copyWith(
              fontSize: 18,
              color: YotinTheme.textWhite,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  key: const ValueKey('intermediate-casing-length'),
                  controller: _casingController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[\d.]')),
                  ],
                  style: YotinTheme.fontMono.copyWith(
                    color: YotinTheme.textWhite,
                    fontSize: 14,
                  ),
                  decoration: InputDecoration(
                    // Flutter Web exposes hintText as the native input's
                    // accessible name. Keep the visible prompt meaningful,
                    // not merely the example value, for assistive technology.
                    hintText: 'Intermediate casing length (m), e.g. 1000',
                    hintStyle: YotinTheme.fontMono.copyWith(
                      color: YotinTheme.textMuted,
                    ),
                    filled: true,
                    fillColor: YotinTheme.deep3,
                    suffixText: 'm',
                    suffixStyle: YotinTheme.fontMono.copyWith(
                      color: YotinTheme.emberLit,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: YotinTheme.sandLine),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(color: YotinTheme.ember),
                    ),
                  ),
                  onSubmitted: (_) => _submitCasingLength(),
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: YotinTheme.ember,
                  foregroundColor: YotinTheme.voidBg,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 16,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                onPressed: _submitCasingLength,
                child: Text(
                  'Continue',
                  style: YotinTheme.fontMono.copyWith(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
          if (_casingError != null) ...[
            const SizedBox(height: 8),
            Semantics(
              container: true,
              liveRegion: true,
              excludeSemantics: true,
              label: _casingError!,
              child: Text(
                _casingError!,
                style: YotinTheme.fontBody.copyWith(
                  fontSize: 12,
                  color: Colors.orangeAccent,
                ),
              ),
            ),
          ],
          if (_state.currentStep > 0) ...[
            const SizedBox(height: 16),
            OutlinedButton.icon(
              icon: const Icon(Icons.arrow_back, size: 16),
              label: Text(
                'Back',
                style: YotinTheme.fontMono.copyWith(fontSize: 12),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: YotinTheme.sand,
                side: BorderSide(color: YotinTheme.sandLine),
              ),
              onPressed: _goBack,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildVerdictCard() {
    Color bannerColor;
    IconData icon;
    String title;
    String headline;
    String detail;

    switch (_state.outcome) {
      case QualifierOutcome.strong:
        bannerColor = Colors.greenAccent;
        icon = Icons.check_circle;
        title = 'STRONG CANDIDATE FIT';
        headline = 'This well looks like a straightforward deployment.';
        detail =
            'Everything you entered sits inside WellFi\'s operating envelope. The next step is confirming tubing configuration and what data you want out of it.';
        break;
      case QualifierOutcome.review:
        bannerColor = Colors.amberAccent;
        icon = Icons.warning_amber_rounded;
        title = 'LIKELY FIT — WORTH ENGINEERING REVIEW';
        headline = 'Probably workable, with a couple of things to confirm.';
        detail =
            'Nothing you entered rules it out. These are the points our team would want to walk through before committing to a deployment date.';
        break;
      case QualifierOutcome.future:
        bannerColor = YotinTheme.emberLit;
        icon = Icons.hourglass_top;
        title = 'HIGH-TEMP VERSION IN DEVELOPMENT';
        headline = 'Above 150 °C — that build is in progress.';
        detail =
            'WellFi is rated to 150 °C today, and a higher-temperature version is in development. Send this well through and we will come back to you when it is ready, rather than you starting from scratch later.';
        break;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: YotinTheme.deep2,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: bannerColor.withValues(alpha: 0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: bannerColor, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: YotinTheme.fontMono.copyWith(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: bannerColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            headline,
            style: YotinTheme.fontHero.copyWith(
              fontSize: 16,
              color: YotinTheme.textWhite,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            detail,
            style: YotinTheme.fontBody.copyWith(
              fontSize: 12,
              color: YotinTheme.textMuted,
            ),
          ),
          if (_state.reviewNotes.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              'ENGINEERING REVIEW NOTES',
              style: YotinTheme.fontMono.copyWith(
                fontSize: 11,
                color: YotinTheme.sand,
              ),
            ),
            const SizedBox(height: 6),
            ..._state.reviewNotes.map(
              (note) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '• ',
                      style: TextStyle(color: YotinTheme.emberLit),
                    ),
                    Expanded(
                      child: Text(
                        note,
                        style: YotinTheme.fontBody.copyWith(
                          fontSize: 12,
                          color: YotinTheme.sandMute,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 12),
          Divider(color: YotinTheme.sandLine),
          const SizedBox(height: 8),
          _buildSummaryRows(),
          const SizedBox(height: 12),
          Text(
            'Note: Automated self-check estimate based on published specifications; not a binding deployment authorization.',
            style: YotinTheme.fontBody.copyWith(
              fontSize: 11,
              color: YotinTheme.textMuted,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRows() {
    final rows = [
      MapEntry('Artificial lift', _state.lift ?? '—'),
      MapEntry('Well type', _state.wellType ?? '—'),
      MapEntry('Bottomhole temperature', _state.bottomholeTemp ?? '—'),
      MapEntry(
        'Intermediate casing length',
        _state.intermediateCasingLength != null
            ? '${_state.intermediateCasingLength!.toStringAsFixed(0)} m'
            : '—',
      ),
      MapEntry('Pump landing', _state.pumpLanding ?? '—'),
      MapEntry('Next planned intervention', _state.interventionTiming ?? '—'),
    ];

    return Column(
      children: rows
          .map(
            (e) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(
                children: [
                  Text(
                    '${e.key}: ',
                    style: YotinTheme.fontMono.copyWith(
                      fontSize: 11,
                      color: YotinTheme.textMuted,
                    ),
                  ),
                  Expanded(
                    child: Text(
                      e.value,
                      textAlign: TextAlign.end,
                      style: YotinTheme.fontMono.copyWith(
                        fontSize: 11,
                        color: YotinTheme.sand,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          )
          .toList(),
    );
  }

  Widget _buildActionButtons() {
    final ctaLabel = _state.outcome == QualifierOutcome.future
        ? 'HAVE YOTIN FOLLOW UP'
        : 'SUBMIT CANDIDATE WELL';

    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            icon: const Icon(Icons.email, size: 18),
            label: Text(
              ctaLabel,
              style: YotinTheme.fontMono.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: YotinTheme.ember,
              foregroundColor: YotinTheme.voidBg,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            onPressed: _sendEmail,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          alignment: WrapAlignment.center,
          children: [
            OutlinedButton.icon(
              icon: Icon(
                _copied ? Icons.check : Icons.copy,
                size: 16,
                color: YotinTheme.sand,
              ),
              label: Text(
                _copied ? 'COPIED' : 'COPY SUMMARY',
                style: YotinTheme.fontMono.copyWith(
                  color: YotinTheme.sand,
                  fontSize: 12,
                ),
              ),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: YotinTheme.sandLineStrong),
                padding: const EdgeInsets.symmetric(
                  vertical: 12,
                  horizontal: 16,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              onPressed: _copySummary,
            ),
            OutlinedButton.icon(
              icon: const Icon(Icons.refresh, size: 16, color: YotinTheme.sand),
              label: Text(
                'START OVER',
                style: YotinTheme.fontMono.copyWith(
                  color: YotinTheme.sand,
                  fontSize: 12,
                ),
              ),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: YotinTheme.sandLine),
                padding: const EdgeInsets.symmetric(
                  vertical: 12,
                  horizontal: 16,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              onPressed: _restart,
            ),
          ],
        ),
        if (_actionStatus != null) ...[
          const SizedBox(height: 8),
          Semantics(
            liveRegion: true,
            child: Text(
              _actionStatus!,
              style: YotinTheme.fontBody.copyWith(
                fontSize: 11,
                color: YotinTheme.textMuted,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _OptionData {
  final String value;
  final String? tag;
  const _OptionData(this.value, {this.tag});
}
