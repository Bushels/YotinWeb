/* Stills path contract (spec §6, §7): the seven reduced-motion stills exist and sit under their caps; the DOM
 * has the fixed-layer and stills mount points; the world is only ever a dynamic import; the stills module
 * never touches three.
 *
 *   node --test test/stills-path.test.js
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const CAPS = { 0: 60 * 1024, 1: 22 * 1024, 2: 22 * 1024, 3: 22 * 1024, 4: 22 * 1024, 5: 22 * 1024, 6: 22 * 1024 };
const IDS = ['surface', 'descent', 'tool', 'signal', 'deployment', 'yotin', 'fit'];

describe('stills: files and caps', () => {
  for (let i = 0; i < 7; i++) {
    test(`ch${i}.webp (${IDS[i]}) exists and is ≤ ${CAPS[i] / 1024} KB`, () => {
      const file = path.join(root, 'public', 'assets', 'stills', `ch${i}.webp`);
      assert.ok(fs.existsSync(file), `${file} missing — run scripts/stills.mjs against a dev server`);
      const size = fs.statSync(file).size;
      assert.ok(size > 0, 'empty still');
      assert.ok(size <= CAPS[i], `ch${i}.webp is ${size} B, cap ${CAPS[i]} B`);
      const head = fs.readFileSync(file).subarray(0, 12).toString('latin1');
      assert.equal(head.slice(0, 4), 'RIFF');
      assert.equal(head.slice(8, 12), 'WEBP');
    });
  }
});

describe('stills: DOM mount points', () => {
  const html = read('index.html');
  test('index.html carries the stills layer and the fixed layer', () => {
    assert.match(html, /<div class="stills" data-stills aria-hidden="true"><\/div>/);
    assert.match(html, /<div class="fixed-layer" data-fixed-layer><\/div>/);
  });
  test('the stills layer follows the world container and the fixed layer follows the rail', () => {
    assert.ok(html.indexOf('id="world"') < html.indexOf('data-stills'));
    assert.ok(html.indexOf('id="rail"') < html.indexOf('data-fixed-layer'));
    assert.ok(html.indexOf('data-fixed-layer') < html.indexOf('<header class="site-header"'));
  });
});

describe('stills: import gate', () => {
  test('src/main.js never statically imports boot.js (only import("./boot.js"))', () => {
    const src = read('src/main.js');
    assert.doesNotMatch(src, /^\s*import\s+[^(]*['"]\.\/boot\.js['"]/m, 'static import of boot.js found');
    assert.doesNotMatch(src, /import\s+\{[^}]*\}\s+from\s+['"]\.\/boot\.js['"]/);
    assert.match(src, /import\(['"]\.\/boot\.js['"]\)/);
  });
  test('src/main.js mounts the motion toggle always and the stills only off the world path', () => {
    const src = read('src/main.js');
    assert.match(src, /mountMotionToggle\(\)/);
    assert.match(src, /if \(!gate\.world\) mountStills\(\)/);
  });
  test('src/ui/stills.js does not import three or boot.js statically', () => {
    const src = read('src/ui/stills.js');
    assert.doesNotMatch(src, /from\s+['"]three['"]/);
    assert.doesNotMatch(src, /import\s+['"]three/);
    assert.doesNotMatch(src, /^\s*import\s+[^(]*['"]\.\.\/boot\.js['"]/m);
    assert.match(src, /import\(['"]\.\.\/boot\.js['"]\)/);
  });
  test('src/ui/motionToggle.js does not import three', () => {
    const src = read('src/ui/motionToggle.js');
    assert.doesNotMatch(src, /['"]three['"]/);
  });
});

describe('stills: motion control contract', () => {
  const src = read('src/ui/motionToggle.js');
  const css = read('src/styles/world.css');
  test('persists in localStorage["yotin-motion"], uses aria-pressed, dispatches world:motion', () => {
    assert.match(src, /'yotin-motion'/);
    assert.match(src, /aria-pressed/);
    assert.match(src, /world:motion/);
    assert.match(src, /gtag/);
  });
  test('html.motion-paused pauses every CSS animation without hiding reveal content', () => {
    assert.match(css, /html\.motion-paused \*, html\.motion-paused \*::before, html\.motion-paused \*::after \{ animation-play-state: paused !important; \}/);
    assert.match(css, /html\.motion-paused \[data-motion\],\s*html\.motion-paused \[data-hero-step\] \{ opacity: 1 !important; transform: none !important; \}/);
  });
  test('the toggle is a ≥ 44 px mono control in the fixed layer', () => {
    assert.match(css, /\.motion-toggle \{[^}]*min-height: 44px/s);
    assert.match(css, /\.motion-toggle \{[^}]*var\(--font-mono\)/s);
    assert.match(css, /\.motion-toggle \{[^}]*letter-spacing: 0\.08em/s);
  });
});
