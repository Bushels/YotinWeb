import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:yotin_flutter/theme/yotin_theme.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  GoogleFonts.config.allowRuntimeFetching = false;

  test('semibold theme roles retain their bundled base font variant', () {
    final display = YotinTheme.fontDisplay;
    final body = YotinTheme.fontBody;
    final theme = YotinTheme.darkTheme;

    // These roles use copyWith for visual weight. They must retain the
    // original w700/w400 Google Fonts family names so the four locally
    // bundled assets remain the complete runtime contract.
    expect(theme.textTheme.titleLarge!.fontWeight, FontWeight.w600);
    expect(theme.textTheme.titleLarge!.fontFamily, display.fontFamily);
    expect(theme.textTheme.titleMedium!.fontWeight, FontWeight.w600);
    expect(theme.textTheme.titleMedium!.fontFamily, body.fontFamily);
  });
}
