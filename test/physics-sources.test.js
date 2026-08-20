/* Printed physics figures carry a source (spec §0 EM grammar: "Every printed physics figure carries a
 * `source` field (CI)").
 *
 * The rule: if a physics figure — a skin-depth statement (`δ ≈`), the 503 skin-depth constant, an
 * attenuation ratio (`100x`, `100×`, or a `n × m` product) — appears in DOM-facing text, i.e.
 * index.html or anything under src/ui/, then the same file must carry a `data-source=` attribute or
 * a `source:` field within 300 characters of the figure. Files under src/world/ and the rest of src/
 * are scanned and listed for visibility only (comments and shader math are not printed).
 *
 * The standoff rule of thumb ("10 % of intermediate") is the one figure DOM-facing files do print, in
 * src/ui/fit.js (three sites) and qualifier-logic.js; each carries its provenance within the window.
 *
 *   node --test test/physics-sources.test.js
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const WINDOW = 300;

// Figure matchers. Hex colours (#05030a) and decimals are excluded from the 503 match; the bare
// multiplication sign only counts when it sits between digits (a "light × ambient" comment is not a figure).
const FIGURES = [
  { name: 'δ ≈ (skin depth)', re: /δ\s*≈|&delta;\s*&asymp;/g },
  { name: '503 (skin-depth constant)', re: /(?<![\w#.])503(?![\w.])/g },
  { name: '100x / 100× (attenuation ratio)', re: /\b100\s*[x×](?![a-z])|\b100\s*&times;/gi },
  { name: 'n × m product', re: /\d\s*(?:×|&times;)\s*\d/g },
  // The standoff rule of thumb, in both printed forms: "10 % of intermediate" and "10% of the intermediate's length".
  { name: '% of intermediate (standoff rule)', re: /\d+\s*%\s*of (?:the )?intermediate/gi },
];
const SOURCE = /data-source=|\bsource:/;

function findFigures(text) {
  const hits = [];
  for (const f of FIGURES) {
    for (const m of text.matchAll(f.re)) {
      const around = text.slice(Math.max(0, m.index - WINDOW), m.index + m[0].length + WINDOW);
      hits.push({ figure: f.name, index: m.index, text: m[0], sourced: SOURCE.test(around), line: text.slice(0, m.index).split('\n').length });
    }
  }
  return hits;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (/\.js$/.test(e.name)) out.push(p);
  }
  return out;
}

// qualifier-logic.js sits at the repo root but is loaded into the page, and its NOTES strings are printed
// verbatim in the verdict block — DOM-facing by any honest reading, so the gate must see it.
const domFacing = [path.join(root, 'index.html'), path.join(root, 'qualifier-logic.js'), ...walk(path.join(root, 'src', 'ui'))];
const informational = walk(path.join(root, 'src')).filter((p) => !domFacing.includes(p));

describe('physics figures carry a source', () => {
  test('harness: the matcher finds unsourced and sourced figures in a fixture', () => {
    const bad = findFigures('<p>Skin depth δ ≈ 503 √(ρ / f) metres; casing attenuates the field 100× more.</p>');
    assert.ok(bad.length >= 3, 'fixture should yield ≥ 3 figures, got ' + bad.length);
    assert.ok(bad.every((h) => !h.sourced), 'fixture has no source, so every hit is unsourced');
    const good = findFigures('<p data-source="Wu et al. 2024">casing attenuates 100× more</p>');
    assert.ok(good.length >= 1 && good.every((h) => h.sourced));
    const jsGood = findFigures("chip({ text: 'δ ≈ 500 m', source: 'Wu et al. 2024' })");
    assert.ok(jsGood.length >= 1 && jsGood.every((h) => h.sourced));
    // Non-figures the matcher must ignore.
    assert.equal(findFigures("color: '#05030a'; // light × ambient cycle").length, 0);
  });

  test('every printed physics figure in DOM-facing files (index.html, src/ui/**) has a source within 300 chars', () => {
    const unsourced = [];
    for (const file of domFacing) {
      const text = fs.readFileSync(file, 'utf8');
      for (const h of findFigures(text)) if (!h.sourced) unsourced.push(`${path.relative(root, file)}:${h.line} ${h.figure} "${h.text}"`);
    }
    assert.deepEqual(unsourced, [], 'unsourced physics figures:\n  ' + unsourced.join('\n  '));
  });

  test('report: figures in non-DOM src files (informational)', () => {
    const seen = [];
    for (const file of informational) {
      const text = fs.readFileSync(file, 'utf8');
      for (const h of findFigures(text)) seen.push(`${path.relative(root, file)}:${h.line} ${h.figure} sourced=${h.sourced}`);
    }
    // Not asserted — surfaced in the TAP diagnostics so a new figure in world code is noticed.
    if (seen.length) console.log('# physics figures outside DOM-facing files:\n# ' + seen.join('\n# '));
    assert.ok(Array.isArray(seen));
  });
});
