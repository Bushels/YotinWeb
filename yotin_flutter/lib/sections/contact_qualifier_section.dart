import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../theme/yotin_theme.dart';
import '../widgets/candidate_well_qualifier.dart';

class ContactQualifierSection extends StatelessWidget {
  const ContactQualifierSection({
    super.key,
    required this.onOpenChatFi,
    required this.qualifierQuestionKey,
  });

  final VoidCallback onOpenChatFi;
  final GlobalKey qualifierQuestionKey;

  Future<void> _emailYotin() async {
    await launchUrl(
      Uri.parse(
        'mailto:info@yotinenergy.com?subject=WellFi%20candidate%20well%20review',
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: YotinTheme.voidBg,
      padding: const EdgeInsets.symmetric(vertical: 76, horizontal: 24),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1400),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              LayoutBuilder(
                builder: (context, constraints) {
                  final stacked = constraints.maxWidth < 820;
                  final heading = Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'CANDIDATE WELL REVIEW',
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
                          'Know the Unknown.\nOne Changeout Away.',
                          style: YotinTheme.fontHero.copyWith(
                            fontSize: 38,
                            height: 1.04,
                          ),
                        ),
                      ),
                    ],
                  );
                  final actions = Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Well type, changeout timing, and required data establish deployment fit. '
                        'Check yours in about a minute.',
                        style: YotinTheme.fontBody.copyWith(
                          color: YotinTheme.textMuted,
                          fontSize: 16,
                          height: 1.6,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 6,
                        children: [
                          Text(
                            'Or reach Yotin directly at',
                            style: YotinTheme.fontBody.copyWith(
                              fontSize: 14,
                              color: YotinTheme.sandMute,
                            ),
                          ),
                          TextButton(
                            onPressed: _emailYotin,
                            child: Text(
                              'info@yotinenergy.com',
                              style: YotinTheme.fontMono.copyWith(
                                fontSize: 14,
                                color: YotinTheme.emberLit,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      TextButton.icon(
                        onPressed: onOpenChatFi,
                        icon: const Icon(
                          Icons.bolt,
                          size: 16,
                          color: YotinTheme.emberLit,
                        ),
                        label: Text(
                          'ASK CHATFI ABOUT WELLFI',
                          style: YotinTheme.fontMono.copyWith(
                            fontSize: 12,
                            color: YotinTheme.emberLit,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  );
                  if (stacked) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [heading, const SizedBox(height: 28), actions],
                    );
                  }
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(flex: 6, child: heading),
                      const SizedBox(width: 44),
                      Expanded(flex: 5, child: actions),
                    ],
                  );
                },
              ),
              const SizedBox(height: 42),
              CandidateWellQualifierWidget(
                firstDecisionKey: qualifierQuestionKey,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
