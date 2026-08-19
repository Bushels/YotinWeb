/* Chapters 2 (tool) and 4 (deployment) hotspot twins (spec §5: every raycast target has a VISIBLE DOM twin;
 * §0: every in-world numeric readout carries a persistent "representative values" chip).
 *
 * For every hotspot id src/ui/tool.js and src/ui/deployment.js register, index.html must contain an element with
 * the matching data-hotspot that is a button / link / input or carries role="button", and no twin may be sr-only.
 *
 *   node --test test/tool-twins.test.js
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const toolJs = fs.readFileSync(path.join(root, 'src', 'ui', 'tool.js'), 'utf8');
const deployJs = fs.readFileSync(path.join(root, 'src', 'ui', 'deployment.js'), 'utf8');

const TOOL_IDS = ['collar', 'gap', 'sensors', 'battery', 'inspect', 'ch-01', 'ch-02', 'ch-03', 'ch-04', 'ch-05',
  'spec-pressure', 'spec-temperature', 'spec-od', 'spec-battery', 'spec-installs', 'spec-output'];
const DEPLOY_IDS = ['xray', 'fluid-level', 'app-light', 'app-heavy', 'app-gas', 'app-thermal',
  'benefit-pump', 'benefit-production', 'benefit-drawdown', 'benefit-reservoir', 'benefit-fluid', 'benefit-optimization'];

// The opening tag that carries data-hotspot="id" (attributes in any order).
function openingTag(id) {
  const re = new RegExp(`<([a-z0-9]+)\\b[^>]*\\sdata-hotspot="${id}"[^>]*>`, 'g');
  const all = [...html.matchAll(re)];
  return all.map((m) => ({ tag: m[1], text: m[0] }));
}
function isTwinShaped({ tag, text }) {
  if (tag === 'button' || tag === 'a' || tag === 'input') return true;
  return /\srole="button"/.test(text);
}

describe('tool + deployment twins', () => {
  test('every registered hotspot id has exactly one visible, twin-shaped element in index.html', () => {
    const bad = [];
    for (const id of [...TOOL_IDS, ...DEPLOY_IDS]) {
      const tags = openingTag(id);
      if (tags.length !== 1) { bad.push(`${id}: ${tags.length} elements`); continue; }
      if (!isTwinShaped(tags[0])) bad.push(`${id}: <${tags[0].tag}> is not a button/link/input and has no role="button"`);
      if (/class="[^"]*\bsr-only\b/.test(tags[0].text)) bad.push(`${id}: twin is sr-only`);
      if (/\bhidden\b/.test(tags[0].text.replace(/aria-hidden="[^"]*"/, ''))) bad.push(`${id}: twin is hidden at first paint`);
    }
    assert.deepEqual(bad, []);
  });

  test('chapter gates: tool [[1.6,3.4]], deployment [[3.6,4.998]] (ends where the yôtin chapter arrives)', () => {
    assert.match(toolJs, /TOOL_GATE = \[\[1\.6, 3\.4\]\]/);
    assert.match(deployJs, /DEPLOY_GATE = \[\[3\.6, 4\.998\]\]/);
  });

  test('in-world numeric readouts carry the "representative values" chip; the sr text stays static', () => {
    assert.ok(html.includes('representative values') || toolJs.includes('representative values'));
    const hud = [...html.matchAll(/<p class="channel-hud"[^>]*>([\s\S]*?)<\/p>/g)];
    assert.equal(hud.length, 5, 'five channel HUD lines');
    hud.forEach((m) => assert.ok(m[1].includes('representative values'), 'each HUD line carries the chip'));
    const sr = [...html.matchAll(/<span class="sr-only">Representative value: [^<]+<\/span>/g)];
    assert.equal(sr.length, 5, 'five static sr values');
  });

  test('the ids registered in the modules match the ledger above', () => {
    TOOL_IDS.filter((id) => !id.startsWith('ch-') && !id.startsWith('spec-')).forEach((id) => assert.ok(toolJs.includes(`'${id}'`) || html.includes(`data-hotspot="${id}"`), id));
    assert.ok(deployJs.includes("'xray'") && deployJs.includes("'fluid-level'"));
    DEPLOY_IDS.filter((id) => id.startsWith('benefit-') || id.startsWith('app-')).forEach((id) => assert.ok(deployJs.includes(`'${id}'`), id));
  });

  test('Thermal chip reads "Thermal · in development" (spec §4 row 4)', () => {
    assert.match(html, /data-hotspot="app-thermal"[^>]*>[\s\S]*?Thermal · in development/);
  });

  test('fluid-level instrument is a labelled range with the representative label and no printed values', () => {
    assert.match(html, /Fluid level \(representative\)/);
    assert.match(html, /<input type="range"[^>]*data-hotspot="fluid-level"/);
    assert.match(html, /earlier · now/);
    assert.match(html, /surface looks the same/);
  });
});
