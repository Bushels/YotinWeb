import 'package:web/web.dart' as web;

/// Tells the HTML shell that Flutter completed its first real frame.
/// The shell remains visible if bootstrap fails or the app never renders.
void markFlutterPublicShellReady() {
  web.window.dispatchEvent(web.Event('yotin:flutter-ready'));
}
