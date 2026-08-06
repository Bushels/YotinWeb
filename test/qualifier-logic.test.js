/* Tests for the candidate-well qualifier decision logic.
 *
 *   node --test test/
 *
 * Node's built-in runner, no dependencies and no build step, so the site keeps
 * its "plain HTML/CSS/JS" property. `test/` is excluded from the Vercel deploy.
 *
 * What these cover is deliberate: the numbers an operator acts on. The 150 °C
 * ceiling and the ~10% standoff rule are real product limits published
 * elsewhere on the page, and getting one wrong does not throw or look broken —
 * it quietly returns a confident, wrong answer about someone's well. Rendering
 * is not covered here; a broken layout is visible, a wrong threshold is not.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

require(path.join(__dirname, '..', 'qualifier-logic.js'));
const Q = globalThis.YotinQualifier;

/** Build an answers object the way main.js does: key -> chosen option. */
function answersFrom(choices) {
  const answers = {};
  for (const [key, value] of Object.entries(choices)) {
    const step = Q.STEPS.find((s) => s.key === key);
    assert.ok(step, `no step with key "${key}"`);

    if (key === 'intermediate') {
      answers[key] = { value: `${Q.fmtNum(value)} m`, number: value };
      continue;
    }
    const source = step.type === 'derived' ? step.build(answers) : step;
    const option = source.options.find((o) => o.value === value);
    assert.ok(option, `no option "${value}" on step "${key}" — have: ${source.options.map((o) => o.value).join(' | ')}`);
    answers[key] = option;
  }
  return answers;
}

describe('module shape', () => {
  test('exposes six steps in the published order', () => {
    assert.equal(Q.STEPS.length, 6);
    assert.deepEqual(
      Q.STEPS.map((s) => s.key),
      ['lift', 'type', 'temp', 'intermediate', 'landing', 'timing']
    );
  });

  test('every flag an option can raise has a note explaining it', () => {
    const raised = new Set();
    for (const step of Q.STEPS) {
      const specs = step.type === 'derived'
        ? [step.build({}), step.build({ intermediate: { number: 1000 } })]
        : [step];
      for (const spec of specs) {
        for (const option of spec.options || []) {
          if (option.flag) raised.add(option.flag);
        }
      }
    }
    // A flag with no note renders a verdict that says "worth a review" and
    // then declines to say why, which is worse than not flagging at all.
    for (const flag of raised) {
      assert.ok(Q.NOTES[flag], `flag "${flag}" has no note in NOTES`);
    }
    assert.deepEqual([...raised].sort(), ['external', 'landing', 'lift', 'temp', 'thermal', 'timing']);
  });
});

describe('landing threshold — the 10% standoff rule', () => {
  test('is 0.9 x casing length, rounded to the nearest 10 m', () => {
    assert.equal(Q.landingThreshold(1000), 900);
    assert.equal(Q.landingThreshold(1500), 1350);
    assert.equal(Q.landingThreshold(2000), 1800);
    assert.equal(Q.landingThreshold(6000), 5400);
  });

  test('never rounds up onto the shoe at the shallow end', () => {
    // Regression: 50 * 0.9 = 45, which rounds to 50 — the shoe itself. The
    // question then offered an impossible "deeper" option and an unflagged
    // "shallower" option covering a landing at the shoe.
    assert.equal(Q.landingThreshold(50), 40);
    assert.equal(Q.landingThreshold(60), 50);
    assert.equal(Q.landingThreshold(100), 90);
  });

  test('rounds to 10 m rather than reporting false precision', () => {
    // 1523 * 0.9 = 1370.7 -> 1370, not 1370.7
    assert.equal(Q.landingThreshold(1523), 1370);
    assert.equal(Q.landingThreshold(1526), 1370);
    assert.equal(Q.landingThreshold(1530), 1380);
    assert.equal(Q.landingThreshold(1535), 1380);
  });

  test('the threshold is always shallower than the shoe', () => {
    // The rule is a standoff *above* the shoe. A threshold at or past the
    // casing length would tell an operator any landing is acceptable.
    for (let len = 50; len <= 6000; len += 10) {
      assert.ok(
        Q.landingThreshold(len) < len,
        `threshold ${Q.landingThreshold(len)} is not shallower than casing ${len}`
      );
    }
  });

  test('the derived question quotes the computed threshold', () => {
    const step = Q.STEPS.find((s) => s.key === 'landing');
    const spec = step.build({ intermediate: { number: 1500 } });
    assert.match(spec.question, /shallower or deeper than 1,350 m\?$/);
    assert.deepEqual(spec.options.map((o) => o.value), [
      'Shallower than 1,350 m',
      'Deeper than 1,350 m',
      'Not sure'
    ]);
    // Only the deep landing changes the deployment method.
    assert.equal(spec.options[0].flag, undefined);
    assert.equal(spec.options[1].flag, 'external');
  });

  test('falls back to a qualitative question when no length was entered', () => {
    const spec = Q.STEPS.find((s) => s.key === 'landing').build({});
    assert.match(spec.question, /Where does the pump land/);
    assert.equal(spec.options.find((o) => o.value === 'Close to the shoe').flag, 'external');
  });
});

describe('casing length validation', () => {
  const step = Q.STEPS.find((s) => s.key === 'intermediate');

  test('accepts the documented range inclusively', () => {
    assert.equal(Q.parseCasingLength('50', step).ok, true);
    assert.equal(Q.parseCasingLength('1000', step).number, 1000);
    assert.equal(Q.parseCasingLength('6000', step).ok, true);
  });

  test('rejects outside the range with a reason the funnel can record', () => {
    assert.equal(Q.parseCasingLength('49', step).reason, 'out_of_range');
    assert.equal(Q.parseCasingLength('6001', step).reason, 'out_of_range');
    assert.equal(Q.parseCasingLength('0', step).reason, 'not_a_number');
    assert.equal(Q.parseCasingLength('', step).reason, 'not_a_number');
    assert.equal(Q.parseCasingLength('abc', step).reason, 'not_a_number');
    assert.equal(Q.parseCasingLength(null, step).reason, 'not_a_number');
  });

  test('strips units and separators an engineer would type', () => {
    assert.equal(Q.parseCasingLength('1,500 m', step).number, 1500);
    assert.equal(Q.parseCasingLength(' 1500m ', step).number, 1500);
  });

  test('the range in the error message matches the range enforced', () => {
    // These drifted apart would tell the visitor to enter a value the field
    // then rejects.
    const message = Q.parseCasingLength('9999', step).error;
    assert.ok(message.includes(Q.fmtNum(step.min)), message);
    assert.ok(message.includes(Q.fmtNum(step.max)), message);
  });
});

describe('verdict', () => {
  test('a clean well is a strong fit', () => {
    const result = Q.assess(answersFrom({
      lift: 'Progressing cavity pump (PCP)',
      type: 'Heavy oil',
      temp: 'Under 100 °C',
      intermediate: 1000,
      landing: 'Shallower than 900 m',
      timing: 'Within 3 months'
    }));
    assert.equal(result.fit, 'strong');
    assert.deepEqual(result.flags, []);
    assert.equal(Q.resultLabel(result.fit), 'Strong fit');
  });

  test('any single flag downgrades to review, and review is not a rejection', () => {
    const result = Q.assess(answersFrom({
      lift: 'Progressing cavity pump (PCP)',
      type: 'Heavy oil',
      temp: 'Under 100 °C',
      intermediate: 1000,
      landing: 'Shallower than 900 m',
      timing: 'Nothing scheduled'
    }));
    assert.equal(result.fit, 'review');
    assert.deepEqual(result.flags, ['timing']);
    assert.equal(Q.resultLabel(result.fit), 'Likely fit — worth a review');
  });

  test('above 150 °C is a waitlist that outranks every other flag', () => {
    // The product rating is the one hard limit. It must not be averaged in
    // with softer review flags, and it must not read as a rejection.
    const result = Q.assess(answersFrom({
      lift: 'Natural flow or other',
      type: 'Thermal / SAGD',
      temp: 'Above 150 °C',
      intermediate: 1000,
      landing: 'Deeper than 900 m',
      timing: 'Nothing scheduled'
    }));
    assert.equal(result.fit, 'future');
    assert.equal(
      Q.resultLabel(result.fit),
      'Above 150 °C — waiting on the high-temperature version'
    );
    // The other concerns still surface as notes.
    assert.deepEqual(result.flags, ['lift', 'thermal', 'external', 'timing']);
  });

  test('"Not sure" on temperature is a review flag, not a pass', () => {
    const result = Q.assess(answersFrom({
      lift: 'Progressing cavity pump (PCP)',
      type: 'Heavy oil',
      temp: 'Not sure',
      intermediate: 1000,
      landing: 'Shallower than 900 m',
      timing: 'Within 3 months'
    }));
    assert.equal(result.fit, 'review');
    assert.ok(result.flags.includes('temp'));
  });

  test('a partly answered set never reports a strong fit by omission', () => {
    // Guards the failure mode where skipping the hard questions looks clean.
    const partial = Q.assess(answersFrom({ temp: 'Above 150 °C' }));
    assert.equal(partial.fit, 'future');
  });

  test('flags are reported in question order', () => {
    const result = Q.assess(answersFrom({
      lift: 'Natural flow or other',
      type: 'Thermal / SAGD',
      temp: 'Not sure',
      intermediate: 1000,
      landing: 'Not sure',
      timing: 'Not sure'
    }));
    assert.deepEqual(result.flags, ['lift', 'thermal', 'temp', 'landing', 'timing']);
  });
});

describe('metre formatting', () => {
  test('groups thousands and rounds half-up', () => {
    assert.equal(Q.fmtNum(900), '900');
    assert.equal(Q.fmtNum(1000), '1,000');
    assert.equal(Q.fmtNum(1350), '1,350');
    assert.equal(Q.fmtNum(6000), '6,000');
    assert.equal(Q.fmtNum(1234.4), '1,234');
    assert.equal(Q.fmtNum(1234.6), '1,235');
  });
});
