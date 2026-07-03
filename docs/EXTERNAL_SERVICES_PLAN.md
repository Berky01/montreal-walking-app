# External Services Plan

## Runtime Services

The app must boot with no external runtime services:

- `DATA_SOURCE=mock`
- `NEXT_PUBLIC_MAP_STYLE_URL=""`
- `NEXT_PUBLIC_MAP_PROVIDER="fallback"`
- `ISSUE_REPORT_STORE_PATH="runtime/issue-reports.json"`
- `ROUTING_PROVIDER=none`
- `ENABLE_EXTERNAL_IMPORTS=false`
- `AI_PROVIDER=none`

The first optional runtime service is a MapLibre-compatible style URL. If it is missing, the app uses the local fallback map; if MapLibre style or tile loading is unavailable, the fallback map renders route geometry and markers.

## Build/Admin Services

Routing engines, Overpass, Wikidata, Montreal open data, and Wikimedia Commons are allowed only in admin/import/build flows. Public page render must read stored provider data, not call external import APIs.

## Database

Postgres/PostGIS remains optional:

- `DATA_SOURCE=postgres`
- `DATABASE_URL=...`

Do not enable this in production until provider queries, migrations, seed scripts, backups, and restore drills are implemented.

## AI

AI is a future boundary only:

- `AI_PROVIDER=none|openai`
- `AI_API_KEY`
- `ENABLE_AI_SEARCH=false`

Current search remains deterministic.

## API Boundary

Public read endpoints stay provider-backed. Admin endpoints return 404 unless `ENABLE_ADMIN_TOOLS=true`; admin write-style endpoints remain read-only unless `ENABLE_ADMIN_WRITE_ACTIONS=true`.

Current additions:

- `GET /api/places/nearby`
- `GET /api/admin/issues`
- `POST /api/admin/validate-data`
- `POST /api/admin/routes/build-geometry`
