// Keep the engine beside the field-review artifact. The default loader points
// at GStatic when `canvasKitBaseUrl` is absent, which makes an otherwise
// self-contained field tool depend on a third-party renderer CDN.
//
// The rendering engine separately falls back to a Roboto URL when it needs a
// known-good baseline face. `FontManifest.json` covers normal asset loading,
// but the fallback URL is deliberately configurable too. Resolve it against
// this app's base tag so local review and a Vercel preview both stay within
// the field-review artifact instead of requesting fonts.gstatic.com.
//
// This initial release deliberately runs Skwasm single-threaded. Enabling
// multi-threading requires COOP/COEP response headers; those headers must be
// proved against the cross-origin R3F iframe before they are introduced.
{{flutter_js}}
{{flutter_build_config}}

const yotinFontFallbackBaseUrl = new URL(
  'assets/assets/fonts/',
  document.baseURI,
).href;

_flutter.loader.load({
  config: {
    canvasKitBaseUrl: 'canvaskit/',
    fontFallbackBaseUrl: yotinFontFallbackBaseUrl,
    forceSingleThreadedSkwasm: true,
  },
});
