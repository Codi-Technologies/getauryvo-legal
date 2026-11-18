(() => {
  const form = document.getElementById('support-form');
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById('support-status');
  let pending = null;
  button.disabled = false;

  function announce(message, state) {
    status.textContent = message;
    status.dataset.state = state;
    status.hidden = false;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    const signature = JSON.stringify(values);
    // Preserve the request ID across uncertain network failures; an edited message is a new request.
    if (!pending || pending.signature !== signature) {
      pending = { signature, id: crypto.randomUUID() };
    }
    button.disabled = true;
    button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    announce('Sending your message…', 'pending');
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Public website key, not the private Resend or service-role credential.
          apikey: 'sb_publishable_9F74tf_Cuao1Y4aHc9ctQA_D8ZB8bGr',
          Authorization: 'Bearer sb_publishable_9F74tf_Cuao1Y4aHc9ctQA_D8ZB8bGr',
        },
        body: JSON.stringify({ ...values, requestId: pending.id }),
        signal: AbortSignal.timeout(25000),
        credentials: 'omit',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) {
        if (response.status === 429) throw new Error('You’ve sent several messages recently. Please try again in an hour, or email hello@getauryvo.com.');
        if (response.status === 422) throw new Error('Please check your email and enter a message between 10 and 4,000 characters.');
        if (response.status === 409) pending = null;
        throw new Error('Your message couldn’t be sent. Please try again, or email hello@getauryvo.com.');
      }
      form.reset();
      pending = null;
      announce('Message sent to Auryvo Support, with a copy to our technical support team. We’ll reply to the email you provided.', 'success');
      status.focus();
    } catch (error) {
      const message = error.name === 'TimeoutError' || error.name === 'TypeError'
        ? 'We couldn’t confirm your message was sent. Please try again; retrying the same message won’t send a duplicate. You can also email hello@getauryvo.com.'
        : error.message;
      announce(message, 'error');
      status.focus();
    } finally {
      button.disabled = false;
      button.textContent = 'Send message';
      form.removeAttribute('aria-busy');
    }
  });
})();
