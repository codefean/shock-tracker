import assert from "node:assert/strict";
import { payloadFrom, coordinate } from "./validation.mjs";
import { causes, impacts, scales } from "./categories.mjs";
function sample(overrides = {}) {
  const data = new FormData();
  const fields = {
    title: "Test shock report",
    location: "Stockholm Resilience Center",
    description: "A test report for validating new shock fields.",
    sources: "https://example.org/report\nhttps://example.org/report",
    event_date: "2024-02-29",
    latitude: "59.354554337368825",
    longitude: "18.055187026593714",
    cause_origin: "Both",
    cause_categories: ["Floods/Flash Floods", "Policy/Political statement"],
    impact_categories: ["Ecosystems", "Trade"],
    impact_scale: scales[0],
    cause_description: "Test cause explanation",
    reference_excerpt: "Test excerpt — https://example.org/report",
    ...overrides,
  };
  for (const [k, v] of Object.entries(fields))
    for (const x of Array.isArray(v) ? v : [v]) data.append(k, x);
  return data;
}
const payload = payloadFrom(sample());
assert.equal(payload.latitude, 59.354554337368825);
assert.equal(payload.longitude, 18.055187026593714);
assert.equal(typeof payload.latitude, "number");
assert.equal(payload.schema_version, 2);
assert.equal(payload.sources.length, 1);
assert.deepEqual(payload.cause_categories, [
  "Floods/Flash Floods",
  "Policy/Political statement",
]);
assert.equal(
  payloadFrom(
    sample({ event_date: "", cause_description: "", reference_excerpt: "" }),
  ).event_date,
  null,
);
assert.equal(
  payloadFrom(sample({ cause_categories: [causes[0], causes[0]] }))
    .cause_categories.length,
  1,
);
assert.equal(
  payloadFrom(sample({ latitude: "0", longitude: "0" })).latitude,
  0,
);
assert.equal(
  payloadFrom(sample({ latitude: "-90", longitude: "-180" })).longitude,
  -180,
);
assert.equal(
  payloadFrom(sample({ latitude: "90", longitude: "180" })).latitude,
  90,
);
for (const c of causes)
  assert.deepEqual(
    payloadFrom(sample({ cause_categories: [c] })).cause_categories,
    [c],
  );
for (const i of impacts)
  assert.deepEqual(
    payloadFrom(sample({ impact_categories: [i] })).impact_categories,
    [i],
  );
for (const s of scales)
  assert.equal(payloadFrom(sample({ impact_scale: s })).impact_scale, s);
for (const change of [
  { latitude: "" },
  { longitude: "" },
  { latitude: "91" },
  { longitude: "181" },
  { latitude: "NaN" },
  { longitude: "Infinity" },
  { latitude: "59N" },
  { longitude: "18 E" },
  { latitude: "1e2" },
  { latitude: "59,35" },
  { cause_categories: [] },
  { cause_categories: ["Invalid"] },
  { impact_categories: [] },
  { impact_categories: ["Invalid"] },
  { cause_origin: "" },
  { impact_scale: "" },
  { cause_description: "x".repeat(5001) },
  { reference_excerpt: "x".repeat(10001) },
  { sources: "javascript:alert(1)" },
  { sources: "https://user:pass@example.org" },
  { sources: "" },
  { event_date: "2023-02-29" },
  { title: "  " },
  { description: "short" },
])
  assert.throws(
    () => payloadFrom(sample(change)),
    JSON.stringify(change).slice(0, 100),
  );
assert.equal(coordinate(" +18.5 ", 180), 18.5);
console.log(
  "PASS: coordinates, numeric precision, all 31 causes / 10 impacts / 4 scales, optional fields, multi-select, and 24 invalid-input cases.",
);
