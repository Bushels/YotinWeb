/* Operator routes ship by allow-list only (spec §0 "operator routes baytex/ obsidian/ tamarack/ ship
 * exactly as today via an allow-list (s/ excluded unless tracked)"). Everything in public/ is copied
 * verbatim into dist/ by Vite, so public/ IS the deploy surface: any stray directory (a scratch
 * route, a dropped screenshot folder) would go live. This pins the top level exactly.
 *
 *   node --test test/routes-allowlist.test.js
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pub = path.join(root, 'public');

const ALLOWED_TOP = ['assets', 'baytex', 'obsidian', 'tamarack', 'llms.txt', 'robots.txt', 'sitemap.xml'];
const ALLOWED_ASSET_DIRS = ['fonts', 'stills'];
const OPERATOR_ROUTES = ['baytex', 'obsidian', 'tamarack'];

const list = (dir) => fs.readdirSync(dir, { withFileTypes: true });

describe('public/ allow-list', () => {
  test('top level of public/ is exactly the allow-list', () => {
    const entries = list(pub).map((e) => e.name).sort();
    assert.deepEqual(entries, [...ALLOWED_TOP].sort(), 'public/ must contain exactly ' + ALLOWED_TOP.join(', '));
  });

  test('public/assets/ holds files plus only the fonts/ and stills/ directories', () => {
    const dirs = list(path.join(pub, 'assets')).filter((e) => e.isDirectory()).map((e) => e.name);
    const stray = dirs.filter((d) => !ALLOWED_ASSET_DIRS.includes(d));
    assert.deepEqual(stray, [], 'unexpected directories under public/assets/: ' + stray.join(', '));
  });

  test('each operator route is a single index.html', () => {
    for (const r of OPERATOR_ROUTES) {
      const files = list(path.join(pub, r)).map((e) => e.name);
      assert.deepEqual(files, ['index.html'], `${r}/ must contain only index.html`);
    }
  });

  test('s/ is not part of the deploy surface', () => {
    assert.equal(fs.existsSync(path.join(pub, 's')), false, 'public/s must not exist');
  });

  test('llms.txt, robots.txt and sitemap.xml are non-empty', () => {
    for (const f of ['llms.txt', 'robots.txt', 'sitemap.xml']) assert.ok(fs.statSync(path.join(pub, f)).size > 0, f + ' is empty');
  });
});
