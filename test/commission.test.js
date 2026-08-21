/* Chapter 3 — "Commission the well" (spec §4 row 3, §5, §12, §0 one-candle).
 *
 * The truths this file guards are the ones the Close-the-Circuit slider used to carry, moved onto the new
 * surface: the chapter has exactly one invited action, it has a visible twin, the reading is never claimed
 * before it arrives, the whole thing is reversible, and cyan appears exactly once — at the arrival.
 *
 *   node --test test/commission.test.js
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const signalJs = fs.readFileSync(path.join(root, 'src', 'ui', 'signal.js'), 'utf8');
const signalCss = fs.readFileSync(path.join(root, 'src', 'styles', 'signal.css'), 'utf8');
const circuitJs = fs.readFileSync(path.join(root, 'src', 'world', 'circuit.js'), 'utf8');
const interactionsMjs = fs.readFileSync(path.join(root, 'scripts', 'interactions.mjs'), 'utf8');

const step = (id) => {
  const m = html.match(new RegExp(`<li class="commission-step[^"]*"[^>]*data-step="${id}"[^>]*>([\\s\\S]*?)</li>`));
  return m ? { open: m[0].slice(0, m[0].indexOf('>') + 1), body: m[1] } : null;
};

describe('commission the well', () => {
  test('the checklist is an ordered list of exactly three numbered steps', () => {
    assert.match(html, /<ol class="commission"/);
    const steps = [...html.matchAll(/<li class="commission-step[^"]*"[^>]*data-step="(\d\d)"/g)].map((m) => m[1]);
    assert.deepEqual(steps, ['01', '02', '03']);
    for (const id of steps) assert.ok(/data-step-state/.test(step(id).body), `${id} carries a state tag`);
  });

  test('01 ships already ticked — it is true before the visitor touches anything, JS or no JS', () => {
    assert.match(step('01').open, /data-state="done"/);
    assert.match(step('02').open, /data-state="todo"/);
    assert.match(step('03').open, /data-state="todo"/);
  });

  test('02 is the chapter\'s ONE invited action and its twin is a real, visible button', () => {
    const tags = [...html.matchAll(/<([a-z]+)\b[^>]*\sdata-hotspot="receiver"[^>]*>/g)];
    assert.equal(tags.length, 1, 'exactly one receiver twin');
    assert.equal(tags[0][1], 'button');
    assert.ok(!/\bhidden\b/.test(tags[0][0].replace(/aria-hidden="[^"]*"/, '')), 'the twin is not hidden at first paint');
    assert.ok(!/sr-only/.test(tags[0][0]), 'the twin is not sr-only');
    assert.match(tags[0][0], /aria-pressed="false"/);
    assert.match(signalCss, /\.commission-action \{[^}]*min-height: 44px/);
    // and it is the only hotspot chapter 3 registers
    const ids = [...signalJs.matchAll(/I\.register\('([^']+)'/g)].map((m) => m[1]);
    assert.deepEqual(ids, ['receiver']);
  });

  test('no receiver, no reading: the readout ships as dashes and 03 says so', () => {
    const values = [...html.matchAll(/<b data-readout-value[^>]*>([^<]*)<\/b>/g)].map((m) => m[1].trim());
    assert.equal(values.length, 3);
    values.forEach((v) => assert.ok(v.startsWith('—'), `"${v}" is a dash at first paint`));
    assert.match(step('03').body, /no reading/);
    // the surface-output line stays in the DOM (print / AT / the reduced-motion smoke read a spec fact) but is
    // only revealed once a reading has actually arrived
    assert.match(html, /data-readout-foot[^>]*><span class="chip chip-out">MODBUS RS-485 \/ 4-20 mA<\/span>/);
    assert.match(signalCss, /\.readout-foot \{[^}]*opacity: 0;/);
    assert.match(signalCss, /\.readout-foot\[data-arrived\] \{ opacity: 1; \}/);
  });

  test('03 is an arrival, not an action: a short honest wait, then the digits settle and it ticks itself', () => {
    assert.match(signalJs, /const WAIT_MS = 900;/);
    assert.match(signalJs, /waitTimer = setTimeout\(land, WAIT_MS\)/);
    // the wait collapses where there is no world to watch (spec §7)
    assert.match(signalJs, /const instant = \(\) => reduced \|\| html\.classList\.contains\('stills-on'\)/);
    assert.match(signalJs, /if \(instant\(\)\) land\(\);/);
    // land(): digits settle, 03 ticks, the closing line arrives
    const land = signalJs.slice(signalJs.indexOf('function land()'), signalJs.indexOf('function reset()'));
    assert.match(land, /settleDigits\(\)/);
    assert.match(land, /stepState\('03', 'done'/);
    assert.match(land, /foot\.dataset\.arrived = 'true'/);
    assert.ok(!/setTimeout/.test(land), 'nothing in the arrival is speculative — land() only runs after the wait');
  });

  test('reversible (spec §5): lifting the receiver undoes 02 and 03, and only those', () => {
    assert.match(html, /data-commission-reset/);
    assert.match(html, /<button type="button" class="commission-reset"[^>]*>Lift the receiver<\/button>/);
    const reset = signalJs.slice(signalJs.indexOf('function reset()'), signalJs.indexOf('if (placeBtn) placeBtn.addEventListener'));
    assert.match(reset, /clearTimeout\(waitTimer\)/, 'lifting during the wait cancels it — no reading arrives after the receiver is gone');
    assert.match(reset, /dissolveDigits\(\)/);
    assert.match(reset, /stepState\('02', 'todo'/);
    assert.match(reset, /stepState\('03', 'todo'/);
    assert.ok(!/stepState\('01'/.test(reset), '01 stays ticked — it was never ours to undo');
    assert.ok(!/signal-received/.test(reset), 'the logomark keeps its cyan for the session (spec §12)');
  });

  test('one-candle: cyan appears in chapter 3 only at the arrival — the 03 tick and the digits', () => {
    const cyan = [...signalCss.matchAll(/^(.*)#22D3EE.*$/gm)].map((m) => m[0].trim());
    assert.ok(cyan.length > 0);
    cyan.forEach((line) => assert.ok(
      /\[data-step="03"\]\[data-state="done"\]/.test(line) || /\.readout\.is-closed \.readout-list b/.test(line),
      `cyan is licensed only at the arrival, found: ${line}`,
    ));
    // and in the world the receiver's cap takes cyan only once a reading has landed, never on placement
    assert.match(circuitJs, /capMat\.color\.set\(state\.landed \? '#22D3EE' : '#e8dcc8'\)/);
  });

  test('the world end is a footprint on the pad, and the wellhead end is never called a reference', () => {
    assert.match(circuitJs, /const RECEIVER = new THREE\.Vector3\(/);
    assert.match(circuitJs, /receiver-footprint/);
    assert.match(circuitJs, /function showFootprint/);
    // the loop is only drawn once something stands on the lease (spatial truth, §13b)
    assert.match(circuitJs, /state\.closed = state\.placed;/);
    for (const gone of ['V₁', 'V₂', 'Wellhead reference', 'Remote ground reference', 'Reference separation']) {
      assert.ok(!html.includes(gone), `"${gone}" is gone from the page`);
    }
    assert.ok(!/type="range"[^>]*Reference separation/i.test(html));
  });

  test('the readout keeps its representative-values chips and its three rows', () => {
    assert.match(html, /<p class="readout-head"><span class="chip">representative values<\/span><span class="chip">visual timing not representative<\/span><\/p>/);
    ['Pressure', 'Temperature', 'Vibration'].forEach((row) => assert.ok(html.includes(`<span>${row}</span>`), row));
  });

  test('the four journey beats survive as the checklist sublines', () => {
    for (const beat of ['The tool speaks', 'The formation carries it up', 'Surface hears it', 'lands in your RTU']) {
      assert.ok(html.includes(beat), `"${beat}" survives`);
    }
    assert.ok(!html.includes('class="journey-list"'), 'the journey cards are gone');
  });

  test('the interaction capture drives the new flow under the old frame names', () => {
    assert.match(interactionsMjs, /shot\('signal-nodiff'/);
    assert.match(interactionsMjs, /shot\('signal-closed'/);
    assert.match(interactionsMjs, /clickTwin\('\[data-hotspot="receiver"\]'\)/);
    assert.ok(!/type="range"/.test(interactionsMjs.slice(interactionsMjs.indexOf('// 2) Signal'), interactionsMjs.indexOf('// 3) Deployment'))));
  });
});
