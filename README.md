# Shock Tracker

A public form for submitting social-ecological shock reports to Supabase PostgreSQL. Researchers review submissions in the Supabase dashboard.

## Database

- `database/setup.sql`: initial schema for a new project; run once.
- `database/upgrade-v2.sql`: adds coordinates, causes, impacts, and reference excerpts to the initial schema; run once after setup.
- `database/check-permissions.sql`: verifies anonymous access restrictions and rolls back test records.

Existing projects with both migrations applied need no additional SQL. Historical hazard labels remain in `hazards`; new reports use `cause_categories`. Submissions enter with `review_status = pending`. Public visitors cannot read, update, delete, or approve reports.


