export const hazards = ['Earthquake', 'Tsunami', 'Flood', 'Landslide', 'Storm', 'Volcanic eruption', 'Wildfire', 'Drought', 'Extreme heat', 'Extreme cold', 'Other'];
export function payloadFrom(form) {
  const title = String(form.get('title') || '').trim();
  const location = String(form.get('location') || '').trim();
  const description = String(form.get('description') || '').trim();
  const selected = [...new Set(form.getAll('hazards'))];
  const sources = [...new Set(String(form.get('sources') || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean))];
  const date = String(form.get('event_date') || '');
  if (title.length < 3 || title.length > 200) throw Error('Enter a title of 3–200 characters.');
  if (!location || location.length > 300) throw Error('Enter an affected location of up to 300 characters.');
  if (description.length < 20 || description.length > 5000) throw Error('Enter a description of 20–5,000 characters.');
  if (!selected.length || selected.some(x => !hazards.includes(x))) throw Error('Select at least one hazard type.');
  if (!sources.length || sources.length > 10) throw Error('Provide between 1 and 10 reference links.');
  for (const source of sources) {
    let url; try { url = new URL(source); } catch { throw Error('Each reference must be a full http:// or https:// link.'); }
    if (!/^https?:\/\/\S+$/i.test(source) || !['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password || source.length > 2000) throw Error('Use http:// or https:// links without credentials, up to 2,000 characters each.');
  }
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date)) throw Error('Enter a valid date or leave it blank.');
  return {title, location, description, hazards:selected, sources, event_date:date || null};
}
