# Shock Tracker v2

Adds a place search and draggable map pin, numeric latitude/longitude, Natural/Human/Both origin, all 31 supplied cause categories, 10 impact categories, four impact scales, cause description, and pasted reference excerpts.

## Upgrade order

1. In your existing Supabase project's SQL Editor, run `database/upgrade-v2.sql` once. Do **not** rerun the original `setup.sql`. The upgrade is transactional and preserves existing records. A repeat attempt fails rather than resetting data.
2. Upload the contents of `docs/` to the GitHub Pages publishing directory. This project's current Pages source is **main / (root)**, so the files belong in the repository root. The repository also has a docs copy; keep it synchronized. Keep the working public Supabase values in `config.js`.
3. Wait for deployment and open the site. The header should say **v2**.
4. Search for Juneau, Alaska; choose a result; adjust the pin; complete the dropdowns and fields; submit a clearly labeled test report.
5. In Supabase Table Editor, check the new row's `latitude`, `longitude`, `cause_origin`, `cause_categories`, `impact_categories`, `impact_scale`, `cause_description`, and `reference_excerpt`. Review status should remain pending.

The migration keeps the old `hazards` column for historical rows. New reports use `cause_categories` and `schema_version = 2`. Old clients still work during rollout. Existing reports are not automatically assigned causes or coordinates. No new public SELECT, UPDATE, DELETE or approval access is granted.

## Field behavior

- Causes and impacts are expandable dropdowns with checkboxes. Multiple choices remain selected when the dropdown closes.
- Origin and impact scale are single-choice dropdowns. The complete cause list remains available for every origin: the categories themselves can have natural or human triggers.
- Cause description and reference excerpt are optional. Event date remains optional. Other fields are required.
- Coordinates are WGS84 latitude and longitude stored separately as PostgreSQL double precision numbers. The UI accepts decimal numbers only; no N/S/E/W. The user's sample `59.354554337368825, 18.055187026593714` is retained as numeric values without deliberate rounding. More digits do not imply survey-grade accuracy.
- Search gives candidate locations; users must check and adjust the point. A single point represents a location, not the full footprint of a widespread shock.
- Editing the location name clears the prior coordinates and pin. Direct coordinate entry works without a map or search response.
- Pasted excerpts are plain text, never interpreted as HTML. Reference URLs remain in the separate sources array; contributors are asked to identify the excerpt's source URL.

## Map service limits

Leaflet 1.9.4 is loaded from jsDelivr. Search uses Photon's public demo service with an explicit Search button, short per-browser cooldown, cancellation of stale requests, and a session cache. Map tiles use OpenStreetMap with visible attribution and ordinary browser caching. Search text goes to Photon and tile requests go to OpenStreetMap; no device geolocation is requested.

These services are suitable for a light pilot, not a guaranteed global production service. For substantial traffic, choose a hosted or self-hosted Photon-compatible search endpoint and an appropriate tile provider in `docs/map-config.mjs`. Do not use public Nominatim for autocomplete. Existing direct anonymous submissions still need server-side anti-spam measures before broad promotion.

- Photon usage and API: https://github.com/komoot/photon
- OpenStreetMap tile policy: https://operations.osmfoundation.org/policies/tiles/
- Leaflet: https://leafletjs.com/

## Checks

Run `node check.mjs` for form validation. Database behavior was tested locally with PostgreSQL via PGlite: historical row preservation, v2 inserts, numeric coordinates, invalid-field rejection, and anonymous permission restrictions. This local check does not replace verifying the real Supabase deployment.

The browser preview was used to check real Juneau search results and multiple checkbox selections. Full browser submissions require the live migration.
