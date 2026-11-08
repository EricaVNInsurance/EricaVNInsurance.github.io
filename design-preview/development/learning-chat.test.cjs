const assert = require('node:assert/strict');
const {classify, lossReply, normalizeInput} = require('../learning-chat.js');
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
assert.equal(classify('idk what coverage i have lol').kind, 'unknown_coverage');
assert.equal(classify('I dont know what insurance I have').kind, 'unknown_coverage');
assert.equal(classify('What coverage do I have?').kind, 'unknown_coverage');
assert.equal(classify('tbh im not sure what plan i have rn').kind, 'unknown_coverage');
assert.equal(classify('idk').kind, 'unsure');
assert.equal(classify('idc lol').kind, 'unsure');
assert.equal(classify('lmao i lost my coverage').kind, 'coverage_loss');
assert.equal(classify('lol what is a deductible').topics[0].id, 'cost');
assert.equal(classify('idk my SSN is 123-45-6789').kind, 'private');
assert.ok(lossReply('idk lol'));
assert.equal(normalizeInput('LOL lmao'), '');
assert.equal(classify('I know what coverage I have').kind, 'topic');
console.log('37 guided-chat language, conversation and privacy checks passed.');
