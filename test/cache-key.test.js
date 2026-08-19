/* Cache keys after the Vite build (spec §2, §9). Bundled CSS/JS are content-hashed, so index.html
 * must not carry the old manual `styles.css?v=` / `main.js?v=` keys (that class of bug is gone).
 * Public assets that still carry a `?v=` key are only informational now — but the file they point
 * at must exist under public/, or the key is decorating a 404.
 *
 *   node --test test/cache-key.test.js
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pages = ['index.html', 'privacy.html'].map((f) => ({ file: f, html: fs.readFileSync(path.join(root, f), 'utf8') }));

function firstPartyRefs(html) {
  // href/src values that point at first-party files (leading single slash) — external URLs skipped.
  return [...html.matchAll(/\b(?:href|src)="(\/(?!\/)[^"#]+)"/g)].map((m) => m[1]);
}

describe('cache keys', () => {
  for (const { file, html } of pages) {
    test(`${file}: no manual styles.css?v= / main.js?v= keys (bundled + hashed by Vite)`, () => {
      assert.doesNotMatch(html, /styles\.css\?v=/);
      assert.doesNotMatch(html, /main\.js\?v=/);
    });

    test(`${file}: every first-party ?v= reference points at a file under public/`, () => {
      const keyed = firstPartyRefs(html).filter((u) => /\?v=/.test(u));
      const missing = keyed.filter((u) => !fs.existsSync(path.join(root, 'public', u.split('?')[0])));
      assert.deepEqual(missing, [], 'keyed refs without a public/ file: ' + missing.join(', '));
    });

    test(`${file}: every first-party /assets/ reference exists under public/`, () => {
      const assets = firstPartyRefs(html).filter((u) => u.startsWith('/assets/'));
      assert.ok(assets.length > 0, 'expected at least one /assets/ reference');
      const missing = assets.filter((u) => !fs.existsSync(path.join(root, 'public', u.split('?')[0])));
      assert.deepEqual(missing, [], 'missing public/ assets: ' + missing.join(', '));
    });
  }

  test('index.html poster preload and <img> share one URL (same cache key)', () => {
    const html = pages[0].html;
    const urls = [...new Set([...html.matchAll(/["'](\/assets\/wellfi-island-r3f-poster\.webp[^"']*)["']/g)].map((m) => m[1]))];
    assert.equal(urls.length, 1, 'poster referenced with different keys: ' + urls.join(' | '));
  });
});
