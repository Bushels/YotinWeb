import 'package:flutter/material.dart';
import '../theme/yotin_theme.dart';

class YotinNavigationBar extends StatelessWidget {
  // The static site switches between the four-link desktop nav and the
  // hamburger at a single breakpoint — `max-width: 820px` (styles.css:1559).
  // Matching it with one threshold removes the previous 860–1119 px band,
  // where this header uniquely showed a hamburger *and* an EVALUATE WELL
  // button that exists at no other width — a state the audited widths
  // (390 / 820 / 1280 / 1600) stepped straight over.
  static const _desktopNavigationMinWidth = 860.0;

  final Function(String section) onNavigate;
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
        final isCompact = width < _desktopNavigationMinWidth;
        // Match the public site’s four primary destinations. The qualifier is
        // already the hero’s conversion CTA, so it does not need to compete
        // with the desktop navigation.
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
                                style: YotinTheme.fontDisplay.copyWith(
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
                        // Static header CTA is `Ask ChatFi` (index.html:218),
                        // uppercased by `.nav-cta { text-transform: uppercase }`.
                        'ASK CHATFI',
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
                    // No EVALUATE WELL button here. The static header carries
                    // only `Ask ChatFi`; the well-fit CTA lives in the hero.
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  /// Matches `.desktop-nav a` (styles.css:175): IBM Plex Mono, 12 px, w500,
  /// 0.08em tracking, uppercase, #c1c9cd — spaced by a gap rather than by
  /// per-link padding.
  ///
  /// The previous 14 px body-font link with 24 px of horizontal padding each
  /// was both a token mismatch and the reason four links could not fit beside
  /// the brand until 1120 px. Costing them correctly is what lets the header
  /// switch at the static site's single breakpoint.
  Widget _navLink(String label, VoidCallback onTap) {
    return TextButton(
      onPressed: onTap,
      style: TextButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      child: Text(
        label.toUpperCase(),
        style: YotinTheme.fontMono.copyWith(
          fontSize: 12,
          color: const Color(0xFFC1C9CD),
          fontWeight: FontWeight.w500,
          letterSpacing: 0.08 * 12,
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
