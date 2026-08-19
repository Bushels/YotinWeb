/* Anchors and ARIA references resolve (spec §0 "anchors/ids unchanged", §9 "id/aria pairs resolve").
 * The nav, the skip link, the section rail, hash deep-links from operator routes and every
 * aria-labelledby all point at ids in index.html; a rename during a redesign breaks them silently.
 *
 *   node --test test/ids-resolve.test.js
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// Committed baseline: every id the site has shipped with and that nav / hash links / tests rely on.
const BASELINE_IDS = [
  'top', 'main', 'hero-title',
  'wellfi', 'wellfi-title',
  'benefits', 'benefits-title',
  'insight', 'insight-title',
  'faq', 'faq-title',
  'company', 'company-title',
  'contact', 'contact-title',
  'qualifier-title', 'chatfi-title',
  'mobileNav',
];

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const idSet = new Set(ids);

describe('ids resolve', () => {
  test('every baseline id still exists in index.html', () => {
    const missing = BASELINE_IDS.filter((id) => !idSet.has(id));
    assert.deepEqual(missing, [], 'missing ids: ' + missing.join(', '));
  });

  test('ids are unique', () => {
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert.deepEqual([...new Set(dupes)], []);
  });

  test('every aria-labelledby refers to an existing id', () => {
    const refs = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].flatMap((m) => m[1].trim().split(/\s+/));
    assert.ok(refs.length >= 9, 'expected the section aria-labelledby pairs, found ' + refs.length);
    const dangling = refs.filter((r) => !idSet.has(r));
    assert.deepEqual(dangling, [], 'dangling aria-labelledby: ' + dangling.join(', '));
  });

  test('every aria-describedby / aria-controls refers to an existing id', () => {
    const refs = [...html.matchAll(/aria-(?:describedby|controls)="([^"]+)"/g)].flatMap((m) => m[1].trim().split(/\s+/));
    const dangling = refs.filter((r) => !idSet.has(r));
    assert.deepEqual(dangling, [], 'dangling aria refs: ' + dangling.join(', '));
  });

  test('in-page nav hashes resolve to ids', () => {
    const hashes = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
    const dangling = [...new Set(hashes.filter((h) => !idSet.has(h)))];
    assert.deepEqual(dangling, [], 'dangling href="#…": ' + dangling.join(', '));
  });
});
