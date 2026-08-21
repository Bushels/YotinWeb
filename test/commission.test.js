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
const chartsJs = fs.readFileSync(path.join(root, 'src', 'world', 'charts.js'), 'utf8');
const chaptersJs = fs.readFileSync(path.join(root, 'src', 'chapters.js'), 'utf8');
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
    assert.match(signalJs, /const WAIT_MS = 1500;/);
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
    assert.ok(!/signal-received/.test(reset), 'the session remembers the arrival — signal-received is never taken back');
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
    // Round 13: 01's beat was "The tool speaks: a reading leaves the well" — anthropomorphic, and it asserted
    // the very reading 03's "NO READING" denies two rows below it. A ticked row has to be an install FACT; any
    // "reading" verb belongs to 03, after the digits exist.
    assert.ok(!html.includes('The tool speaks'), 'the tool does not speak, and 01 does not claim a reading');
    for (const beat of ['Made up in the tubing string', 'The formation carries it up', 'Surface hears it', 'lands in your RTU']) {
      assert.ok(html.includes(beat), `"${beat}" survives`);
    }
    assert.ok(!html.includes('class="journey-list"'), 'the journey cards are gone');
  });

  // Round 12d — the acquire beat. Placing the receiver is answered by a climb up the cased string and a bloom of
  // chart glyphs at the wellhead; the honest wait now covers that sequence instead of running out under it.
  test('the wait covers the acquire sequence: the reading lands as the bloom settles', () => {
    const wait = Number(signalJs.match(/const WAIT_MS = (\d+);/)[1]);
    const climb = Number(circuitJs.match(/const CLIMB_S = ([\d.]+), BLOOM_AT = ([\d.]+);/)[1]);
    const bloomAt = Number(circuitJs.match(/const CLIMB_S = [\d.]+, BLOOM_AT = ([\d.]+);/)[1]);
    const delays = JSON.parse(chartsJs.match(/const DELAY = (\[[^\]]*\]);/)[1]);
    const rise = Number(chartsJs.match(/const RISE = ([\d.]+);/)[1]);
    const settled = (bloomAt + Math.max(...delays) + rise) * 1000;
    assert.ok(climb > 0.5 && climb < 1, `the climb is a beat, not a wait: ${climb}s`);
    assert.ok(wait >= settled, `the wait (${wait} ms) outlasts the bloom settling (${settled.toFixed(0)} ms)`);
    assert.ok(wait <= 1600, 'and it is still a wait, not a loading screen');
  });

  test('no receiver, no charts: the bloom is a response to the act and it is reversible at once', () => {
    assert.match(chartsJs, /mesh\.visible = false;/, 'the charts ship invisible — nothing is drawn until something is placed');
    assert.match(circuitJs, /if \(wasPlaced && !state\.placed\) clearAcquire\(\);/);
    const clear = chartsJs.slice(chartsJs.indexOf('clear()'), chartsJs.indexOf('get busy'));
    assert.match(clear, /mesh\.visible = false/, 'lifting the receiver takes the charts away at once — no eased fade past the claim');
    // the climb reuses the field's own line source rather than inventing a second stroke set
    assert.match(circuitJs, /island\.field\.setClimb\(/);
  });

  /* Round 14a — the no-invented-DATA test, re-pinned to the restored chart glyphs.

     LEAD DECISION (Kyle, 2026-08-21, recorded in spec §0): abstract chart glyphs carrying no printed values
     and no axes are licensed as marketing iconography. The truth bar is NO BLATANT LIES — stylisation and
     selective emphasis are permitted. So the ban this test enforces is the one that survives: nothing on the
     glyph faces may print a NUMBER, a unit, a label or an axis tick, because that is where an abstract shape
     turns into a claimed reading. Critics: do not re-raise the sparkline ban for valueless glyphs. */
  test('the chart glyphs claim nothing: no digits, no labels, no axis text', () => {
    const code = chartsJs.slice(chartsJs.indexOf('function drawAtlas'));
    assert.ok(!/fillText|strokeText|font\s*=/.test(code), 'no numbers, no units, no axis labels — the glyphs claim nothing');
    // the bloom is one draw call and it is not a second stroke set
    assert.match(chartsJs, /new THREE\.InstancedMesh\(geom, mat, TILES\)/, 'three quads, one instanced mesh, one draw call');
    // Round 14a keeps the ONE thing the retired panel round proved: the glyphs rise out of the RECEIVER the
    // visitor planted, not out of free air over the tank battery, and they follow it when it moves.
    assert.match(chartsJs, /setAnchor\(x, y, z\)/, 'the glyph row has a movable origin');
    assert.match(circuitJs, /chartsRef\.setAnchor\(stake\.position\.x/, 'the origin is the receiver');
    assert.match(circuitJs, /function placeStakeAt\(p\) \{ stake\.position\.copy\(p\); updateLoop\(\); anchorCharts\(\); \}/);
    // and the retired panel surface is gone, not merely unused
    assert.ok(!fs.existsSync(path.join(root, 'src', 'world', 'panel.js')), 'src/world/panel.js is deleted');
  });

  test('the commissioning hold is lit: chapter 3 ramps up as the pose moves to surface', () => {
    const table = JSON.parse(chaptersJs.match(/const CH3_LIGHT = (\[\[[^;]*\]\]);/)[1]);
    const first = table[0], last = table[table.length - 1];
    assert.equal(first[0], 0);
    assert.ok(first[1] <= 0.03, 'the collar reveal keeps its authored darkness — the darkest-frame contract lives there');
    // the pose reaches signal-b at local 0.25 (chapters.js poseProgress); by the hold the lease must be lit
    const hold = table.filter(([l]) => l >= 0.3 && l <= 0.8).map(([, v]) => v);
    assert.ok(hold.length && Math.min(...hold) >= 0.25, `the signal-b hold reads as a dusk lease, not a void: ${hold}`);
    assert.equal(last[0], 1);
    assert.equal(last[1], 0.32, 'and it hands to chapter 4 at chapter 4 own ledger value, so the blend stays continuous');
    assert.match(chaptersJs, /if \(i === 3\) out\.light = chapter3Light\(t\);/);
  });

  test('the interaction capture drives the new flow under the old frame names', () => {
    assert.match(interactionsMjs, /shot\('signal-nodiff'/);
    assert.match(interactionsMjs, /shot\('signal-closed'/);
    assert.match(interactionsMjs, /clickTwin\('\[data-hotspot="receiver"\]'\)/);
    assert.ok(!/type="range"/.test(interactionsMjs.slice(interactionsMjs.indexOf('// 2) Signal'), interactionsMjs.indexOf('// 3) Deployment'))));
  });
});
