import { causes, impacts, scales } from "./categories.mjs";
export function coordinate(value, limit) {
  const text = String(value ?? "").trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text))
    throw Error(
      "Enter latitude and longitude as decimal numbers, without N, S, E, or W.",
    );
  const number = Number(text);
  if (!Number.isFinite(number) || Math.abs(number) > limit)
    throw Error(`Coordinates must be between -${limit} and ${limit}.`);
  return number;
}
export function payloadFrom(form) {
  const title = String(form.get("title") || "").trim();
  const location = String(form.get("location") || "").trim();
  const description = String(form.get("description") || "").trim();
  const selectedCauses = [...new Set(form.getAll("cause_categories"))];
  const selectedImpacts = [...new Set(form.getAll("impact_categories"))];
  const cause_origin = form.get("cause_origin");
  const impact_scale = form.get("impact_scale");
  const cause_description = String(form.get("cause_description") || "").trim();
  const reference_excerpt = String(form.get("reference_excerpt") || "").trim();
  const latitude = coordinate(form.get("latitude"), 90);
  const longitude = coordinate(form.get("longitude"), 180);
  const sources = [
    ...new Set(
      String(form.get("sources") || "")
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean),
    ),
  ];
  const date = String(form.get("event_date") || "");
  if (title.length < 3 || title.length > 200)
    throw Error("Enter a title of 3–200 characters.");
  if (!location || location.length > 300)
    throw Error("Enter an affected location of up to 300 characters.");
  if (description.length < 20 || description.length > 5000)
    throw Error("Enter a description of 20–5,000 characters.");
  if (!selectedCauses.length || selectedCauses.some((x) => !causes.includes(x)))
    throw Error("Select at least one cause from the dropdown.");
  if (
    !selectedImpacts.length ||
    selectedImpacts.some((x) => !impacts.includes(x))
  )
    throw Error("Select at least one impact from the dropdown.");
  if (!["Natural", "Human", "Both"].includes(cause_origin))
    throw Error("Select Natural, Human, or Both.");
  if (!scales.includes(impact_scale))
    throw Error("Select the scale of impact.");
  if (cause_description.length > 5000 || reference_excerpt.length > 10000)
    throw Error(
      "Cause descriptions allow 5,000 characters; reference excerpts allow 10,000.",
    );
  if (!sources.length || sources.length > 10)
    throw Error("Provide between 1 and 10 reference links.");
  for (const source of sources) {
    let url;
    try {
      url = new URL(source);
    } catch {
      throw Error("Each reference must be a full http:// or https:// link.");
    }
    if (
      !/^https?:\/\/\S+$/i.test(source) ||
      !["http:", "https:"].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password ||
      source.length > 2000
    )
      throw Error(
        "Use http:// or https:// links without credentials, up to 2,000 characters each.",
      );
  }
  if (
    date &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date)
  )
    throw Error("Enter a valid date or leave it blank.");
  return {
    title,
    location,
    description,
    sources,
    event_date: date || null,
    schema_version: 2,
    latitude,
    longitude,
    cause_origin,
    cause_categories: selectedCauses,
    impact_categories: selectedImpacts,
    impact_scale,
    cause_description: cause_description || null,
    reference_excerpt: reference_excerpt || null,
  };
}
