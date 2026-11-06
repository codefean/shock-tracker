import {coordinate} from './validation.mjs?v=2';
import {mapConfig} from './map-config.mjs';
export function setupLocation(form) {
  const location = form.elements.location;
  const lat = form.elements.latitude;
  const lon = form.elements.longitude;
  const status = document.querySelector('#map-status');
  const results = document.querySelector('#search-results');
  const search = document.querySelector('#search');
  let map, marker, controller, requestId = 0, lastSearch = 0;
  const cache = new Map();
  if (window.L) {
    map = L.map('map').setView([25, 0], 2);
    L.tileLayer(mapConfig.tilesUrl, {maxZoom:19, attribution:mapConfig.attribution}).addTo(map);
    map.on('click', e => place(e.latlng.lat, e.latlng.wrap().lng));
  } else {
    status.textContent = 'The map could not load. You can still search and enter coordinates manually.';
  }
  function place(latitude, longitude, move = false) {
    lat.value = String(latitude); lon.value = String(longitude);
    if (!map) return;
    if (!marker) {
      marker = L.marker([latitude,longitude], {draggable:true, title:'Event location: drag to adjust',
        icon:L.divIcon({className:'pin-icon',html:'<span></span>',iconSize:[26,32],iconAnchor:[13,30]})}).addTo(map);
      marker.on('dragend', () => { const pos = marker.getLatLng().wrap(); place(pos.lat,pos.lng); });
    } else marker.setLatLng([latitude,longitude]);
    if (move) map.setView([latitude,longitude], 12);
  }
  function clearPoint() {
    lat.value = ''; lon.value = '';
    if (marker) {marker.remove(); marker = null;}
  }
  function cancelSearch() { requestId++; controller?.abort(); results.replaceChildren(); }
  location.addEventListener('input', () => {cancelSearch(); clearPoint(); status.textContent = 'Location changed. Search again or enter coordinates for this location.';});
  for (const field of [lat,lon]) field.addEventListener('input', () => {
    try {place(coordinate(lat.value,90),coordinate(lon.value,180),true);}
    catch {if (marker) {marker.remove(); marker=null;}}
  });
  location.addEventListener('keydown', e => {if(e.key === 'Enter') {e.preventDefault(); search.click();}});
  search.addEventListener('click', async () => {
    const query = location.value.trim();
    if (query.length < 3) {status.textContent = 'Enter at least 3 characters to search.'; return;}
    cancelSearch();
    const id = requestId;
    if (Date.now() - lastSearch < 1200) {status.textContent = 'Please wait a moment before searching again.'; return;}
    lastSearch = Date.now();
    search.disabled = true;
    status.textContent = 'Searching places…';
    controller = new AbortController();
    const timeout = setTimeout(() => controller?.abort(), 12000);
    try {
      let features = cache.get(query.toLowerCase());
      if (!features) {
        const url = new URL(mapConfig.searchUrl);
        url.search = new URLSearchParams({q:query,limit:'5',lang:'en'});
        const response = await fetch(url, {signal:controller.signal});
        if (!response.ok) throw Error('Search unavailable');
        const data = await response.json();
        if (!Array.isArray(data.features)) throw Error('Invalid search response');
        features = data.features.filter(f => f.geometry?.type === 'Point' && Number.isFinite(f.geometry.coordinates[0]) && Math.abs(f.geometry.coordinates[0]) <= 180 && Number.isFinite(f.geometry.coordinates[1]) && Math.abs(f.geometry.coordinates[1]) <= 90);
        cache.set(query.toLowerCase(),features);
      }
      if (id !== requestId) return;
      status.textContent = features.length ? 'Choose a result, then adjust the pin to the event location.' : 'No places found. Try adding a country, or place the pin / enter coordinates manually.';
      for (const feature of features) {
        const props = feature.properties || {};
        const label = [...new Set([props.name,props.street,props.city,props.state,props.country].filter(Boolean))].join(', ') || query;
        const option = document.createElement('button');
        option.type = 'button'; option.textContent = label;
        option.addEventListener('click', () => {
          location.value = label.slice(0,300);
          place(feature.geometry.coordinates[1],feature.geometry.coordinates[0],true);
          results.replaceChildren(); status.textContent = 'Location selected. Check the pin and drag it to the exact event location.';
        });
        results.append(option);
      }
    } catch {if (id === requestId) status.textContent = 'Place search is unavailable. Try again later, click the map, or enter coordinates manually.';}
    finally {clearTimeout(timeout); search.disabled = false;}
  });
  form.addEventListener('reset', () => {cancelSearch(); clearPoint(); status.textContent=''; if(map) map.setView([25,0],2);});
}
