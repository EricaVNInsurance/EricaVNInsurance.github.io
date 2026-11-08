const assert = require('node:assert/strict');
const {classify, lossReply} = require('../learning-chat.js');
const cases = [
  ['I am retiring soon', 'topic', 'start'],
  ['I see doctors in two states', 'topic', 'network'],
  ['I have QMB and Medicaid', 'topic', 'medicaid'],
  ['I need prescription information', 'topic', 'drugs'],
  ['What does a deductible mean?', 'topic', 'cost'],
  ['Will my medication be covered?', 'specific'],
  ['Which plan is best for me?', 'specific'],
  ['My SSN is 123-45-6789', 'private'],
  ['fictional@example.com', 'private'],
  ['call me please', 'handoff'],
  ['I have chest pain', 'urgent'],
  ['<script>alert(1)</script>', 'unknown'],
  ['more please', 'unknown'],
  ['I lost my coverage', 'coverage_loss'],
  ['My insurance was canceled', 'coverage_loss'],
  ['My coverage is ending', 'coverage_loss'],
  ['I no longer have insurance', 'coverage_loss'],
  ['Hello!', 'greeting']
];
for (const [text, kind, topic] of cases) {
  const result = classify(text);
  assert.equal(result.kind, kind, text);
  if (topic) assert.equal(result.topics[0].id, topic, text);
}
assert.equal(classify('more please', classify('costs').topics[0]).kind, 'followup');
assert.match(lossReply('through my job').text, /employer or benefits administrator/);
assert.match(lossReply('Medicaid').text, /state Medicaid office/);
assert.match(lossReply('A Medicare plan').text, /what coverage is currently active/);
assert.match(lossReply('I’m not sure').text, /don’t need to know all/);
assert.equal(lossReply('I do not want to discuss that'), null);
assert.equal(classify('I lost coverage; my SSN is 123-45-6789').kind, 'private');
console.log('25 guided-chat routing, conversation and privacy checks passed.');
