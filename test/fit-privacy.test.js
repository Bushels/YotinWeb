/* Chapter 6 (fit) privacy gate — spec §0 / §4 row 6.
 *
 * The world and its caption may only ever see a NORMALIZED schematic state. The
 * typed intermediate casing length, the derived landing threshold and the answer
 * strings must never leave the masked qualifier DOM: not in the qualifier:state
 * event detail, not in the caption, not in the schematic PNG, and never over the
 * network from the fit modules.
 *
 *   node --test test/fit-privacy.test.js
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const mainJs = read('main.js');
const fitJs = read('src/ui/fit.js');
const builderJs = read('src/world/wellBuilder.js');
const html = read('index.html');
const entry = read('src/main.js');

require(path.join(root, 'qualifier-logic.js'));
const Q = globalThis.YotinQualifier;

/** Source of the normalizer function in main.js (from its `function` keyword to the next top-level helper). */
function normalizerSource() {
  const start = mainJs.indexOf('function qualifierWorldState(');
  assert.ok(start > 0, 'main.js must define qualifierWorldState');
  const end = mainJs.indexOf('function emitQualifierState(', start);
  assert.ok(end > start, 'main.js must define emitQualifierState after qualifierWorldState');
  return mainJs.slice(start, end);
}

describe('qualifier:state detail is normalized only', () => {
  test('main.js dispatches qualifier:state at answer / back / restart / verdict', () => {
    assert.match(mainJs, /new CustomEvent\("qualifier:state", \{ detail: qualifierWorldState\(phase, verdict\) \}\)/);
    assert.match(mainJs, /emitQualifierState\(step\.key, null\);/, 'answer (option and number step) site');
    assert.match(mainJs, /emitQualifierState\("back", null\);/, 'back site');
    assert.match(mainJs, /emitQualifierState\("restart", null\);/, 'restart site');
    assert.match(mainJs, /emitQualifierState\("verdict", result\.fit\);/, 'verdict site');
    // exactly one dispatch site, and it only ever carries the normalizer's output
    assert.equal(mainJs.match(/qualifier:state/g).length, 1);
  });

  test('the normalizer never reads the typed length, the threshold or any answer string', () => {
    const src = normalizerSource();
    for (const forbidden of [/\.number\b/, /\bparsed\b/, /casingBucket/, /landingThreshold/, /fmtNum/, /\.value\b/, /\.tag\b/, /\blength\s*:/, /intermediateLength/, /input\.value/]) {
      assert.doesNotMatch(src, forbidden, `normalizer must not contain ${forbidden}`);
    }
  });

  test('the detail object carries exactly the fixed vocabulary keys', () => {
    const src = normalizerSource();
    const literal = src.slice(src.indexOf('return {'), src.lastIndexOf('};'));
    const keys = [...literal.matchAll(/^\s{8}(\w+):/gm)].map((m) => m[1]);
    assert.deepEqual(keys, ['step', 'lift', 'fluid', 'temp', 'hasLength', 'landing', 'verdict']);
    assert.match(literal, /hasLength: Boolean\(answers\.intermediate\)/);
  });

  test('positional ids line up with the frozen option order in qualifier-logic.js', () => {
    const by = (k) => Q.STEPS.find((s) => s.key === k).options.map((o) => o.value);
    const lift = by('lift'), type = by('type'), temp = by('temp');
    assert.match(lift[0], /PCP/); assert.match(lift[1], /ESP/); assert.match(lift[2], /Rod/); assert.match(lift[3], /flow/i);
    assert.match(type[0], /Heavy/); assert.match(type[1], /Light/); assert.match(type[2], /Gas/); assert.match(type[3], /Thermal/);
    assert.match(temp[0], /Under/); assert.match(temp[1], /100 – 150/); assert.match(temp[2], /Above/); assert.match(temp[3], /Not sure/);
    assert.match(normalizerSource(), /pick\("lift", \["pcp", "esp", "rod", "flow"\]\)/);
    assert.match(normalizerSource(), /pick\("type", \["heavy", "light", "gas", "thermal"\]\)/);
    assert.match(normalizerSource(), /pick\("temp", \["cool", "warm", "over", "unsure"\]\)/);
    // landing is decided by the option's flag, which is fixed vocabulary in qualifier-logic.js
    const derived = Q.STEPS.find((s) => s.key === 'landing').build({ intermediate: { number: 1000 } }).options;
    assert.equal(derived[1].flag, 'external');
    assert.equal(derived[2].flag, 'landing');
    assert.equal(derived[0].flag, undefined);
  });
});

describe('fit modules stay local', () => {
  test('no network primitives in src/ui/fit.js or src/world/wellBuilder.js', () => {
    for (const [name, src] of [['fit.js', fitJs], ['wellBuilder.js', builderJs]]) {
      for (const forbidden of ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'new Image(']) {
        assert.ok(!src.includes(forbidden), `${name} must not contain ${forbidden}`);
      }
      // dynamic import() is allowed ONLY for the first-party world module (spec §6: the stills path must not
      // request world bytes, so the builder loads after world:first-frame) — never a remote URL.
      const dyn = [...src.matchAll(/import\(([^)]*)\)/g)].map((m) => m[1].trim());
      for (const arg of dyn) assert.match(arg, /^['"](?:\.\.\/world\/wellBuilder\.js|\.\/tool\.js)['"]$/, `${name}: unexpected dynamic import ${arg}`); // + the UI's own tool module (standoff caption projection)
    }
  });

  test('fit.js only reads the normalized keys off the event and the caption has no numeric echo path', () => {
    assert.match(fitJs, /state = \{ step: d\.step \|\| null, lift: d\.lift \|\| null, fluid: d\.fluid \|\| null, temp: d\.temp \|\| null, hasLength: Boolean\(d\.hasLength\), landing: d\.landing \|\| null, verdict: d\.verdict \|\| null \};/);
    for (const forbidden of [/\.number\b/, /\blength\b\s*[:=]/, /qualifier-input/, /\.value\b/, /textContent\s*=\s*[^'"]*answers/]) {
      assert.doesNotMatch(fitJs, forbidden, `fit.js must not contain ${forbidden}`);
    }
    // the caption tables: the only digits allowed are the public "10 %" standoff rule and the public spec line
    const tables = fitJs.slice(fitJs.indexOf('const CAPTION ='), fitJs.indexOf('const VERDICT_LABEL'));
    const digits = tables.replace(/10 %/g, '').replace(/10,000 psia · 150 °C · 46 mm OD · 5\+ yr · MODBUS RS-485 \/ 4-20 mA/g, '');
    assert.doesNotMatch(digits, /\d/, 'caption vocabulary must carry no numbers beyond the public rule/spec line');
    assert.ok(fitJs.includes('Proposed outside-intermediate WellFi configuration — review required'));
    assert.ok(fitJs.includes('standoff — 10 % of intermediate'));
    assert.ok(fitJs.includes('inside casing — reduced signal'));
    assert.ok(fitJs.includes('open hole — strongest signal'));
    assert.ok(fitJs.includes('representative · not to scale · generated locally'));
  });

  test('wellBuilder imports nothing from three or the world chunk (budget: one world chunk)', () => {
    assert.doesNotMatch(builderJs, /^\s*import\s/m, 'wellBuilder.js must have no imports');
    assert.match(entry, /import \{ mountFit \} from '\.\/ui\/fit\.js';/);
    assert.match(entry, /^mountFit\(\);/m);
  });
});

describe('contact section markup', () => {
  test('the fit caption and stage are masked, the caption is the live region', () => {
    const start = html.indexOf('<section class="contact-section"');
    const end = html.indexOf('</section>', html.indexOf('data-qualifier-stage'));
    const contact = html.slice(start, end);
    assert.match(contact, /<p class="fit-caption" data-fit-caption data-clarity-mask="true" aria-live="polite" hidden><\/p>/);
    assert.match(contact, /<div class="fit-stage" data-fit-stage aria-hidden="true" data-clarity-mask="true"><\/div>/);
    assert.match(contact, /data-qualifier-stage data-clarity-mask="true"/);
  });
});
