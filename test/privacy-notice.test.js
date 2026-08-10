/* The privacy notice is a compliance dependency of the analytics, not a page
 * that happens to exist. If GA4 is enabled, the notice must be reachable and
 * must actually describe what is collected.
 *
 * These assertions are deliberately coupled: the failure mode they guard is
 * someone removing the footer link during a redesign, or adding a new tracked
 * field, while the tag keeps sending. Both are silent.
 *
 *   node --test test/privacy-notice.test.js
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const privacyPath = path.join(root, 'privacy.html');

/** The live Measurement ID, or null when analytics is switched off. */
function measurementId() {
  const m = index.match(/var GA_MEASUREMENT_ID = "([^"]*)"/);
  const id = m ? m[1] : '';
  return /^G-[A-Z0-9]{6,}$/.test(id) ? id : null;
}

describe('privacy notice', () => {
  test('exists as a static page', () => {
    assert.ok(fs.existsSync(privacyPath), 'privacy.html is missing');
  });

  test('is linked from the site footer', () => {
    // cleanUrls is on in vercel.json, so /privacy serves privacy.html.
    assert.match(index, /href="\/privacy"/, 'no link to /privacy in index.html');
  });

  test('is in the sitemap and not blocked by robots', () => {
    const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
    assert.match(sitemap, /<loc>https:\/\/yotinenergy\.com\/privacy<\/loc>/);

    const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
    for (const line of robots.split(/\r?\n/)) {
      const disallow = line.match(/^Disallow:\s*(\S+)/i);
      if (disallow && '/privacy'.startsWith(disallow[1])) {
        assert.fail(`robots.txt blocks the privacy notice: "${line}"`);
      }
    }
  });

  test('the page is indexable', () => {
    const privacy = fs.readFileSync(privacyPath, 'utf8');
    assert.ok(
      !/name="robots"[^>]*noindex/.test(privacy),
      'privacy notice is noindex — it should be findable'
    );
  });
});

describe('the notice matches what is actually collected', () => {
  const privacy = () => fs.readFileSync(privacyPath, 'utf8');

  test('if GA4 is enabled, the notice discloses analytics and cookies', () => {
    const id = measurementId();
    if (!id) return; // analytics off: nothing to disclose
    const text = privacy();
    assert.match(text, /Google Analytics/i, 'analytics enabled but not disclosed');
    assert.match(text, /cookie/i, 'analytics sets cookies; the notice must say so');
    assert.match(text, /opt out|opt-out/i, 'no opt-out route given');
  });

  test('discloses the qualifier funnel, including the bucketing promise', () => {
    const text = privacy();
    // main.js transmits the casing length as a range, never the exact figure.
    // If that promise is made here it must stay true in the code.
    assert.match(text, /range/i, 'bucketing of casing length not disclosed');
    assert.ok(
      /casingBucket/.test(fs.readFileSync(path.join(root, 'main.js'), 'utf8')),
      'the notice promises bucketing but main.js no longer buckets'
    );
  });

  test('discloses ChatFi review, consistent with the in-app disclosure', () => {
    assert.match(privacy(), /ChatFi/);
    assert.match(privacy(), /reviewed/i);
    // The panel tells visitors the same thing; they must not disagree.
    assert.match(index, /Conversations may be reviewed/);
  });

  test('names the third parties the page actually contacts', () => {
    const text = privacy();
    // Derived from the external origins index.html references.
    for (const party of ['Vercel', 'Google', 'jsDelivr', 'unpkg', 'mpsgroup.energy']) {
      assert.ok(text.includes(party), `third party not disclosed: ${party}`);
    }
  });

  test('gives a contact route for access and correction requests', () => {
    const text = privacy();
    assert.match(text, /kyle\.gronning@yotinenergy\.com/);
    assert.match(text, /PIPEDA|Personal Information Protection/i);
  });
});
