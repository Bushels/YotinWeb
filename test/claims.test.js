/* Proof claims (spec §0). The install figure is "160+" everywhere it is printed — proof chip, spec
 * tile (with the "+" applied by the counter tween's suffix so the animated number lands on the same
 * text), Product JSON-LD — and the Product JSON-LD carries no `manufacturer` (brand kept). Three
 * copies of one number is exactly the drift a redesign introduces silently.
 *
 *   node --test test/claims.test.js
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function jsonLdBlocks() {
  const out = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) out.push(JSON.parse(m[1]));
  return out;
}

describe('install figure is "160+" everywhere', () => {
  test('proof chip says "160+ Installed Internationally"', () => {
    assert.match(html, /160\+ Installed Internationally/);
  });

  test('spec tile counter carries data-count="160" with a "+" suffix and renders "160+"', () => {
    assert.match(html, /<span data-count="160" data-count-suffix="\+">160\+<\/span>/);
  });

  test('Product JSON-LD Deployments property says "160+ installed internationally"', () => {
    const product = jsonLdBlocks().find((b) => b['@type'] === 'Product');
    assert.ok(product, 'Product JSON-LD block present');
    const dep = (product.additionalProperty || []).find((p) => p.name === 'Deployments');
    assert.ok(dep, 'Deployments PropertyValue present');
    assert.equal(dep.value, '160+ installed internationally');
  });

  test('no bare "160 " install claim survives anywhere in index.html', () => {
    // Every occurrence of the figure must be followed by "+" (or be the data-count attribute value).
    const bare = [...html.matchAll(/160(?!\+)(?![0-9])/g)].map((m) => html.slice(Math.max(0, m.index - 30), m.index + 30));
    const allowed = bare.filter((ctx) => !/data-count="160"/.test(ctx));
    assert.deepEqual(allowed, [], 'bare "160" claims: ' + JSON.stringify(allowed));
  });
});

describe('Product JSON-LD proof constraints', () => {
  test('no manufacturer key (brand kept)', () => {
    const product = jsonLdBlocks().find((b) => b['@type'] === 'Product');
    assert.ok(product);
    assert.equal(Object.prototype.hasOwnProperty.call(product, 'manufacturer'), false, 'manufacturer must not be published');
    assert.equal(product.brand && product.brand.name, 'WellFi');
    assert.doesNotMatch(html, /"manufacturer"/);
  });
});
