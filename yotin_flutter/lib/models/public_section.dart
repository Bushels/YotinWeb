/// The stable, public fragment contract for the one-page Yotin site.
///
/// These identifiers mirror the static site's public anchors. They are not
/// Flutter routes: each one resolves to a section inside the same document.
const Set<String> publicSectionIds = <String>{
  'hero',
  'wellfi',
  'benefits',
  'insight',
  'company',
  'contact',
  'qualifier',
};

/// Returns the app section owned by a browser fragment or navigation request.
/// Unknown and malformed values deliberately do nothing rather than moving a
/// public visitor to an unintended position.
String? normalizePublicSectionId(String? value) {
  if (value == null) return null;

  final fragment = value.trim().toLowerCase();
  final withoutHash = fragment.startsWith('#')
      ? fragment.substring(1)
      : fragment;

  return switch (withoutHash) {
    '' || 'top' || 'hero' => 'hero',
    'wellfi' || 'benefits' || 'insight' || 'company' || 'contact' ||
    'qualifier' => withoutHash,
    _ => null,
  };
}

/// Keeps the public root's historic `#top` home anchor while using `hero`
/// internally in Flutter.
String? publicFragmentForSection(String section) {
  final normalized = normalizePublicSectionId(section);
  if (normalized == null) return null;
  return normalized == 'hero' ? 'top' : normalized;
}
