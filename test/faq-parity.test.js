/* The FAQ exists twice in index.html: once as FAQPage JSON-LD for search
 * engines, once as rendered <details> for people. Two copies of the same
 * sentences is exactly the drift the Flutter port taught us to expect — the
 * compiler checks neither, and a stale answer in one of them is invisible
 * until a customer or a crawler reads the wrong thing.
 *
 * This asserts they stay identical.
 *
 *   node --test test/faq-parity.test.js
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function decodeEntities(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/** The FAQ as search engines receive it. */
function structuredFaq() {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const [, body] of blocks) {
    const data = JSON.parse(body);
    if (data['@type'] === 'FAQPage') {
      return data.mainEntity.map((qa) => ({
        question: qa.name,
        answer: qa.acceptedAnswer.text
      }));
    }
  }
  return null;
}

/** The FAQ as a visitor reads it. */
function renderedFaq() {
  const section = html.match(/<section class="faq-section"[\s\S]*?<\/section>/);
  if (!section) return null;
  return [...section[0].matchAll(
    /<details class="faq-item"[^>]*>[\s\S]*?<summary>\s*<span>([\s\S]*?)<\/span>[\s\S]*?<\/summary>\s*<p>([\s\S]*?)<\/p>/g
  )].map((m) => ({
    question: decodeEntities(m[1].trim()),
    answer: decodeEntities(m[2].trim())
  }));
}

describe('FAQ', () => {
  test('both representations exist', () => {
    assert.ok(structuredFaq(), 'no FAQPage JSON-LD in index.html');
    assert.ok(renderedFaq(), 'no .faq-section rendered in index.html');
  });

  test('the rendered answers match the structured data exactly', () => {
    const structured = structuredFaq();
    const rendered = renderedFaq();

    assert.equal(
      rendered.length,
      structured.length,
      `${structured.length} questions in JSON-LD but ${rendered.length} rendered`
    );

    structured.forEach((expected, i) => {
      assert.equal(rendered[i].question, expected.question, `question ${i + 1} differs`);
      assert.equal(rendered[i].answer, expected.answer, `answer ${i + 1} differs`);
    });
  });

  test('answers are real content, not placeholders', () => {
    for (const { question, answer } of renderedFaq()) {
      assert.ok(question.endsWith('?'), `not a question: "${question}"`);
      assert.ok(answer.length > 40, `answer too short to be useful: "${answer}"`);
      assert.ok(!/lorem|TODO|TBD/i.test(answer), `placeholder text in: "${answer}"`);
    }
  });

  test('the section is reachable and labelled for assistive tech', () => {
    const section = html.match(/<section class="faq-section"[^>]*>/)[0];
    assert.match(section, /id="faq"/);
    assert.match(section, /aria-labelledby="faq-title"/);
    assert.match(html, /<h2 id="faq-title"/);
  });

  test('answers are in the document, not injected by script', () => {
    // The whole point of rendering them is that a crawler or a no-JS visitor
    // can read them. If they ever move into main.js this fails.
    const firstAnswer = structuredFaq()[0].answer.slice(0, 40);
    assert.ok(
      html.includes(firstAnswer),
      'first FAQ answer is not present as static HTML'
    );
  });
});
