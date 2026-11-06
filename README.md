# Shock Tracker

A public form for submitting social-ecological shock reports to Supabase PostgreSQL. Researchers review submissions in the Supabase dashboard.

## Run locally

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. The website files are in the repository root. GitHub Pages publishes from `main`, `/ (root)`.

## Configuration

Set the project URL and public publishable key in `config.js`. Never add database passwords or secret keys to the website.

Map search and tile endpoints are configured in `map-config.mjs`. Photon search and OpenStreetMap tiles support a light pilot; use a dedicated provider for substantial traffic. Server-side spam protection is needed before broad promotion.

## Database

- `database/setup.sql`: initial schema for a new project; run once.
- `database/upgrade-v2.sql`: adds coordinates, causes, impacts, and reference excerpts to the initial schema; run once after setup.
- `database/check-permissions.sql`: verifies anonymous access restrictions and rolls back test records.

Existing projects with both migrations applied need no additional SQL. Historical hazard labels remain in `hazards`; new reports use `cause_categories`. Submissions enter with `review_status = pending`. Public visitors cannot read, update, delete, or approve reports.

## Validation

```sh
node check.mjs
```

Checks cover category choices, numeric coordinates, optional fields, reference URLs, and invalid input.

## Map data and licences

Place searches are sent to Photon; map tiles load from OpenStreetMap. Coordinates use WGS84 decimal latitude and longitude. Contributors can refine the pin or enter coordinates directly.

- [Photon](https://github.com/komoot/photon)
- [OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/)
- [Leaflet](https://leafletjs.com/)
- Lato font licence: `assets/Lato-OFL.txt`
