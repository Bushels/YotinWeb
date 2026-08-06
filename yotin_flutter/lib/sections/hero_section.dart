import 'package:flutter/material.dart';

import '../theme/yotin_theme.dart';
import '../widgets/wellfi_live_hero.dart';

class HeroSection extends StatelessWidget {
  const HeroSection({
    super.key,
    required this.onEvaluate,
    required this.onExplore,
    required this.heroVisible,
  });

  final VoidCallback onEvaluate;
  final VoidCallback onExplore;
  final bool heroVisible;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, pageConstraints) {
        final isDesktop = pageConstraints.maxWidth >= 1120;
        final contentWidth = pageConstraints.maxWidth
            .clamp(0.0, 1536.0)
            .toDouble();
        final viewportHeight = MediaQuery.sizeOf(context).height;
        final desktopHeroMinHeight = (viewportHeight - 72)
            .clamp(648.0, 800.0)
            .toDouble();
        final desktopSceneWidth = (contentWidth * 1.14)
            .clamp(0.0, 1800.0)
            .toDouble();
        final desktopCopyWidth = (contentWidth * 0.52)
            .clamp(0.0, 620.0)
            .toDouble();
        final desktopHorizontalPadding = (contentWidth * 0.04)
            .clamp(22.0, 60.0)
            .toDouble();
        final desktopTopPadding = (viewportHeight * 0.061)
            .clamp(44.0, 64.0)
            .toDouble();
        final leftContent = _HeroCopy(
          isDesktop: isDesktop,
          onEvaluate: onEvaluate,
          onExplore: onExplore,
        );
        final visual = Semantics(
          image: true,
          label:
              'Live WellFi wireless telemetry cutaway in a multilateral wellbore.',
          child: ClipRect(child: WellFiLiveHero(heroVisible: heroVisible)),
        );

        return Container(
          width: double.infinity,
          color: YotinTheme.voidBg,
          child: Center(
            child: SizedBox(
              width: contentWidth,
              child: isDesktop
                  ? ConstrainedBox(
                      constraints: BoxConstraints(
                        minHeight: desktopHeroMinHeight,
                      ),
                      child: Stack(
                        clipBehavior: Clip.hardEdge,
                        children: [
                          Positioned(
                            top: -20,
                            right: -190,
                            width: desktopSceneWidth,
                            height: desktopSceneWidth * 9 / 16,
                            child: DecoratedBox(
                              decoration: const BoxDecoration(
                                color: YotinTheme.deepBg,
                              ),
                              child: visual,
                            ),
                          ),
                          const Positioned.fill(
                            child: IgnorePointer(child: _DesktopHeroScrim()),
                          ),
                          Padding(
                            padding: EdgeInsets.fromLTRB(
                              desktopHorizontalPadding,
                              desktopTopPadding,
                              desktopHorizontalPadding,
                              36,
                            ),
                            child: SizedBox(
                              width: desktopCopyWidth,
                              child: leftContent,
                            ),
                          ),
                        ],
                      ),
                    )
                  : Padding(
                      padding: const EdgeInsets.fromLTRB(24, 36, 24, 44),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          leftContent,
                          const SizedBox(height: 32),
                          AspectRatio(aspectRatio: 4 / 3, child: visual),
                        ],
                      ),
                    ),
            ),
          ),
        );
      },
    );
  }
}

class _DesktopHeroScrim extends StatelessWidget {
  const _DesktopHeroScrim();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment(-1, -0.1),
          end: Alignment(1, 0.1),
          stops: [0, 0.26, 0.54, 0.72],
          colors: [
            Color(0xF203070B),
            Color(0xD103070B),
            Color(0x2E03070B),
            Color(0x0003070B),
          ],
        ),
      ),
      child: const DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.bottomCenter,
            end: Alignment.topCenter,
            stops: [0, 0.34],
            colors: [Color(0xE003070B), Color(0x0003070B)],
          ),
        ),
      ),
    );
  }
}

class _HeroCopy extends StatelessWidget {
  const _HeroCopy({
    required this.isDesktop,
    required this.onEvaluate,
    required this.onExplore,
  });

  final bool isDesktop;
  final VoidCallback onEvaluate;
  final VoidCallback onExplore;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Image.asset(
          'assets/wellfi-logo.webp',
          width: isDesktop ? 220 : 190,
          fit: BoxFit.contain,
          semanticLabel: 'WellFi',
        ),
        SizedBox(height: isDesktop ? 30 : 24),
        Semantics(
          header: true,
          headingLevel: 1,
          child: Text(
            'Know the\nUnknown.',
            style: YotinTheme.fontHero.copyWith(
              fontSize: isDesktop ? 66 : 42,
              height: 0.98,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        SizedBox(height: isDesktop ? 24 : 16),
        SizedBox(
          width: isDesktop ? 470 : null,
          child: Text(
            'Every well is already telling you what is happening downhole. '
            'WellFi is how you hear it — wireless, no cable, no dedicated trip. '
            'Run it on a new completion, a planned changeout, or any producer '
            'worth watching.',
            style: YotinTheme.fontBody.copyWith(
              fontSize: isDesktop ? 17 : 16,
              height: 1.6,
              color: YotinTheme.textWhite,
            ),
          ),
        ),
        const SizedBox(height: 22),
        SizedBox(
          width: isDesktop ? 560 : null,
          child: const Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _ProofChip(label: 'Wireless', icon: Icons.wifi),
              _ProofChip(
                label: '160 installed internationally',
                icon: Icons.public,
              ),
              _ProofChip(
                label: 'MODBUS ready',
                icon: Icons.settings_input_component,
              ),
              _ProofChip(label: 'Rapid deployment', icon: Icons.bolt),
            ],
          ),
        ),
        const SizedBox(height: 28),
        Wrap(
          spacing: 16,
          runSpacing: 12,
          children: [
            ElevatedButton.icon(
              icon: const Icon(Icons.calculate, size: 18),
              label: Text(
                'CHECK YOUR WELL FIT',
                style: YotinTheme.fontMono.copyWith(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: YotinTheme.ember,
                foregroundColor: YotinTheme.voidBg,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 16,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              onPressed: onEvaluate,
            ),
            OutlinedButton.icon(
              icon: const Icon(
                Icons.arrow_downward,
                color: YotinTheme.emberLit,
                size: 18,
              ),
              label: Text(
                'EXPLORE WELLFI',
                style: YotinTheme.fontMono.copyWith(
                  color: YotinTheme.sand,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: YotinTheme.sandLineStrong),
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 16,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              onPressed: onExplore,
            ),
          ],
        ),
      ],
    );
  }
}

class _ProofChip extends StatelessWidget {
  const _ProofChip({required this.label, required this.icon});

  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: YotinTheme.deep2.withValues(alpha: 0.8),
        border: Border.all(color: YotinTheme.sandLineStrong),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: YotinTheme.emberLit),
          const SizedBox(width: 6),
          Text(
            label.toUpperCase(),
            style: YotinTheme.fontMono.copyWith(
              color: YotinTheme.sand,
              fontSize: 10,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
