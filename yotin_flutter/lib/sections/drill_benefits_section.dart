import 'package:flutter/material.dart';
import '../theme/yotin_theme.dart';
import '../widgets/benefit_drill_explorer.dart';

class DrillBenefitsSection extends StatelessWidget {
  final double scrollProgress;

  const DrillBenefitsSection({super.key, this.scrollProgress = 0.0});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: YotinTheme.voidBg,
      padding: const EdgeInsets.symmetric(vertical: 64, horizontal: 24),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 1400),
          child: BenefitDrillExplorerWidget(scrollProgress: scrollProgress),
        ),
      ),
    );
  }
}
