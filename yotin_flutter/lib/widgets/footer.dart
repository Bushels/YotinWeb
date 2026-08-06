import 'package:flutter/material.dart';

import '../theme/yotin_theme.dart';

class YotinFooterWidget extends StatelessWidget {
  const YotinFooterWidget({super.key, required this.onNavigate});

  final ValueChanged<String> onNavigate;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: YotinTheme.voidBg,
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1400),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final compact = constraints.maxWidth < 980;
              final brand = Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Image.asset('assets/yotin-icon.png', height: 32),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'YOTIN ENERGY',
                          style: YotinTheme.fontDisplay.copyWith(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 5),
                        Text(
                          'An Indigenous Energy Services Company based in Pierceland, Saskatchewan.',
                          style: YotinTheme.fontBody.copyWith(
                            color: YotinTheme.textMuted,
                            fontSize: 13,
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              );
              final contact = Column(
                crossAxisAlignment: compact
                    ? CrossAxisAlignment.start
                    : CrossAxisAlignment.end,
                children: [
                  Text(
                    'CONTACT',
                    style: YotinTheme.fontMono.copyWith(
                      fontSize: 12,
                      color: YotinTheme.emberLit,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  SelectableText(
                    'info@yotinenergy.com',
                    style: YotinTheme.fontMono.copyWith(
                      fontSize: 14,
                      color: YotinTheme.sand,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Pierceland, Saskatchewan, Canada',
                    style: YotinTheme.fontBody.copyWith(
                      fontSize: 13,
                      color: YotinTheme.textMuted,
                    ),
                  ),
                ],
              );
              final navigation = Wrap(
                spacing: 2,
                runSpacing: 2,
                children: [
                  _FooterNavigationLink(
                    label: 'WellFi',
                    onPressed: () => onNavigate('wellfi'),
                  ),
                  _FooterNavigationLink(
                    label: 'Benefits',
                    onPressed: () => onNavigate('benefits'),
                  ),
                  _FooterNavigationLink(
                    label: 'Our Company',
                    onPressed: () => onNavigate('company'),
                  ),
                  _FooterNavigationLink(
                    label: 'Contact',
                    onPressed: () => onNavigate('contact'),
                  ),
                ],
              );
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (compact)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        brand,
                        const SizedBox(height: 24),
                        navigation,
                        const SizedBox(height: 28),
                        contact,
                      ],
                    )
                  else
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(flex: 5, child: brand),
                        const SizedBox(width: 32),
                        Expanded(flex: 3, child: navigation),
                        const SizedBox(width: 32),
                        contact,
                      ],
                    ),
                  const SizedBox(height: 36),
                  Divider(color: YotinTheme.sandLine),
                  const SizedBox(height: 20),
                  Text(
                    '© ${DateTime.now().year} Yotin Energy. All rights reserved.',
                    style: YotinTheme.fontMono.copyWith(
                      fontSize: 12,
                      color: YotinTheme.textMuted,
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _FooterNavigationLink extends StatelessWidget {
  const _FooterNavigationLink({required this.label, required this.onPressed});

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: onPressed,
      style: TextButton.styleFrom(
        foregroundColor: YotinTheme.sand,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
        minimumSize: const Size(0, 40),
      ),
      child: Text(
        label.toUpperCase(),
        style: YotinTheme.fontMono.copyWith(
          color: YotinTheme.sand,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
