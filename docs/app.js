import { config } from './config.js';
import { hazards, payloadFrom } from './validation.mjs';
const form = document.querySelector('form');
const button = document.querySelector('#submit');
const message = document.querySelector('#message');
for (const hazard of hazards) {
  const label = document.createElement('label');
  const input = document.createElement('input');
  input.type = 'checkbox'; input.name = 'hazards'; input.value = hazard;
  label.append(input, document.createTextNode(hazard));
  document.querySelector('#hazards').append(label);
}
const ready = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl) && config.publishableKey.startsWith('sb_publishable_');
button.disabled = !ready;
if (!ready) document.querySelector('#setup').textContent = 'Preview only — submissions will open once the research database is connected.';
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!ready || button.disabled) return;
  message.textContent = ''; message.dataset.error = 'false';
  try {
    const payload = payloadFrom(new FormData(form));
    button.disabled = true;
    message.textContent = 'Sending your report…';
    const response = await fetch(`${config.supabaseUrl}/rest/v1/shock_submissions`, {
      method: 'POST', headers: {'apikey':config.publishableKey, 'Content-Type':'application/json', 'Prefer':'return=minimal'},
      body: JSON.stringify(payload), signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) throw Error(`The database did not accept this report (HTTP ${response.status}). Your entries are still here. Please try again later.`);
    form.reset();
    message.textContent = 'Thank you. Your report has been submitted for researcher review.';
  } catch (error) {
    message.dataset.error = 'true';
    message.textContent = ['TypeError', 'TimeoutError', 'AbortError'].includes(error.name)
      ? 'We could not confirm delivery. Your entries are still here. Retrying may create a duplicate if the first report arrived.'
      : error.message;
  } finally { button.disabled = false; message.focus(); }
});
