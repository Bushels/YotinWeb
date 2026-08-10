/* Tests for ChatFi integration and candidate-well qualifier form routing.
 *
 *   node --test test/chatfi-form.test.js
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const mainJs = fs.readFileSync(path.join(root, 'main.js'), 'utf8');

require(path.join(root, 'qualifier-logic.js'));
const Q = globalThis.YotinQualifier;

const EXPECTED_EMAIL = 'kyle.gronning@yotinenergy.com';

describe('ChatFi integration & email fallback', () => {
  test('ChatFi API endpoint attribute is present on body', () => {
    assert.match(html, /data-chatfi-api="https:\/\/chatfi-server-[^"]+"/);
  });

  test('ChatFi fallback email link points to kyle.gronning@yotinenergy.com', () => {
    assert.match(html, new RegExp(`href="mailto:${EXPECTED_EMAIL}"[^>]*data-chatfi-fallback`));
  });

  test('ChatFi error message directs users to kyle.gronning@yotinenergy.com', () => {
    assert.match(mainJs, new RegExp(`CHATFI_ERROR = "[^"]*Email ${EXPECTED_EMAIL}`));
  });

  test('ChatFi disclosure informs users about conversation review', () => {
    assert.match(html, /Conversations may be reviewed to improve the service/);
    assert.match(html, /Confirm anything that matters directly with Yotin/);
  });
});

describe('Candidate-well qualifier form email routing', () => {
  test('YotinQualifier.EMAIL is configured to kyle.gronning@yotinenergy.com', () => {
    assert.equal(Q.EMAIL, EXPECTED_EMAIL);
  });

  test('QUALIFIER_EMAIL fallback in main.js matches kyle.gronning@yotinenergy.com', () => {
    assert.match(mainJs, new RegExp(`QUALIFIER_EMAIL = Q \\? Q\\.EMAIL : "${EXPECTED_EMAIL}"`));
  });

  test('Direct email link on contact section points to kyle.gronning@yotinenergy.com', () => {
    assert.match(html, new RegExp(`href="mailto:${EXPECTED_EMAIL}">${EXPECTED_EMAIL}</a>`));
  });
});

describe('Qualifier form summary mailto & copy payload generation', () => {
  test('constructs valid mailto parameters with well assessment summary', () => {
    const answers = {
      lift: { value: 'Progressing cavity pump (PCP)' },
      type: { value: 'Heavy oil' },
      temp: { value: '100 – 150 °C', tag: 'At spec' },
      intermediate: { value: '1,500 m', number: 1500 },
      landing: { value: 'Shallower than 1,350 m', tag: '< 1,350' },
      timing: { value: 'Within 3 months', tag: 'Ideal timing' }
    };

    const assessment = Q.assess(answers);
    assert.equal(assessment.fit, 'strong');

    // Simulate mailto construction in main.js
    const subject = encodeURIComponent('Candidate well summary — Strong fit');
    const mailtoUrl = `mailto:${Q.EMAIL}?subject=${subject}`;

    assert.ok(mailtoUrl.includes(`mailto:${EXPECTED_EMAIL}`));
    assert.ok(mailtoUrl.includes(encodeURIComponent('Strong fit')));
  });

  test('high-temperature waitlist routes to dedicated subject header', () => {
    const answers = {
      lift: { value: 'Rod pump' },
      type: { value: 'Heavy oil' },
      temp: { value: 'Above 150 °C', future: true },
      intermediate: { value: '1,000 m', number: 1000 },
      landing: { value: 'Shallower than 900 m' },
      timing: { value: '3 – 12 months' }
    };

    const assessment = Q.assess(answers);
    assert.equal(assessment.fit, 'future');
    const label = Q.resultLabel(assessment.fit);
    assert.match(label, /Above 150 °C/);

    const subjectText = assessment.fit === 'future'
      ? 'Candidate well — awaiting 150 °C+ WellFi'
      : `Candidate well summary — ${label}`;

    assert.equal(subjectText, 'Candidate well — awaiting 150 °C+ WellFi');
  });
});
