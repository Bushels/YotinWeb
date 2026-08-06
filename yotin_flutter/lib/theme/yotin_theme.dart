import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class YotinTheme {
  // Brand Colors
  static const Color voidBg = Color(0xFF03070B);
  static const Color deepBg = Color(0xFF06111A);
  static const Color deep2 = Color(0xFF0A1A25);
  static const Color deep3 = Color(0xFF102530);

  static const Color ember = Color(0xFFF27622);
  static const Color emberLit = Color(0xFFFF9147);
  static const Color emberDeep = Color(0xFFD85A10);
  static const Color emberInk = Color(0xFF9F470D);

  static const Color sand = Color(0xFFE8DCC8);
  static const Color sandMute = Color(0xFFB3AA9A);

  static const Color cyanSignal = Color(0xFF00E5FF);

  static const Color paper = Color(0xFFF1EEE7);
  static const Color paper2 = Color(0xFFE6E0D6);
  static const Color inkText = Color(0xFF17222C);
  static const Color textWhite = Color(0xFFF8F7F3);
  static const Color textMuted = Color(0xFF97A3AA);

  // Hairlines & Borders
  static Color sandLine = const Color(0xFFE8DCC8).withValues(alpha: 0.13);
  static Color sandLineStrong = const Color(0xFFE8DCC8).withValues(alpha: 0.28);
  static Color emberGlow = const Color(0xFFF27622).withValues(alpha: 0.35);

  // Fonts
  static TextStyle get fontDisplay =>
      GoogleFonts.archivo(color: textWhite, fontWeight: FontWeight.w700);

  static TextStyle get fontHero =>
      GoogleFonts.spaceGrotesk(color: textWhite, fontWeight: FontWeight.w700);

  static TextStyle get fontBody =>
      GoogleFonts.ibmPlexSans(color: textWhite, fontWeight: FontWeight.w400);

  static TextStyle get fontMono =>
      GoogleFonts.ibmPlexMono(color: sand, fontWeight: FontWeight.w500);

  // Card & Container Glassmorphic Decoration
  static BoxDecoration cardDecoration({
    Color? bg,
    Color? borderColor,
    double borderRadius = 12,
    bool glow = false,
  }) {
    return BoxDecoration(
      color: bg ?? deepBg,
      borderRadius: BorderRadius.circular(borderRadius),
      border: Border.all(color: borderColor ?? sandLine, width: 1),
      boxShadow: glow
          ? [
              BoxShadow(
                color: ember.withValues(alpha: 0.15),
                blurRadius: 24,
                spreadRadius: 2,
              ),
            ]
          : null,
    );
  }

  static ThemeData get darkTheme {
    return ThemeData.dark().copyWith(
      scaffoldBackgroundColor: voidBg,
      colorScheme: const ColorScheme.dark(
        primary: ember,
        secondary: sand,
        surface: deepBg,
        onSurface: textWhite,
      ),
      textTheme: TextTheme(
        displayLarge: fontHero.copyWith(fontSize: 48, height: 1.1),
        displayMedium: fontDisplay.copyWith(fontSize: 36, height: 1.2),
        titleLarge: fontDisplay.copyWith(
          fontSize: 24,
          fontWeight: FontWeight.w600,
        ),
        titleMedium: fontBody.copyWith(
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
        bodyLarge: fontBody.copyWith(fontSize: 16, height: 1.6),
        bodyMedium: fontBody.copyWith(
          fontSize: 14,
          height: 1.5,
          color: textMuted,
        ),
        labelLarge: fontMono.copyWith(fontSize: 14, letterSpacing: 1.0),
      ),
    );
  }
}
