import {config} from './config.js';
import {causes, impacts, scales} from './categories.mjs';
import {payloadFrom} from './validation.mjs?v=2';
import {setupLocation} from './location.mjs?v=2';
const form = document.querySelector('form');
const button = document.querySelector('#submit');
const message = document.querySelector('#message');
for (const [prefix, name, choices] of [['cause','cause_categories',causes],['impact','impact_categories',impacts]]) {
  const options = document.querySelector(`#${prefix}-options`);
  function updateSelection() {
    const selected = [...options.querySelectorAll('input:checked')].map(input=>input.value);
    document.querySelector(`#${prefix}-dropdown .selection-count`).textContent = `${selected.length} selected`;
    document.querySelector(`#${prefix}-selected`).textContent = selected.join(' · ');
  }
  for (const choice of choices) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type='checkbox'; input.name=name; input.value=choice;
    input.addEventListener('change', updateSelection);
    label.append(input,document.createTextNode(choice)); options.append(label);
  }
  form.addEventListener('reset', () => {document.querySelector(`#${prefix}-dropdown`).open=false; setTimeout(updateSelection,0);});
}
for (const scale of scales) form.elements.impact_scale.add(new Option(scale,scale));
const projectUrl = config.supabaseUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/,'');
const key = config.publishableKey.trim();
const ready = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(projectUrl) && key.startsWith('sb_publishable_');
button.disabled = !ready;
if (!ready) document.querySelector('#setup').textContent='Preview only — the Supabase project URL and publishable key must be configured.';
setupLocation(form);
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!ready || button.disabled) return;
  message.textContent=''; message.dataset.error='false';
  try {
    const payload = payloadFrom(new FormData(form));
    button.disabled=true; message.textContent='Sending your report…';
    const response = await fetch(`${projectUrl}/rest/v1/shock_submissions`, {
      method:'POST',headers:{apikey:key,'Content-Type':'application/json',Prefer:'return=minimal'},
      body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)
    });
    if (!response.ok) throw Error(`The database did not accept this report (HTTP ${response.status}). Your entries are still here. Please contact the research team if this continues.`);
    form.reset(); message.textContent='Thank you. Your report has been submitted for researcher review.';
  } catch(error) {
    message.dataset.error='true';
    message.textContent=['TypeError','TimeoutError','AbortError'].includes(error.name)
      ? 'We could not confirm delivery. Your entries are still here. Retrying may create a duplicate if the first report arrived.' : error.message;
  } finally {button.disabled=false; message.focus();}
});
