(() => {
  'use strict';
  const form = document.getElementById('medicare-request');
  if (!form) return;
  const byId = id => document.getElementById(id);
  const config = window.ERICA_REQUEST_CONFIG;
  const fields = byId('request-fields');
  const phone = byId('phone');
  const fullName = byId('full-name');
  const email = byId('email');
  const emailPermission = byId('email-permission');
  const preferredTime = byId('preferred-time');
  const timeZone = byId('time-zone');
  const card = byId('request-card');
  const confirmation = byId('request-confirmation');
  const submit = byId('request-submit');
  const error = byId('request-error');
  let busy = false;
  let pendingKey = null;
  let pendingBody = null;
  const safeHttpsUrl = value => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password ? url : null;
    } catch { return null; }
  };
  const showError = message => {
    error.textContent = message;
    error.hidden = false;
    error.focus();
  };
  const clearError = () => { error.textContent = ''; error.hidden = true; };
  const isPreview = config && config.mode === 'preview';
  const endpoint = config && safeHttpsUrl(config.submissionEndpoint);
  const liveReady = config && config.mode === 'live' && config.liveIntakeApproved === true &&
    endpoint && endpoint.origin === config.approvedSubmissionOrigin;
  // No missing/invalid configuration can accidentally enable a live request.
  if (!isPreview && !liveReady) {
    form.addEventListener('submit', event => event.preventDefault());
    byId('demo-title').textContent = 'Requests are temporarily unavailable.';
    byId('demo-description').textContent = 'Please return later. This form cannot send requests right now.';
    showError('This form is not accepting requests right now. Please return later.');
    return;
  }
  fields.disabled = false;
  if (liveReady) {
    byId('demo-banner').hidden = true;
    submit.textContent = 'Request a call';
    byId('submit-note').textContent = 'This request does not enroll you in a plan or book an appointment.';
    byId('phone-hint').textContent = 'Enter the U.S. phone number where you would like Erica to call.';
    byId('request-next-heading').textContent = 'What happens next?';
    byId('next-preview-note').hidden = true;
    fullName.autocomplete = 'name';
    phone.autocomplete = 'tel';
    email.autocomplete = 'email';
    byId('zip').autocomplete = 'postal-code';
  }
  // Time-zone preferences do not assume a zone from the state (some states have several).
  preferredTime.addEventListener('change', () => { timeZone.required = Boolean(preferredTime.value); });
  emailPermission.addEventListener('change', () => { email.required = emailPermission.checked; });
  phone.addEventListener('input', () => phone.setCustomValidity(''));
  fullName.addEventListener('input', () => fullName.setCustomValidity(''));
  const showConfirmation = requestId => {
    card.hidden = true;
    confirmation.hidden = false;
    byId('schedule-option').hidden = true;
    byId('receipt').hidden = true;
    if (isPreview) {
      byId('confirmation-badge').textContent = 'Preview complete';
      byId('confirmation-heading').textContent = 'You’ve tried the form.';
      byId('confirmation-message').textContent = 'No request was sent and no information was saved. No call or appointment has been requested.';
    } else {
      byId('confirmation-badge').textContent = 'Request received';
      byId('confirmation-heading').textContent = 'Thank you. Your request was received.';
      byId('confirmation-message').textContent = 'Erica will follow up about your request using the contact details and permissions you provided. You have not enrolled in a plan, changed your coverage, or booked an appointment.';
      byId('receipt').textContent = 'Request reference: ' + requestId;
      byId('receipt').hidden = false;
      const schedule = safeHttpsUrl(config.schedulingUrl);
      if (schedule) {
        byId('schedule-link').href = schedule.href;
        byId('schedule-option').hidden = false;
      }
    }
    form.reset();
    email.required = false;
    timeZone.required = false;
    confirmation.focus();
  };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    clearError();
    const digits = phone.value.replace(/\D/g, '');
    const nationalPhone = digits.length === 11 && digits[0] === '1' ? digits.slice(1) : digits;
    phone.setCustomValidity(/^[2-9]\d{2}[2-9]\d{6}$/.test(nationalPhone) ? '' : 'Enter a 10-digit U.S. phone number, with an optional leading 1.');
    fullName.setCustomValidity(fullName.value.trim() ? '' : 'Enter your first and last name.');
    email.required = emailPermission.checked;
    timeZone.required = Boolean(preferredTime.value);
    if (!form.reportValidity()) return;
    if (isPreview) {
      showConfirmation(null);
      return;
    }
    const body = {
      schemaVersion: 1,
      fullName: fullName.value.trim(),
      phone: '+1' + nationalPhone,
      email: email.value.trim() || null,
      state: byId('state').value,
      zip: byId('zip').value.trim() || null,
      topic: byId('topic').value,
      preferredTime: preferredTime.value || null,
      timeZone: timeZone.value || null,
      phonePermission: byId('consent').checked,
      emailPermission: emailPermission.checked,
      smsPermission: false,
      consentVersion: config.consentVersion,
      consentText: [byId('consent-copy').textContent, byId('consent-rights').textContent].join(' ').replace(/\s+/g, ' ').trim(),
      emailPermissionText: byId('email-consent-copy').textContent.replace(/\s+/g, ' ').trim(),
      privacyVersion: config.privacyVersion,
      sourcePath: window.location.pathname
    };
    const serialized = JSON.stringify(body);
    if (serialized !== pendingBody) {
      pendingBody = serialized;
      pendingKey = crypto.randomUUID();
    }
    busy = true;
    fields.disabled = true;
    form.setAttribute('aria-busy', 'true');
    submit.textContent = 'Sending your request…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(endpoint.href, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': pendingKey },
        body: serialized,
        signal: controller.signal
      });
      if (!response.ok) throw new Error(response.status === 429 ? 'rate-limit' : 'not-accepted');
      const receipt = await response.json();
      if (receipt.accepted !== true || typeof receipt.requestId !== 'string' || !/^[A-Za-z0-9_-]{8,80}$/.test(receipt.requestId)) {
        throw new Error('invalid-receipt');
      }
      showConfirmation(receipt.requestId);
      pendingKey = null;
      pendingBody = null;
    } catch (failure) {
      // A timeout may occur after a server save. Keep the same key for an unchanged retry.
      showError(failure.message === 'rate-limit'
        ? 'Too many attempts right now. Please wait a few minutes and try again. Your details are still here.'
        : 'We couldn’t confirm receipt of your request. Your details are still here. Please try again.');
    } finally {
      clearTimeout(timeout);
      busy = false;
      fields.disabled = false;
      form.setAttribute('aria-busy', 'false');
      submit.textContent = 'Request a call';
    }
  });
  byId('back-to-form').addEventListener('click', () => {
    confirmation.hidden = true;
    card.hidden = false;
    clearError();
    fullName.focus();
  });
})();
