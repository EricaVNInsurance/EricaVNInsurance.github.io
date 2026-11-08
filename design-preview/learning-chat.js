/* Local guided preview. No network, analytics, storage, or AI service calls. */
(function () {
  'use strict';
  const topics = [
    { id: 'start', label: 'Getting started', terms: /\b(65|retir\w*|working|employer|new to medicare|sign up|enroll\w*)\b/i, text: 'Let’s start with what to check before signing up or changing coverage. These guides can help you organize your questions; your own timing needs an individual review.', links: [['New to Medicare', 'turning-65.html'], ['Enrollment periods', 'enrollment-periods.html']] },
    { id: 'network', label: 'Doctors & travel', terms: /\b(doctor\w*|travel\w*|state\w*|snowbird\w*|network\w*|hmo|ppo|move|moving|medigap|supplement)\b/i, text: 'It sounds like where you get care matters to you. Start with the network and travel guide, then compare the different coverage approaches. This guide cannot check whether a specific doctor accepts your coverage.', links: [['Doctors, networks & travel', 'networks-and-travel.html'], ['Compare coverage approaches', 'compare-coverage.html']] },
    { id: 'medicaid', label: 'Medicaid & help with costs', terms: /\b(medicaid|qmb\w*|slmb\w*|fbde|qi|lis|extra help|low income|dual)\b/i, text: 'There are a few different kinds of assistance to understand. These pages explain Medicaid, Medicare Savings Programs, and Extra Help. They do not determine your eligibility or confirm your current assistance level.', links: [['Medicare & Medicaid', 'medicare-and-medicaid.html'], ['Extra Help', 'extra-help.html'], ['Official Medicaid resources by state', 'medicaid-by-state.html']] },
    { id: 'drugs', label: 'Prescriptions', terms: /\b(drug\w*|prescription\w*|medicine\w*|medication\w*|pharmac\w*|formulary|part d)\b/i, text: 'For questions about prescriptions, this guide explains what to review in a plan’s drug information. I cannot look up coverage for a particular medicine. You do not need to enter medication names or health details here.', links: [['Prescription drug coverage', 'prescription-drug-coverage.html'], ['Medicare Word Guide', 'medicare-words.html']] },
    { id: 'cost', label: 'Bills & costs', terms: /\b(bill\w*|cost\w*|premium\w*|copay\w*|coinsurance|deductible\w*|expensive|afford\w*|irmaa|moop)\b/i, text: 'Let’s make the cost terms easier to navigate. These pages explain the words you may see on coverage information and bills. For a particular charge or claim, the plan or billing provider can explain the actual record.', links: [['Understanding Medicare costs', 'medicare-costs.html'], ['Look up a cost term', 'medicare-words.html']] },
    { id: 'basics', label: 'Medicare basics', terms: /\b(medicare|part a|part b|part c|advantage|original|coverage|options|compare)\b/i, text: 'A good starting point is understanding the parts of Medicare and how the coverage approaches fit together. You can read these at your own pace.', links: [['Parts A, B, C & D', 'parts-of-medicare.html'], ['Compare coverage approaches', 'compare-coverage.html']] }
  ];
  function classify(input, previous) {
    const text = String(input).slice(0, 600);
    if (/\b(911|emergency|chest pain|can.?t breathe|cannot breathe|stroke|overdose|kill myself|suicid\w*)\b/i.test(text)) return { kind: 'urgent' };
    if (/\b\d{3}[- .]?\d{2}[- .]?\d{4}\b|\b\d{10,}\b|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b|\b(?:\d[ -]?){11,}\b/i.test(text) || /\b(ssn|social security number|medicare (?:number|id)|member (?:number|id)|date of birth|my address|my phone)\b/i.test(text)) return { kind: 'private' };
    if (/\b(erica|human|agent|person|call me|contact|someone|representative)\b/i.test(text)) return { kind: 'handoff' };
    if (/\b(covered|cover my|eligible|qualify|which plan|best plan|recommend a plan|will .* pay|my claim|denied|denial|appeal)\b/i.test(text)) return { kind: 'specific' };
    const matches = topics.filter(t => t.terms.test(text));
    // Prefer specific topics to the broad Medicare-basics match; show at most two.
    const specific = matches.filter(t => t.id !== 'basics');
    if (specific.length || matches.length) return { kind: 'topic', topics: (specific.length ? specific : matches).slice(0, 2) };
    if (/\b(more|explain|yes|that|this)\b/i.test(text) && previous) return { kind: 'followup', topics: [previous] };
    return { kind: 'unknown' };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { classify, topics };
  if (typeof document === 'undefined') return;
  const host = document.getElementById('learning-chat');
  if (!host) return;
  const log = host.querySelector('[data-chat-log]');
  const form = host.querySelector('form');
  const input = host.querySelector('textarea');
  const choices = host.querySelector('[data-chat-choices]');
  let previous = null;
  function node(tag, cls, text) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text) el.textContent = text;
    return el;
  }
  function message(who, text, links) {
    const item = node('div', 'lc-message lc-' + who);
    item.append(node('span', 'lc-speaker', who === 'visitor' ? 'You' : 'Learning guide'));
    item.append(node('p', '', text));
    if (links && links.length) {
      const list = node('ul', 'lc-links');
      links.forEach(([label, href]) => {
        const li = node('li');
        const a = node('a', '', label + ' →');
        a.href = href;
        li.append(a); list.append(li);
      });
      item.append(list);
    }
    log.append(item);
    // Bound the visible session and avoid a growing page after repeated messages.
    while (log.children.length > 16) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }
  const handoffLinks = [['Open Erica’s contact form preview', 'request-medicare-help.html']];
  function handoff(text) {
    message('guide', text + ' The contact form is currently a demonstration and does not send a request yet. No chat text is carried into the form.', handoffLinks);
  }
  function respond(value, chosen) {
    const result = chosen ? {kind: 'topic', topics: [chosen]} : classify(value, previous);
    message('visitor', result.kind === 'private' ? '[Contact or identifier details omitted]' : value);
    if (result.kind === 'private') message('guide', 'Please keep identifying information out of this preview. It does not need your name, phone, email, Medicare number, or Social Security number. Try a general question, such as “I’m retiring soon.”');
    else if (result.kind === 'urgent') message('guide', 'This guide cannot help with an emergency. If you may be in immediate danger or need urgent medical help, call 911. For non-urgent medical concerns, contact a healthcare professional.');
    else if (result.kind === 'handoff') handoff('You can ask Erica for help with your situation.');
    else if (result.kind === 'specific') handoff('That needs a check of your actual situation or coverage. This preview cannot determine eligibility, recommend a plan, or verify a benefit, provider, prescription, or claim. For an existing claim or bill, contact your plan or billing provider.');
    else if (result.kind === 'unknown') message('guide', 'I haven’t found a clear topic match. This first version matches questions to learning-center guides; it does not generate AI answers or search official sources live. Choose a topic below, try a shorter general question, or use “Ask Erica for help.”');
    else if (result.kind === 'followup') message('guide', 'I can point you to the guide for more detail, but this preview cannot answer a deeper follow-up yet. You can also choose another topic or ask Erica for help.', result.topics[0].links);
    else {
      previous = result.topics[0];
      result.topics.forEach(t => message('guide', t.text, t.links));
    }
  }
  function reset() {
    log.replaceChildren(); input.value = ''; previous = null;
    message('guide', 'Hi! What would you like to understand about Medicare? Tell me generally what’s going on, or choose a topic. I’ll help you find a starting point in the learning center.');
  }
  topics.forEach(t => {
    const b = node('button', 'lc-chip', t.label); b.type = 'button';
    b.addEventListener('click', () => { respond(t.label, t); input.focus({preventScroll:true}); });
    choices.append(b);
  });
  form.addEventListener('submit', e => {
    e.preventDefault(); const value = input.value.trim(); if (!value) { input.focus(); return; }
    input.value = ''; respond(value); input.focus({preventScroll:true});
  });
  host.querySelector('[data-chat-reset]').addEventListener('click', () => { reset(); input.focus({preventScroll:true}); });
  host.querySelector('[data-chat-handoff]').addEventListener('click', () => { handoff('Let’s make it easier to get personal assistance.'); input.focus({preventScroll:true}); });
  reset();
})();
