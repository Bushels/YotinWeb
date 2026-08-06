import 'package:flutter/material.dart';

import '../theme/yotin_theme.dart';

class InsightSection extends StatelessWidget {
  const InsightSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: YotinTheme.deep2,
      padding: const EdgeInsets.symmetric(vertical: 76, horizontal: 24),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1400),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'THE TOOL',
                style: YotinTheme.fontMono.copyWith(
                  color: YotinTheme.ember,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.1,
                ),
              ),
              const SizedBox(height: 18),
              Semantics(
                header: true,
                child: Text(
                  'Inside the string.\nOut of the way.',
                  style: YotinTheme.fontHero.copyWith(
                    fontSize: 42,
                    height: 1.02,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 760),
                child: Text(
                  'WellFi attaches to the interior or exterior of the tubing, on new installs '
                  'or pump changes. It reports over wireless electromagnetic telemetry, which '
                  'removes the risk that comes with running a cable.',
                  style: YotinTheme.fontBody.copyWith(
                    color: YotinTheme.textMuted,
                    fontSize: 16,
                    height: 1.6,
                  ),
                ),
              ),
              const SizedBox(height: 22),
              const Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  _ApplicationChip(
                    label: 'Light oil',
                    icon: Icons.water_drop_outlined,
                  ),
                  _ApplicationChip(label: 'Heavy oil', icon: Icons.opacity),
                  _ApplicationChip(label: 'Gas', icon: Icons.air),
                  _ApplicationChip(
                    label: 'Thermal',
                    icon: Icons.local_fire_department_outlined,
                  ),
                ],
              ),
              const SizedBox(height: 44),
              Semantics(
                image: true,
                label:
                    'The WellFi tool deployed inside production tubing, showing the electromagnetic isolator collar and internal sensor package.',
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: YotinTheme.voidBg,
                    border: Border.all(color: YotinTheme.sandLineStrong),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Column(
                    children: [
                      Image.asset(
                        'assets/wellfi-internal-ghost.webp',
                        width: double.infinity,
                        height: 220,
                        fit: BoxFit.contain,
                        filterQuality: FilterQuality.high,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'WELLFI IN THE TUBING — EM ISOLATOR COLLAR AND SENSOR PACKAGE',
                        style: YotinTheme.fontMono.copyWith(
                          color: YotinTheme.sandMute,
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: YotinTheme.deepBg,
                  border: Border.all(color: YotinTheme.sandLine),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: YotinTheme.ember.withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Icon(
                        Icons.insights,
                        color: YotinTheme.emberLit,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'WellFi Access Portal',
                            style: YotinTheme.fontHero.copyWith(fontSize: 22),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'The readings do not stop at raw numbers. The Access Portal analyzes the '
                            'data coming off each well and turns it into recommendations — surfacing '
                            'drawdown drift, vibration changes, and produced-fluid shifts while there '
                            'is still time to act on them.',
                            style: YotinTheme.fontBody.copyWith(
                              fontSize: 14,
                              color: YotinTheme.textMuted,
                              height: 1.55,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ApplicationChip extends StatelessWidget {
  const _ApplicationChip({required this.label, required this.icon});

  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        border: Border.all(color: YotinTheme.sandLineStrong),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: YotinTheme.emberLit, size: 16),
          const SizedBox(width: 7),
          Text(
            label.toUpperCase(),
            style: YotinTheme.fontMono.copyWith(
              fontSize: 10,
              color: YotinTheme.sand,
            ),
          ),
        ],
      ),
    );
  }
}
