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
    assert.match(html, /<h1 id="hero-title"[^>]*>Know the<br>Unknown/i);
    assert.match(html, /160 Installed/i); // metric
    assert.match(html, /assets\/wellfi-island-r3f-poster\.webp/);
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
    const assetMatches = [...html.matchAll(/src="(assets\/[^"]+)"/g)];
    assert.ok(assetMatches.length > 0, 'no assets found in index.html');
    for (const [, fullAssetPath] of assetMatches) {
      const cleanPath = fullAssetPath.split('?')[0];
      assert.ok(
        fs.existsSync(path.join(root, cleanPath)),
        `missing asset file: ${cleanPath}`
      );
    }
  });
});
