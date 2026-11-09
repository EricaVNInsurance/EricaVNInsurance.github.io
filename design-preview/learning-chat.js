/* Guided mode is local. AI mode requires configured HTTPS backend + visitor opt-in. */
(function () {
  'use strict';
  const topics = [
    { id: 'start', label: 'Getting started', terms: /\b(65|retir\w*|working|employer|new to medicare|sign up|enroll\w*)\b/i, text: 'Let’s start with what to check before signing up or changing coverage. These guides can help you organize your questions; the timing for your situation needs to be reviewed individually.', links: [['New to Medicare', 'turning-65.html'], ['Enrollment periods', 'enrollment-periods.html']] },
    { id: 'network', label: 'Doctors & travel', terms: /\b(doctor\w*|travel\w*|state\w*|snowbird\w*|network\w*|hmo|ppo|move|moving|medigap|supplement)\b/i, text: 'It sounds like where you get care matters to you. Start with the network and travel guide, then compare the different coverage approaches. This guide cannot check whether a specific doctor accepts your coverage.', links: [['Doctors, networks & travel', 'networks-and-travel.html'], ['Compare coverage approaches', 'compare-coverage.html']] },
    { id: 'medicaid', label: 'Medicaid & help with costs', terms: /\b(medicaid|qmb\w*|slmb\w*|fbde|qi|lis|extra help|low income|dual)\b/i, text: 'There are a few different kinds of assistance to understand. These pages explain Medicaid, Medicare Savings Programs, and Extra Help. They do not determine your eligibility or confirm your current assistance level.', links: [['Medicare & Medicaid', 'medicare-and-medicaid.html'], ['Extra Help', 'extra-help.html'], ['Official Medicaid resources by state', 'medicaid-by-state.html']] },
    { id: 'drugs', label: 'Prescriptions', terms: /\b(drug\w*|prescription\w*|medicine\w*|medication\w*|pharmac\w*|formulary|part d)\b/i, text: 'For questions about prescriptions, this guide explains what to review in a plan’s drug information. I cannot look up coverage for a particular medicine. You do not need to enter medication names or health details here.', links: [['Prescription drug coverage', 'prescription-drug-coverage.html'], ['Medicare Word Guide', 'medicare-words.html']] },
    { id: 'cost', label: 'Bills & costs', terms: /\b(bill\w*|cost\w*|premium\w*|copay\w*|coinsurance|deductible\w*|expensive|afford\w*|irmaa|moop)\b/i, text: 'Let’s make the cost terms easier to navigate. These pages explain the words you may see on coverage information and bills. For a particular charge or claim, the plan or billing provider can explain the actual record.', links: [['Understanding Medicare costs', 'medicare-costs.html'], ['Look up a cost term', 'medicare-words.html']] },
    { id: 'basics', label: 'Medicare basics', terms: /\b(medicare|part a|part b|part c|advantage|original|coverage|options|compare)\b/i, text: 'A good starting point is understanding the parts of Medicare and how the coverage approaches fit together. You can read these at your own pace.', links: [['Parts A, B, C & D', 'parts-of-medicare.html'], ['Compare coverage approaches', 'compare-coverage.html']] }
  ];
  function normalizeInput(input) {
    return String(input).slice(0, 600).replace(/[’‘]/g, "'").toLowerCase()
      .replace(/\bidk\b/g, 'i do not know')
      .replace(/\bidc\b/g, 'i do not care')
      .replace(/\bdont\b/g, 'do not')
      .replace(/\b(lol|lmao|lmfao|rofl)\b/g, ' ')
      .replace(/\btbh\b/g, 'to be honest')
      .replace(/\brn\b/g, 'right now')
      .replace(/\b(pls|plz)\b/g, 'please')
      .replace(/\bu\b/g, 'you').replace(/\bur\b/g, 'your')
      .replace(/\s+/g, ' ').trim();
  }
  function classify(input, previous) {
    const text = normalizeInput(input);
    if (/\b(911|emergency|chest pain|can.?t breathe|cannot breathe|stroke|overdose|kill myself|suicid\w*)\b/i.test(text)) return { kind: 'urgent' };
    if (/\b\d{3}[- .]?\d{2}[- .]?\d{4}\b|\b\d{10,}\b|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b|\b(?:\d[ -]?){11,}\b/i.test(text) || /\b(ssn|social security number|medicare (?:number|id)|member (?:number|id)|date of birth|my address|my phone)\b/i.test(text)) return { kind: 'private' };
    if (/\b(do not know|don't know|not sure|unsure|no idea|cannot tell|can't tell)\b.{0,70}\b(coverage|insurance|plan|medicare|have|got)\b|^what (coverage|insurance|plan)\b.{0,30}\bdo i\b.{0,15}\b(have|got)\b/i.test(text)) return {kind:'unknown_coverage'};
    if (/^(i )?(do not know|don't know|do not care|don't care|not sure|no idea)[.!?\s]*$/i.test(text)) return {kind:'unsure'};
    if (/\b(lost|losing|lose)\b.{0,45}\b(coverage|insurance|medicaid|plan)\b|\b(coverage|insurance|medicaid|plan)\b.{0,35}\b(ended|ending|cancelled|canceled|terminated|stopped)\b|\b(no longer have|have no)\b.{0,20}\b(coverage|insurance)\b/i.test(text)) return { kind: 'coverage_loss' };
    if (/\b(erica|human|agent|person|call me|contact|someone|representative)\b/i.test(text)) return { kind: 'handoff' };
    if (/^(hi|hello|hey|good (morning|afternoon|evening))[!.\s]*$/i.test(text.trim())) return {kind:'greeting'};
    if (/\b(covered|cover my|eligible|qualify|which plan|best plan|recommend a plan|will .* pay|my claim|denied|denial|appeal)\b/i.test(text)) return { kind: 'specific' };
    const matches = topics.filter(t => t.terms.test(text));
    // Prefer specific topics to the broad Medicare-basics match; show at most two.
    const specific = matches.filter(t => t.id !== 'basics');
    if (specific.length || matches.length) return { kind: 'topic', topics: (specific.length ? specific : matches).slice(0, 2) };
    if (/\b(more|explain|yes|that|this)\b/i.test(text) && previous) return { kind: 'followup', topics: [previous] };
    return { kind: 'unknown' };
  }
  function lossReply(text) {
    text = normalizeInput(text);
    if (/\b(job|employer|work|retir\w*|cobra|spouse)\b/i.test(text)) return {text:'Thank you. That helps. Let’s focus on the coverage you had through work. A useful first step is to confirm its end date with the employer or benefits administrator. Whether you already have Medicare also matters. Medicare.gov has a guide to this transition; Erica can help you review how it applies to your situation.',links:[['Medicare.gov: working or retiring', 'https://www.medicare.gov/basics/get-started-with-medicare/medicare-basics/working-past-65'],['Understand enrollment periods','enrollment-periods.html']]};
    if (/\b(medicaid|qmb|slmb|fbde)\b/i.test(text)) return {text:'Thanks for explaining. Losing Medicaid can be confusing, especially if you also have Medicare. Keep the notice showing what changed and when; you don’t need to upload it here. Start with the explanation of how Medicare and Medicaid work together, and ask your state Medicaid office about the reason for the change. Erica can help you review the Medicare questions.',links:[['Medicare & Medicaid','medicare-and-medicaid.html'],['Find your state Medicaid office','medicaid-by-state.html'],['Medicare.gov: coverage changes','https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/joining-a-plan/special-enrollment-periods']]};
    if (/\b(medicare|advantage|drug|part d)\b/i.test(text)) return {text:'Thank you for clarifying. You mean a Medicare plan. The notice from the plan is a helpful starting point: what ended, why, and on what date? You don’t need to paste the notice here. Contact the plan or Medicare to confirm what coverage is currently active, and ask Erica for help reviewing the next steps. I can explain the general process, but can’t confirm an enrollment window for you here.',links:[['Medicare.gov: coverage changes','https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/joining-a-plan/special-enrollment-periods'],['Understand enrollment periods','enrollment-periods.html']]};
    if (/\b(not sure|don.?t know|do not know|unsure|something else|other)\b/i.test(text)) return {text:'That’s okay—you don’t need to know all the insurance terms. Start by checking the type of coverage listed on your notice, or contact whoever sent it to ask what ended. Keep any account or member numbers private. You can also ask Erica for help figuring out where to start.',links:[['Compare coverage types','compare-coverage.html']]};
    return null;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { classify, topics, lossReply, normalizeInput };
  if (typeof document === 'undefined') return;
  const host = document.getElementById('learning-chat');
  if (!host) return;
  const log = host.querySelector('[data-chat-log]');
  const form = host.querySelector('form');
  const input = host.querySelector('textarea');
  const choices = host.querySelector('[data-chat-choices]');
  function resizeInput() {
    input.style.height = 'auto';
    input.style.height = Math.min(120, Math.max(44, input.scrollHeight)) + 'px';
  }
  input.addEventListener('input', resizeInput);
  const topicMenu = host.querySelector('[data-chat-topics]');
  const topicSummary = topicMenu.querySelector('summary');
  function updateTopicLabel() {
    const label = awaitingCoverageType ? 'reply options' : 'topics';
    topicSummary.textContent = topicMenu.open ? 'Hide ' + label : (awaitingCoverageType ? 'Reply options' : 'Topics');
  }
  const infoMenu = host.querySelector('.lc-info');
  topicMenu.addEventListener('toggle', () => { updateTopicLabel(); if (topicMenu.open) infoMenu.open = false; });
  infoMenu.addEventListener('toggle', () => { if (infoMenu.open) topicMenu.open = false; });
  let previous = null;
  let awaitingCoverageType = false;
  const panel = host.querySelector('.lc-panel');

  // Keep sizing controls shared across every page that uses this widget.
  const sizeButton = document.createElement('button');
  sizeButton.type = 'button';
  sizeButton.className = 'lc-size-toggle';
  sizeButton.textContent = '⤢';
  sizeButton.setAttribute('aria-label', 'Make chat larger');
  sizeButton.title = 'Make chat larger';
  sizeButton.setAttribute('aria-pressed', 'false');
  host.querySelector('.lc-toolbar-actions').prepend(sizeButton);
  const grip = document.createElement('button');
  grip.type = 'button';
  grip.className = 'lc-resize-grip';
  grip.textContent = '⤡';
  grip.setAttribute('aria-label', 'Resize chat. Drag, or use arrow keys. Shift plus arrow resizes faster.');
  grip.title = 'Drag to resize · Arrow keys also resize';
  panel.append(grip);
  function setChatSize(width, height) {
    const maxWidth = Math.max(0, window.innerWidth - 32);
    const maxHeight = Math.max(0, window.innerHeight - 120);
    panel.style.setProperty('--lc-width', Math.min(maxWidth, Math.max(Math.min(320, maxWidth), width)) + 'px');
    panel.style.setProperty('--lc-height', Math.min(maxHeight, Math.max(Math.min(360, maxHeight), height)) + 'px');
  }
  sizeButton.addEventListener('click', () => {
    const large = sizeButton.getAttribute('aria-pressed') !== 'true';
    sizeButton.setAttribute('aria-pressed', String(large));
    sizeButton.setAttribute('aria-label', large ? 'Make chat smaller' : 'Make chat larger');
    sizeButton.title = large ? 'Make chat smaller' : 'Make chat larger';
    sizeButton.textContent = large ? '⤡' : '⤢';
    setChatSize(large ? 480 : 380, large ? 680 : 500);
  });
  let resizeStart = null;
  grip.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const rect = panel.getBoundingClientRect();
    resizeStart = {x:e.clientX, y:e.clientY, width:rect.width, height:rect.height};
    grip.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  grip.addEventListener('pointermove', e => {
    if (!resizeStart) return;
    setChatSize(resizeStart.width + resizeStart.x - e.clientX, resizeStart.height + resizeStart.y - e.clientY);
  });
  function endResize() { resizeStart = null; }
  grip.addEventListener('pointerup', endResize);
  grip.addEventListener('pointercancel', endResize);
  grip.addEventListener('lostpointercapture', endResize);
  grip.addEventListener('keydown', e => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const rect = panel.getBoundingClientRect(), step = e.shiftKey ? 40 : 10;
    setChatSize(rect.width + (e.key === 'ArrowLeft' ? step : e.key === 'ArrowRight' ? -step : 0),
      rect.height + (e.key === 'ArrowUp' ? step : e.key === 'ArrowDown' ? -step : 0));
  });

  const launcher = host.querySelector('.lc-launcher');
  const send = host.querySelector('[data-chat-send]');
  const optIn = host.querySelector('[data-ai-opt-in]');
  const config = window.ERICA_LEARNING_CHAT || {};
  let aiReady = false;
  try {
    const endpoint = new URL(config.endpoint);
    aiReady = config.aiEnabled === true && endpoint.protocol === 'https:' &&
      endpoint.origin === config.approvedOrigin && !endpoint.username && !endpoint.password;
  } catch (_) { /* Stay in local guided mode. */ }
  let history = [], activeRequest = null, generation = 0;
  function openChat(open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) input.focus({preventScroll:true}); else launcher.focus({preventScroll:true});
  }
  launcher.addEventListener('click', () => openChat(panel.hidden));
  document.querySelectorAll('[data-open-learning-chat]').forEach(button => {
    button.addEventListener('click', () => openChat(true));
  });
  host.querySelector('.lc-close').addEventListener('click', () => openChat(false));
  host.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { e.preventDefault(); openChat(false); } });
  if (aiReady) {
    host.querySelector('[data-ai-consent]').hidden = false;
    host.querySelector('[data-chat-connection]').textContent = 'AI answers are available when you choose “Use AI answers.”';
  }
  optIn.addEventListener('change', () => {
    generation++; if (activeRequest) activeRequest.abort(); history = []; setBusy(false);
    host.querySelectorAll('[data-ai-pending]').forEach(el => el.remove());
    host.querySelector('[data-chat-mode]').textContent = aiReady && optIn.checked ? 'AI learning assistant · Check official sources' : 'Guided preview · Local topic matching';
    send.setAttribute('aria-label', aiReady && optIn.checked ? 'Send question to AI' : 'Send question');
    message('guide', optIn.checked ? 'AI mode is on. Your next question and recent AI conversation will be sent to OpenAI through our private service. Keep questions general and check the official sources linked in the answer.' : 'Guided mode is on. Future questions stay on this page. The AI conversation context has been cleared here.');
  });
  function setBusy(busy) {
    send.disabled = busy; input.disabled = busy;
    choices.querySelectorAll('button').forEach(b => { b.disabled = busy; });
    log.setAttribute('aria-busy', String(busy));
  }
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
    requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; });
    return item;
  }
  const handoffLinks = [['Open Erica’s contact form preview', 'request-medicare-help.html']];
  function handoff(text) {
    message('guide', text + ' The contact form is currently a demonstration and does not send a request yet. No chat text is carried into the form.', handoffLinks);
  }
  function respond(value, chosen) {
    topicMenu.open = false; infoMenu.open = false;
    const result = chosen ? {kind: 'topic', topics: [chosen]} : classify(value, previous);
    message('visitor', result.kind === 'private' ? '[Contact or identifier details omitted]' : value);
    if (result.kind === 'unknown_coverage') {
      awaitingCoverageType = false; renderTopics();
      handoff('That’s okay—you don’t need to figure it out on your own. Erica can help you work out what coverage you currently have and which questions to address next. Please keep insurance card numbers and personal details out of this chat.');
      return;
    }
    if (result.kind === 'unsure' && !awaitingCoverageType) {
      message('guide', 'That’s okay. We can start small. Would you like help figuring out what coverage you have, understanding a bill, or getting started with Medicare?');
      return;
    }
    if (result.kind === 'coverage_loss') {
      const knownType = lossReply(value);
      if (knownType) { awaitingCoverageType = false; renderTopics(); message('guide', 'I’m sorry you’re dealing with that. ' + knownType.text, knownType.links); return; }
      awaitingCoverageType = true;
      message('guide', 'I’m sorry you’re dealing with that. Let’s take it one step at a time. Was the coverage through a job, a Medicare plan, Medicaid, or are you not sure? You don’t need to share any personal details.');
      renderLossChoices(); return;
    }
    if (awaitingCoverageType && !['private','urgent','handoff','specific'].includes(result.kind) && !chosen) {
      const reply = lossReply(value);
      if (reply) {
        awaitingCoverageType = false; renderTopics();
        message('guide', reply.text, reply.links);
        message('guide', 'Would you like help with another general question? You can also choose “Ask Erica for help.”');
        return;
      }
    }
    if (chosen) { awaitingCoverageType = false; renderTopics(); }
    if (result.kind === 'greeting') { message('guide', 'Hi! I’m glad you’re here. What’s been going on with your coverage, or what would you like to understand? We can start with just one question.'); return; }
    if (aiReady && optIn.checked && !['private', 'urgent', 'handoff', 'specific', 'unknown_coverage'].includes(result.kind)) {
      askAI(value); return;
    }
    if (result.kind === 'private') message('guide', 'Please keep identifying information out of this preview. It does not need your name, phone, email, Medicare number, or Social Security number. Try a general question, such as “I’m retiring soon.”');
    else if (result.kind === 'urgent') message('guide', 'This guide cannot help with an emergency. If you may be in immediate danger or need urgent medical help, call 911. For non-urgent medical concerns, contact a healthcare professional.');
    else if (result.kind === 'handoff') handoff('You can ask Erica for help with your situation.');
    else if (result.kind === 'specific') handoff('That question requires a review of your individual situation or coverage. This preview cannot determine eligibility, recommend a plan, or verify a benefit, provider, prescription, or claim. For an existing claim or bill, contact your plan or billing provider.');
    else if (result.kind === 'unknown') message('guide', awaitingCoverageType ? 'No problem. Which sounds closest: coverage through a job, a Medicare plan, Medicaid, or “I’m not sure”? You can open “Reply options” to choose an answer.' : 'Let’s narrow it down together. Are you getting started with Medicare, dealing with a coverage change, or trying to understand costs? This guided preview handles common situations; live AI answers aren’t connected yet.');
    else if (result.kind === 'followup') message('guide', 'I can point you to the guide for more detail, but this preview cannot answer a deeper follow-up yet. You can also choose another topic or ask Erica for help.', result.topics[0].links);
    else {
      previous = result.topics[0];
      result.topics.forEach(t => message('guide', t.text, t.links));
    }
  }
  async function askAI(value) {
    const current = ++generation;
    const controller = new AbortController(); activeRequest = controller;
    setBusy(true);
    const pending = message('guide', 'Checking official sources…');
    pending.dataset.aiPending = 'true';
    const timeout = setTimeout(() => controller.abort(), 40000);
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer',
        headers: {'Content-Type':'application/json'}, signal: controller.signal,
        body: JSON.stringify({messages: [...history.slice(-6).map(m => ({role:m.role,content:m.content.slice(0,1200)})), {role:'user', content:value}], consentVersion:'learning-ai-v1'})
      });
      if (!response.ok) throw new Error('unavailable');
      const data = await response.json();
      if (current !== generation) return;
      if (typeof data.answer !== 'string' || !data.answer.trim() || data.answer.length > 6000) throw new Error('invalid');
      const links = (Array.isArray(data.sources) ? data.sources : []).filter(s => {
        try { const u = new URL(s.url); return u.protocol === 'https:' && ['medicare.gov','cms.gov','ssa.gov','medicaid.gov','ecfr.gov'].some(d => u.hostname === d || u.hostname.endsWith('.'+d)); } catch (_) { return false; }
      }).slice(0,6).map(s => [String(s.title || 'Official source').slice(0,160), s.url]);
      pending.remove();
      message('guide', data.answer, links);
      if (data.handoff) handoff('This question needs a person to review your situation.');
      history = [...history, {role:'user',content:value}, {role:'assistant',content:data.answer}].slice(-6);
    } catch (_) {
      if (current !== generation) return;
      pending.remove();
      message('guide', 'AI answers are unavailable right now. No answer was generated here. You can turn off “Use AI answers” to browse guides, try again, or ask Erica for help.');
    } finally {
      clearTimeout(timeout);
      if (current === generation) { activeRequest = null; setBusy(false); input.focus({preventScroll:true}); }
    }
  }
  function reset() {
    generation++; if (activeRequest) activeRequest.abort(); activeRequest = null; history = []; setBusy(false);
    log.replaceChildren(); input.value = ''; resizeInput(); previous = null; awaitingCoverageType = false; topicMenu.open = false; renderTopics();
    message('guide', 'Hi, welcome! What brings you in today?');
  }
  function renderTopics() {
  updateTopicLabel();
  choices.replaceChildren();
  topics.forEach(t => {
    const b = node('button', 'lc-chip', t.label); b.type = 'button';
    b.addEventListener('click', () => { respond(t.label, t); input.focus({preventScroll:true}); });
    choices.append(b);
  });
  }
  function renderLossChoices() {
    updateTopicLabel();
    choices.replaceChildren();
    ['Through a job', 'A Medicare plan', 'Medicaid', 'I’m not sure'].forEach(label => {
      const b = node('button','lc-chip',label); b.type = 'button';
      b.addEventListener('click', () => { respond(label); input.focus({preventScroll:true}); });
      choices.append(b);
    });
  }
  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.shiftKey || e.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    if (!send.disabled) form.requestSubmit();
  }, true);
  form.addEventListener('submit', e => {
    e.preventDefault(); const value = input.value.trim(); if (!value) { input.focus(); return; }
    input.value = ''; resizeInput(); respond(value); input.focus({preventScroll:true});
  });
  host.querySelector('[data-chat-reset]').addEventListener('click', () => { reset(); input.focus({preventScroll:true}); });
  host.querySelector('[data-chat-handoff]').addEventListener('click', () => { handoff('Let’s make it easier to get personal assistance.'); input.focus({preventScroll:true}); });
  reset();
})();
