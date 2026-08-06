import 'package:flutter/material.dart';
import '../theme/yotin_theme.dart';

class YotinNavigationBar extends StatelessWidget {
  static const _desktopNavigationMinWidth = 1120.0;

  final ValueChanged<String> onNavigate;
  final VoidCallback onOpenChatFi;

  const YotinNavigationBar({
    super.key,
    required this.onNavigate,
    required this.onOpenChatFi,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        // Preserve comfortable tap targets around the brand and primary
        // actions on tablet widths; the hero retains the full evaluation CTA.
        final isCompact = width < 860;
        // Match the public site’s four primary destinations. The qualifier is
        // already the hero’s conversion CTA, so it does not need to compete
        // with the desktop navigation. That leaves enough room for an actual
        // desktop header at ordinary 1280 px widths.
        final showFullNavigation = width >= _desktopNavigationMinWidth;
        const maxContentWidth = 1536.0;

        return Container(
          height: 72,
          padding: EdgeInsets.symmetric(horizontal: isCompact ? 12 : 24),
          decoration: BoxDecoration(
            color: YotinTheme.voidBg.withValues(alpha: 0.92),
            border: Border(bottom: BorderSide(color: YotinTheme.sandLine)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.4),
                blurRadius: 10,
              ),
            ],
          ),
          child: Center(
            child: Container(
              constraints: BoxConstraints(maxWidth: maxContentWidth),
              child: Row(
                key: ValueKey(
                  showFullNavigation
                      ? 'desktop-primary-navigation'
                      : 'compact-primary-navigation',
                ),
                children: [
                  // Yotin Brand Logo & Icon
                  Semantics(
                    button: true,
                    label: 'Yotin Energy home',
                    child: InkWell(
                      onTap: () => onNavigate('hero'),
                      child: Row(
                        children: [
                          Image.asset(
                            'assets/yotin-icon.png',
                            height: 36,
                            errorBuilder: (context, error, stack) {
                              return Container(
                                width: 36,
                                height: 36,
                                decoration: const BoxDecoration(
                                  color: YotinTheme.ember,
                                  shape: BoxShape.circle,
                                ),
                                child: const Center(
                                  child: Text(
                                    'Y',
                                    style: TextStyle(
                                      color: YotinTheme.voidBg,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                          const SizedBox(width: 12),
                          Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                isCompact ? 'YOTIN' : 'YOTIN ENERGY',
                                style: YotinTheme.fontHero.copyWith(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.2,
                                ),
                              ),
                              if (!isCompact)
                                Text(
                                  'AN INDIGENOUS ENERGY COMPANY',
                                  style: YotinTheme.fontMono.copyWith(
                                    fontSize: 9,
                                    color: YotinTheme.ember,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  const Spacer(),

                  // The public-story links are directly available at normal
                  // desktop widths; the popup remains the compact fallback.
                  if (showFullNavigation) ...[
                    _navLink('WellFi', () => onNavigate('wellfi')),
                    _navLink('Benefits', () => onNavigate('benefits')),
                    _navLink('Our Company', () => onNavigate('company')),
                    _navLink('Contact', () => onNavigate('contact')),
                    const SizedBox(width: 12),
                  ],

                  if (isCompact) ...[
                    IconButton(
                      tooltip: 'Open ChatFi AI',
                      icon: const Icon(Icons.bolt, color: YotinTheme.emberLit),
                      onPressed: onOpenChatFi,
                    ),
                    _sectionMenu(),
                  ] else ...[
                    OutlinedButton.icon(
                      icon: const Icon(
                        Icons.bolt,
                        color: YotinTheme.emberLit,
                        size: 18,
                      ),
                      label: Text(
                        'CHATFI AI',
                        style: YotinTheme.fontMono.copyWith(
                          color: YotinTheme.sand,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(
                          color: YotinTheme.ember.withValues(alpha: 0.6),
                        ),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 12,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      onPressed: onOpenChatFi,
                    ),
                    if (!showFullNavigation) ...[
                      const SizedBox(width: 12),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: YotinTheme.ember,
                          foregroundColor: YotinTheme.voidBg,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        onPressed: () => onNavigate('contact'),
                        child: Text(
                          'EVALUATE WELL',
                          style: YotinTheme.fontMono.copyWith(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      _sectionMenu(),
                    ],
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _navLink(String label, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: TextButton(
        onPressed: onTap,
        child: Text(
          label,
          style: YotinTheme.fontBody.copyWith(
            fontSize: 14,
            color: YotinTheme.textWhite,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _sectionMenu() {
    return PopupMenuButton<String>(
      tooltip: 'Open site navigation',
      icon: const Icon(Icons.menu, color: YotinTheme.sand),
      color: YotinTheme.deepBg,
      onSelected: onNavigate,
      itemBuilder: (context) => [
        _popupItem('wellfi', 'WellFi'),
        _popupItem('benefits', 'Benefits'),
        _popupItem('insight', 'How WellFi works'),
        _popupItem('company', 'Our Company'),
        _popupItem('contact', 'Contact and qualifier'),
      ],
    );
  }

  PopupMenuItem<String> _popupItem(String value, String text) {
    return PopupMenuItem<String>(
      value: value,
      child: Text(
        text,
        style: YotinTheme.fontBody.copyWith(color: YotinTheme.textWhite),
      ),
    );
  }
}
