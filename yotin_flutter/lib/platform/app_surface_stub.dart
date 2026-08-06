enum YotinAppSurface { fieldReview, publicHome }

/// Non-web builds retain the field-review behavior by default. The web build
/// reads the generated HTML artifact's explicit surface marker instead.
YotinAppSurface get yotinAppSurface => YotinAppSurface.fieldReview;
