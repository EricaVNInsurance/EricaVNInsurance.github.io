const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const base = require('node:path').resolve(__dirname, '..');
const script = readFileSync(require('node:path').join(base, 'request-form.js'),'utf8');
const productionConfig = readFileSync(require('node:path').join(base, 'request-form-config.js'),'utf8');
const ids=['medicare-request','request-fields','phone','full-name','email','email-permission','preferred-time','time-zone','request-card','request-confirmation','request-submit','request-error','demo-title','demo-description','demo-banner','submit-note','phone-hint','request-next-heading','next-preview-note','zip','confirmation-badge','confirmation-heading','confirmation-message','schedule-option','receipt','schedule-link','state','topic','consent','consent-copy','consent-rights','email-consent-copy','back-to-form'];
function harness(config, reply=async()=>({ok:true,json:async()=>({accepted:true,requestId:'request_12345'})})) {
 const elements={}; const calls=[];
 for(const id of ids) elements[id]={id,value:'',textContent:id,hidden:false,disabled:false,checked:false,required:false,handlers:{},validity:'',addEventListener(t,f){this.handlers[t]=f},setCustomValidity(m){this.validity=m},focus(){this.focused=true},setAttribute(k,v){this[k]=v}};
 const form=elements['medicare-request'];
 form.reportValidity=()=>!Object.values(elements).some(x=>x.validity || x.required && (x.id.includes('permission')||x.id==='consent' ? !x.checked : !x.value));
 form.reset=()=>{for(const e of Object.values(elements)){e.value='';e.checked=false;}};
 elements['request-fields'].disabled=true; elements['request-confirmation'].hidden=true; elements['schedule-option'].hidden=true;
 const context={window:{ERICA_REQUEST_CONFIG:config,location:{pathname:'/design-preview/request-medicare-help.html'}},document:{getElementById:id=>elements[id]},URL,AbortController,crypto:require('node:crypto').webcrypto,setTimeout,clearTimeout,fetch:async(url,options)=>{calls.push({url,options});return reply(calls.length)}};
 vm.runInNewContext(script,context);
 function fill(){Object.assign(elements['full-name'],{value:'Taylor Morgan'});elements.phone.value='(202) 555-0147';elements.state.value='OR';elements.topic.value='benefits';elements.consent.checked=true;}
 return {elements,calls,fill,submit:()=>form.handlers.submit({preventDefault(){}})};
}
const preview={mode:'preview',liveIntakeApproved:false,submissionEndpoint:'https://should-not-send.invalid/intake',approvedSubmissionOrigin:'https://should-not-send.invalid',schedulingUrl:'https://calendar.invalid/erica',consentVersion:'v1',privacyVersion:'preview'};
const live={...preview,mode:'live',liveIntakeApproved:true,submissionEndpoint:'https://intake.invalid/request',approvedSubmissionOrigin:'https://intake.invalid',privacyVersion:'live'};
(async()=>{
 let tested=0;
 let h=harness(preview);h.fill();await h.submit();assert.equal(h.calls.length,0);assert.equal(h.elements['request-confirmation'].hidden,false);assert.equal(h.elements['schedule-option'].hidden,true);assert.match(h.elements['confirmation-message'].textContent,/No request was sent/);assert.equal(h.elements.phone.value,'');tested++;
 h=harness(undefined);assert.equal(h.elements['request-fields'].disabled,true);tested++;
 h=harness({...live,approvedSubmissionOrigin:'https://wrong.invalid'});assert.equal(h.elements['request-fields'].disabled,true);tested++;
 h=harness({...live,submissionEndpoint:'http://intake.invalid/request'});assert.equal(h.elements['request-fields'].disabled,true);tested++;
 h=harness(preview);h.fill();h.elements.phone.value='123';await h.submit();assert.equal(h.calls.length,0);assert.equal(h.elements['request-confirmation'].hidden,true);tested++;
 h=harness(preview);h.fill();h.elements['preferred-time'].value='morning';await h.submit();assert.equal(h.elements['request-confirmation'].hidden,true);assert.equal(h.elements['time-zone'].required,true);tested++;
 h=harness(preview);h.fill();h.elements['email-permission'].checked=true;await h.submit();assert.equal(h.elements['request-confirmation'].hidden,true);assert.equal(h.elements.email.required,true);tested++;
 h=harness(live);h.fill();await h.submit();let sent=JSON.parse(h.calls[0].options.body);assert.equal(sent.phone,'+12025550147');assert.equal(sent.smsPermission,false);assert.equal('medicareStatus' in sent,false);assert.equal(h.calls[0].options.credentials,'omit');assert.equal(h.calls[0].options.redirect,'error');assert.equal(h.elements['request-confirmation'].hidden,false);assert.equal(h.elements['receipt'].hidden,false);assert.equal(h.elements['schedule-option'].hidden,false);assert.equal(h.elements['schedule-link'].href,'https://calendar.invalid/erica');tested++;
 h=harness(live,async()=>({ok:true,json:async()=>({})}));h.fill();await h.submit();assert.equal(h.elements['request-confirmation'].hidden,true);assert.equal(h.elements.phone.value,'(202) 555-0147');assert.equal(h.elements['request-error'].hidden,false);tested++;
 h=harness(live,async()=>{throw new Error('timeout-after-save')});h.fill();await h.submit();await h.submit();assert.equal(h.calls[0].options.headers['Idempotency-Key'],h.calls[1].options.headers['Idempotency-Key']);h.elements.phone.value='2025550198';await h.submit();assert.notEqual(h.calls[1].options.headers['Idempotency-Key'],h.calls[2].options.headers['Idempotency-Key']);tested++;
 let release;h=harness(live,()=>new Promise(r=>release=r));h.fill();const first=h.submit();await h.submit();assert.equal(h.calls.length,1);release({ok:true,json:async()=>({accepted:true,requestId:'request_12345'})});await first;tested++;
 h=harness({...live,schedulingUrl:'javascript:alert(1)'});h.fill();await h.submit();assert.equal(h.elements['schedule-option'].hidden,true);tested++;
 h=harness(live,async()=>({ok:false,status:429}));h.fill();await h.submit();assert.match(h.elements['request-error'].textContent,/Too many attempts/);assert.equal(h.elements.phone.value,'(202) 555-0147');tested++;
 const configContext={window:{}};vm.runInNewContext(productionConfig,configContext);assert.equal(configContext.window.ERICA_REQUEST_CONFIG.mode,'preview');assert.equal(configContext.window.ERICA_REQUEST_CONFIG.liveIntakeApproved,false);assert.equal(configContext.window.ERICA_REQUEST_CONFIG.submissionEndpoint,null);tested++;
 assert.doesNotMatch(script,/localStorage|sessionStorage|indexedDB|sendBeacon/);tested++;
 console.log(`${tested} integration and guardrail checks passed. All network responses were mocked; no real submissions or stored records.`);
})().catch(e=>{console.error(e);process.exitCode=1});
