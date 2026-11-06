import assert from 'node:assert/strict';
import {payloadFrom} from './docs/validation.mjs';
function sample(overrides={}) {
 const data = new FormData();
 const values = {title:'Flood and landslide', location:'Test region, country',description:'A test description of a multi-hazard event.',hazards:['Flood','Landslide'],sources:'https://example.org/report\nhttps://example.org/report',event_date:'2024-02-29',...overrides};
 for(const [key,value] of Object.entries(values)) for(const item of Array.isArray(value)?value:[value]) data.append(key,item);
 return data;
}
assert.deepEqual(payloadFrom(sample()).hazards,['Flood','Landslide']);
assert.equal(payloadFrom(sample()).sources.length,1);
assert.equal(payloadFrom(sample({event_date:''})).event_date,null);
for(const change of [{hazards:[]},{hazards:['Invalid']},{sources:'javascript:alert(1)'},{sources:'https://name:password@example.org'},{sources:''},{description:'short'},{event_date:'2023-02-29'},{title:'  '}]) assert.throws(()=>payloadFrom(sample(change)));
console.log('Passed: multi-hazard payload, source deduplication, unknown date, and 8 invalid-input cases.');
