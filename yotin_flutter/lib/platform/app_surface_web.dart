import 'package:web/web.dart' as web;

enum YotinAppSurface { fieldReview, publicHome }

/// The root public-home artifact adds this marker during its isolated build.
/// The source `web/index.html` stays Field Review and remains noindex.
YotinAppSurface get yotinAppSurface =>
    web.document.documentElement?.getAttribute('data-yotin-surface') ==
            'public-home'
        ? YotinAppSurface.publicHome
        : YotinAppSurface.fieldReview;
