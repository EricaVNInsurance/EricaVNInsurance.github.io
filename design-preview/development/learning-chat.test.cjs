const assert = require('node:assert/strict');
const {classify} = require('../learning-chat.js');
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
  ['more please', 'unknown']
];
for (const [text, kind, topic] of cases) {
  const result = classify(text);
  assert.equal(result.kind, kind, text);
  if (topic) assert.equal(result.topics[0].id, topic, text);
}
assert.equal(classify('more please', classify('costs').topics[0]).kind, 'followup');
console.log('14 guided-chat routing and privacy checks passed.');
