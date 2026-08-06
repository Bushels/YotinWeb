import 'package:flutter/material.dart';

import '../theme/yotin_theme.dart';

class CompanySection extends StatelessWidget {
  const CompanySection({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: YotinTheme.paper,
      padding: const EdgeInsets.symmetric(vertical: 76, horizontal: 24),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1400),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final stacked = constraints.maxWidth < 860;
              final brand = Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'ABOUT YOTIN',
                    style: YotinTheme.fontMono.copyWith(
                      color: YotinTheme.emberInk,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.1,
                    ),
                  ),
                  const SizedBox(height: 18),
                  Semantics(
                    header: true,
                    child: Text.rich(
                      TextSpan(
                        text: 'The name comes\nfrom ',
                        children: [
                          TextSpan(
                            text: 'yôtin',
                            style: YotinTheme.fontHero.copyWith(
                              color: YotinTheme.emberInk,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                          const TextSpan(text: '.'),
                        ],
                      ),
                      style: YotinTheme.fontHero.copyWith(
                        color: YotinTheme.inkText,
                        fontSize: 42,
                        height: 1.02,
                      ),
                    ),
                  ),
                  const SizedBox(height: 22),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 9,
                    ),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: YotinTheme.emberInk.withValues(alpha: 0.45),
                      ),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.volunteer_activism_outlined,
                          color: YotinTheme.emberInk,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'PROUDLY INDIGENOUS OWNED',
                          style: YotinTheme.fontMono.copyWith(
                            color: YotinTheme.emberInk,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              );

              final copy = Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'The Cree word for wind — a force that crosses the land without being seen. '
                    'WellFi works on the same useful truth: what cannot be seen can still be measured.',
                    style: YotinTheme.fontBody.copyWith(
                      color: YotinTheme.inkText,
                      fontSize: 20,
                      height: 1.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    'Yotin is an Indigenous energy services company based in Pierceland, Saskatchewan, '
                    'serving the heavy-oil and oil sands corridor across Western Canada.',
                    style: YotinTheme.fontBody.copyWith(
                      color: YotinTheme.inkText.withValues(alpha: 0.78),
                      fontSize: 16,
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on_outlined,
                        color: YotinTheme.emberInk,
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'PIERCELAND, SASKATCHEWAN, CANADA',
                          style: YotinTheme.fontMono.copyWith(
                            color: YotinTheme.emberInk,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final columns = constraints.maxWidth >= 660 ? 3 : 1;
                      return GridView.count(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisCount: columns,
                        childAspectRatio: columns == 1 ? 2.25 : 1.1,
                        mainAxisExtent: columns == 1 ? 170 : null,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        children: const [
                          _CompanyMark(
                            title: 'Indigenous-owned',
                            copy: 'Locally rooted, Western Canada focused.',
                            icon: Icons.handshake_outlined,
                          ),
                          _CompanyMark(
                            title: 'Field service',
                            copy: 'Support through install and beyond.',
                            icon: Icons.engineering_outlined,
                          ),
                          _CompanyMark(
                            title: 'Heavy oil & thermal',
                            copy: 'Built for the corridor we work in.',
                            icon: Icons.opacity_outlined,
                          ),
                        ],
                      );
                    },
                  ),
                ],
              );

              if (stacked) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [brand, const SizedBox(height: 44), copy],
                );
              }
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(flex: 5, child: brand),
                  const SizedBox(width: 72),
                  Expanded(flex: 7, child: copy),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _CompanyMark extends StatelessWidget {
  const _CompanyMark({
    required this.title,
    required this.copy,
    required this.icon,
  });

  final String title;
  final String copy;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: YotinTheme.paper2,
        border: Border.all(color: YotinTheme.emberInk.withValues(alpha: 0.2)),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: YotinTheme.emberInk, size: 22),
          const SizedBox(height: 12),
          Text(
            title,
            style: YotinTheme.fontHero.copyWith(
              color: YotinTheme.inkText,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            copy,
            style: YotinTheme.fontBody.copyWith(
              color: YotinTheme.inkText.withValues(alpha: 0.7),
              fontSize: 12,
              height: 1.35,
            ),
          ),
        ],
      ),
    );
  }
}
