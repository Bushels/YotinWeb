import 'package:flutter/material.dart';

import '../theme/yotin_theme.dart';

class SignalStripWidget extends StatelessWidget {
  const SignalStripWidget({super.key});

  @override
  Widget build(BuildContext context) {
    const steps = [
      _SignalStep(
        number: '01',
        title: 'Signal',
        description:
            'WellFi sends a low-power wireless pulse from deep inside the well.',
        icon: Icons.wifi_tethering,
      ),
      _SignalStep(
        number: '02',
        title: 'Measure',
        description:
            'Pressure, temperature, vibration, and fluid-condition data are captured.',
        icon: Icons.multiline_chart,
      ),
      _SignalStep(
        number: '03',
        title: 'Insight',
        description:
            'Live telemetry lands in the control system operators already use.',
        icon: Icons.monitor_heart_outlined,
      ),
    ];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 24),
      decoration: BoxDecoration(
        color: YotinTheme.deep2,
        border: Border.symmetric(
          horizontal: BorderSide(color: YotinTheme.sandLine),
        ),
      ),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1400),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final compact = constraints.maxWidth < 760;
              if (compact) {
                return Column(
                  children: [
                    for (var index = 0; index < steps.length; index++) ...[
                      steps[index],
                      if (index != steps.length - 1)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          child: Divider(color: YotinTheme.sandLine),
                        ),
                    ],
                  ],
                );
              }
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  for (var index = 0; index < steps.length; index++) ...[
                    Expanded(child: steps[index]),
                    if (index != steps.length - 1)
                      Container(
                        width: 1,
                        height: 86,
                        margin: const EdgeInsets.symmetric(horizontal: 28),
                        color: YotinTheme.sandLine,
                      ),
                  ],
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _SignalStep extends StatelessWidget {
  const _SignalStep({
    required this.number,
    required this.title,
    required this.description,
    required this.icon,
  });

  final String number;
  final String title;
  final String description;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      container: true,
      label: '$number. $title. $description',
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: YotinTheme.ember.withValues(alpha: 0.14),
                  border: Border.all(
                    color: YotinTheme.ember.withValues(alpha: 0.55),
                  ),
                  borderRadius: BorderRadius.circular(5),
                ),
                child: Icon(icon, color: YotinTheme.emberLit, size: 22),
              ),
              Positioned(
                right: -8,
                bottom: -8,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 4,
                    vertical: 2,
                  ),
                  color: YotinTheme.ember,
                  child: Text(
                    number,
                    style: YotinTheme.fontMono.copyWith(
                      color: YotinTheme.voidBg,
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: YotinTheme.fontHero.copyWith(fontSize: 20)),
                const SizedBox(height: 6),
                Text(
                  description,
                  style: YotinTheme.fontBody.copyWith(
                    fontSize: 13,
                    color: YotinTheme.textMuted,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
