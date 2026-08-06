import 'package:flutter/material.dart';
import '../models/benefit_model.dart';
import '../theme/yotin_theme.dart';

class BenefitDrillExplorerWidget extends StatefulWidget {
  final double scrollProgress; // 0.0 to 1.0 bound to scroll depth

  const BenefitDrillExplorerWidget({super.key, this.scrollProgress = 0.0});

  @override
  State<BenefitDrillExplorerWidget> createState() =>
      _BenefitDrillExplorerWidgetState();
}

class _BenefitDrillExplorerWidgetState
    extends State<BenefitDrillExplorerWidget> {
  int _manualStep = -1;

  int get _effectiveStep {
    if (_manualStep >= 0) return _manualStep;
    final calculated = (widget.scrollProgress * (kWellFiBenefits.length - 0.01))
        .floor();
    return calculated.clamp(0, kWellFiBenefits.length - 1);
  }

  @override
  Widget build(BuildContext context) {
    final activeStep = _effectiveStep;
    final activeItem = kWellFiBenefits[activeStep];

    return Container(
      decoration: YotinTheme.cardDecoration(glow: true),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Eyebrow & Live Progress Indicator
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
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: YotinTheme.cyanSignal,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'FIELD REVIEW',
                      style: YotinTheme.fontMono.copyWith(
                        fontSize: 11,
                        color: YotinTheme.ember,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                'STEP ${activeStep + 1}/${kWellFiBenefits.length}',
                style: YotinTheme.fontMono.copyWith(
                  fontSize: 11,
                  color: YotinTheme.cyanSignal,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Benefits of WellFi',
            style: YotinTheme.fontHero.copyWith(fontSize: 28),
          ),
          const SizedBox(height: 8),
          Text(
            'Select a benefit or scroll through the field-review sequence.',
            style: YotinTheme.fontBody.copyWith(color: YotinTheme.textMuted),
          ),
          const SizedBox(height: 20),

          // Scroll Progress Rail Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: widget.scrollProgress,
              backgroundColor: YotinTheme.deep3,
              valueColor: const AlwaysStoppedAnimation<Color>(
                YotinTheme.emberLit,
              ),
              minHeight: 4,
            ),
          ),
          const SizedBox(height: 20),

          // Step Selector Buttons
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: List.generate(kWellFiBenefits.length, (index) {
              final isSelected = index == activeStep;
              final item = kWellFiBenefits[index];
              return ChoiceChip(
                label: Text(
                  '${item.step}. ${item.title}',
                  style: YotinTheme.fontMono.copyWith(
                    fontSize: 12,
                    color: isSelected
                        ? YotinTheme.voidBg
                        : YotinTheme.textWhite,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w400,
                  ),
                ),
                selected: isSelected,
                selectedColor: YotinTheme.ember,
                backgroundColor: YotinTheme.deep2,
                side: BorderSide(
                  color: isSelected ? YotinTheme.emberLit : YotinTheme.sandLine,
                ),
                onSelected: (val) {
                  setState(() => _manualStep = val ? index : -1);
                },
              );
            }),
          ),
          const SizedBox(height: 24),

          // Main Layout: Active Step Text on Left, Scrubbed Custom Canvas Cutaway on Right
          LayoutBuilder(
            builder: (context, constraints) {
              final isDesktop = constraints.maxWidth > 800;

              final leftCard = AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: Container(
                  key: ValueKey<int>(activeStep),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: YotinTheme.deep2,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: YotinTheme.ember.withValues(alpha: 0.5),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        activeItem.subtitle.toUpperCase(),
                        style: YotinTheme.fontMono.copyWith(
                          fontSize: 12,
                          color: YotinTheme.emberLit,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        activeItem.title,
                        style: YotinTheme.fontHero.copyWith(fontSize: 24),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        activeItem.description,
                        style: YotinTheme.fontBody.copyWith(
                          fontSize: 15,
                          height: 1.6,
                          color: YotinTheme.textWhite,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: YotinTheme.deep3,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: YotinTheme.sandLine),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.verified_outlined,
                              color: YotinTheme.cyanSignal,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'FIELD CONTEXT: ${activeItem.spec}',
                                style: YotinTheme.fontMono.copyWith(
                                  fontSize: 12,
                                  color: YotinTheme.cyanSignal,
                                  fontWeight: FontWeight.bold,
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

              final rightCard = Semantics(
                image: true,
                label:
                    'WellFi tool position shown against a downhole formation cross-section.',
                child: Container(
                  height: 280,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: YotinTheme.voidBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: YotinTheme.sandLine),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        Image.asset(
                          'assets/drill-formation.webp',
                          fit: BoxFit.cover,
                          filterQuality: FilterQuality.high,
                        ),
                        DecoratedBox(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                YotinTheme.voidBg.withValues(alpha: 0.15),
                                YotinTheme.voidBg.withValues(alpha: 0.55),
                              ],
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(20),
                          child: Image.asset(
                            'assets/drill-casing.webp',
                            fit: BoxFit.contain,
                            alignment: Alignment.centerLeft,
                          ),
                        ),
                        AnimatedAlign(
                          duration: const Duration(milliseconds: 250),
                          curve: Curves.easeOutCubic,
                          alignment: Alignment(
                            0.28,
                            -0.62 + (widget.scrollProgress * 1.24),
                          ),
                          child: Container(
                            width: 180,
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: YotinTheme.voidBg.withValues(alpha: 0.86),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: YotinTheme.cyanSignal),
                            ),
                            child: Image.asset(
                              'assets/wellfi-internal-ghost.webp',
                              height: 36,
                              fit: BoxFit.contain,
                            ),
                          ),
                        ),
                        Positioned(
                          top: 14,
                          right: 14,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: YotinTheme.voidBg.withValues(alpha: 0.8),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'FIELD REVIEW VISUAL',
                              style: YotinTheme.fontMono.copyWith(
                                fontSize: 10,
                                color: YotinTheme.cyanSignal,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );

              if (isDesktop) {
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(flex: 6, child: leftCard),
                    const SizedBox(width: 24),
                    Expanded(flex: 6, child: rightCard),
                  ],
                );
              } else {
                return Column(
                  children: [leftCard, const SizedBox(height: 16), rightCard],
                );
              }
            },
          ),
        ],
      ),
    );
  }
}
