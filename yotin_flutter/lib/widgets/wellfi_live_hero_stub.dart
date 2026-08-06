import 'package:flutter/material.dart';

/// Non-web targets keep the verified poster. The native app can adopt a
/// platform-specific renderer later without changing the hero's public API.
class WellFiLiveHero extends StatelessWidget {
  const WellFiLiveHero({super.key, required this.heroVisible});

  final bool heroVisible;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/wellfi-island-r3f-poster.webp',
      fit: BoxFit.cover,
      filterQuality: FilterQuality.high,
      errorBuilder: (context, error, stackTrace) => const ColoredBox(
        color: Color(0xFF06111A),
        child: Center(
          child: Text('WellFi telemetry visualization unavailable.'),
        ),
      ),
    );
  }
}
