/* Tests for Yotin Energy website feature presence and structural integrity.
 *
 *   node --test test/site-features.test.js
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const script = fs.readFileSync(path.join(root, 'main.js'), 'utf8');

describe('Yotin website structure & feature presence', () => {
  test('includes canonical head tags, titles, and SEO metadata', () => {
    assert.match(html, /<title>Yotin Energy — Indigenous Energy Services &amp; WellFi Telemetry<\/title>/);
    assert.match(html, /<meta name="description" content="[^"]*WellFi[^"]*"/);
    assert.match(html, /<link rel="canonical" href="https:\/\/yotinenergy\.com\/">/);
  });

  test('main navigation has core links and ChatFi CTA button', () => {
    assert.match(html, /href="#wellfi"/);
    assert.match(html, /href="#benefits"/);
    assert.match(html, /href="#company"/);
    assert.match(html, /href="#contact"/);
    assert.match(html, /<button class="nav-cta"[^>]*data-chatfi-open/);
  });

  test('hero section contains headline, key metrics, and WellFi poster', () => {
    assert.match(html, /<h1 id="hero-title"[^>]*aria-label="Know the Unknown\."/i); // word-mask markup keeps the accessible name whole
    assert.match(html, /<span>Know<\/span>[\s\S]*<span>the<\/span>[\s\S]*<span>Unknown<span class="dot">\.<\/span><\/span>/);
    assert.match(html, /160\+ Installed/i); // metric (spec §0: "160+")
    assert.match(html, /\/assets\/stills\/ch0\.webp/); // the chapter-0 still is the poster (one URL, spec §6)
  });

  test('hero is poster + world: no cross-origin iframe, no pointer bridge, no legacy parallax', () => {
    // The chapter-0 still is the poster; the world canvas (src/boot.js) renders over it. The legacy
    // mpsgroup.energy iframe, its postMessage pointer bridge and the CSS idle-drift are gone (spec §0/§6).
    assert.match(html, /class="hero-scene"\s+data-hero-poster/);
    assert.doesNotMatch(html, /data-wellfi-live|data-live-src|mpsgroup\.energy/);
    assert.match(css, /touch-action:\s*pan-y pinch-zoom;/); // the hero never traps a phone's vertical swipe
    assert.match(css, /\.hero-scene > \.hero-poster\s*\{[\s\S]*?pointer-events:\s*none;/);
    assert.doesNotMatch(css, /hero-live-frame|has-pointer-bridge|is-pointer-active|hero-legacy|--hero-pointer-x|--hero-pointer-y/);
    assert.doesNotMatch(script, /wellfi:set-pointer|wellfi:set-active|revealSameOriginLiveFrame|sendLivePointer|updateHeroPointer|wellfiLocal|hero-legacy/);
    assert.doesNotMatch(script, /data-wellfi-live/);
  });

  test('wellfi benefits section contains drill cutaway & fallback grid', () => {
    assert.match(html, /id="benefits"/);
    assert.match(html, /data-drill-fallback/);
    assert.match(html, /Extend Pump Life/i);
    assert.match(html, /Hydrostatic/i);
  });

  test('telemetry channels section is present', () => {
    assert.match(html, /id="benefits"/); // section with benefits & channels
    assert.match(html, /Pressure/);
    assert.match(html, /Temperature/);
    assert.match(html, /Vibration/);
  });

  test('specifications section is present with key product ratings', () => {
    assert.match(html, /WellFi/);
    assert.match(html, /150 °C/); // tool rating
  });

  test('surface-output specification scales its long value down to fit', () => {
    assert.match(html, /<dd class="spec-output-value">RS-485 \/ 4-20 mA<\/dd>/);
    assert.match(css, /\.spec-grid dd\.spec-output-value \{ font-size: clamp\(32px, 3\.25vw, 46px\);/);
  });

  test('company story & Indigenous ownership section is present', () => {
    assert.match(html, /id="company"/);
    assert.match(html, /Indigenous/i);
    assert.match(html, /Pierceland/i);
  });

  test('candidate-well qualifier form container is ready', () => {
    assert.match(html, /id="contact"/);
    assert.match(html, /data-qualifier/);
    assert.match(html, /data-qualifier-stage/);
  });

  test('ChatFi launcher and modal panel are present with proper ARIA attributes', () => {
    assert.match(html, /class="chatfi-launcher"/);
    assert.match(html, /data-chatfi-panel/);
    assert.match(html, /role="dialog"/);
    assert.match(html, /aria-modal="true"/);
    assert.match(html, /<deep-chat[^>]*data-chatfi-chat/);
  });

  test('footer links privacy notice and copyright', () => {
    assert.match(html, /href="\/privacy"/);
    assert.match(html, /Yotin Energy/);
  });
});

describe('asset & dependency paths', () => {
  test('local script and stylesheet tags exist on disk', () => {
    assert.ok(fs.existsSync(path.join(root, 'qualifier-logic.js')));
    assert.ok(fs.existsSync(path.join(root, 'main.js')));
    assert.ok(fs.existsSync(path.join(root, 'styles.css')));
  });

  test('key images referenced in HTML exist in assets/', () => {
    const assetMatches = [...html.matchAll(/src="\/(assets\/[^"]+)"/g)];
    assert.ok(assetMatches.length > 0, 'no assets found in index.html');
    for (const [, fullAssetPath] of assetMatches) {
      const cleanPath = fullAssetPath.split('?')[0];
      assert.ok(
        fs.existsSync(path.join(root, 'public', cleanPath)),
        `missing asset file: ${cleanPath}`
      );
    }
  });
});
