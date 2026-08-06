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

  /// Muted instrumentation tint for *propagating signal* only.
  ///
  /// The static site has no cyan at all: it was deliberately removed from this
  /// palette because an electric cyan reads as generic-AI rather than field
  /// equipment, and the accent moved to ember with sand hairlines. This app had
  /// reintroduced `#00E5FF` across 17 sites — badges, labels, borders and
  /// status text — which is exactly the look that was rejected.
  ///
  /// Chrome must use ember/sand. This tint is reserved for the EM wave
  /// particles in the well canvas, where a cool accent is the only thing
  /// distinguishing the travelling signal from the ember tool body, and it is
  /// applied under an animated opacity so it never reads as a flat cyan
  /// surface. Deleting it and using [emberLit] is a safe one-line change.
  static const Color signalTint = Color(0xFF4E8E99);

  static const Color paper = Color(0xFFF1EEE7);
  static const Color paper2 = Color(0xFFE6E0D6);
  static const Color inkText = Color(0xFF17222C);
  static const Color textWhite = Color(0xFFF8F7F3);
  static const Color textMuted = Color(0xFF97A3AA);

  // Hairlines & Borders
  static Color sandLine = const Color(0xFFE8DCC8).withValues(alpha: 0.13);
  static Color sandLineStrong = const Color(0xFFE8DCC8).withValues(alpha: 0.28);
  static Color emberGlow = const Color(0xFFF27622).withValues(alpha: 0.35);

  // Fonts.
  //
  // These map one-to-one onto the static site's CSS custom properties, and the
  // static rule set is the reference. Counted across styles.css: 23 rules use
  // `--font-display` (Archivo) and exactly one uses `--font-hero`
  // (Space Grotesk) — `.hero-message h1` at styles.css:264, weight 500.
  //
  // So Space Grotesk is the single page H1 and nothing else. Every other
  // heading, card title and section H2 is Archivo. The name `fontHeroTitle`
  // keeps that scope explicit: a bare `fontHero` reads like "the big heading
  // font" and is how the two faces got swapped across 25 call sites.
  static TextStyle get fontDisplay =>
      GoogleFonts.archivo(color: textWhite, fontWeight: FontWeight.w700);

  // Weight is w700, not the static site's 500: `SpaceGrotesk-Bold.ttf` is the
  // only variant bundled, and `allowRuntimeFetching = false` (main.dart:22)
  // deliberately refuses a third-party fetch for a missing one. Requesting a
  // weight with no bundled asset risks resolving to a default face instead of
  // Space Grotesk at all. A slightly heavier H1 is the right trade against
  // that; adding SpaceGrotesk-Medium.ttf would let this drop to w500 exactly.
  static TextStyle get fontHeroTitle =>
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
        displayLarge: fontHeroTitle.copyWith(fontSize: 48, height: 1.1),
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
