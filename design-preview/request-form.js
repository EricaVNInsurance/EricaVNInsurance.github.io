(() => {
  const form = document.getElementById('medicare-request');
  if (!form) return;
  const fields = document.getElementById('request-fields');
  const phone = document.getElementById('phone');
  const fullName = document.getElementById('full-name');
  const card = document.getElementById('request-card');
  const confirmation = document.getElementById('confirmation-preview');
  fields.disabled = false;

  // Preview only: never transmit or persist entered information.
  form.addEventListener('submit', event => event.preventDefault());
  phone.addEventListener('input', () => phone.setCustomValidity(''));
  fullName.addEventListener('input', () => fullName.setCustomValidity(''));
  document.getElementById('preview-confirmation').addEventListener('click', () => {
    const digits = phone.value.replace(/\D/g, '');
    phone.setCustomValidity((digits.length === 10 || (digits.length === 11 && digits[0] === '1')) ? '' : 'Enter a 10-digit U.S. phone number, with an optional leading 1.');
    fullName.setCustomValidity(fullName.value.trim() ? '' : 'Enter a name for this preview.');
    if (!form.reportValidity()) return;
    form.reset();
    card.hidden = true;
    confirmation.hidden = false;
    confirmation.focus();
  });
  document.getElementById('back-to-form').addEventListener('click', () => {
    confirmation.hidden = true;
    card.hidden = false;
    fullName.focus();
  });
})();
