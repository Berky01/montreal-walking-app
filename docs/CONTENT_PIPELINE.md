# Content Pipeline

## Public Content Boundary

Public pages and public API defaults use the shared public-readiness helpers in `lib/data/public-content.ts`. The default `getRoutes()`, `getPlaces()`, detail lookups, route GeoJSON, nearby places, and route search exports only return public-ready records. Admin, validation, and import tooling must use `getAllRoutes()` and `getAllPlaces()` when they intentionally need the full internal catalog.

Public routes require ready MVP content, verified editorial source quality, valid walking geometry, sane walking distance, safety/accessibility notes, media metadata, and stops that resolve only to public places. Generated, review-only, draft, regional, day-trip, bike-oriented, or overlong route records stay internal by default.

Public places require ready MVP content, verified editorial source quality, valid coordinates, safety/accessibility notes, source attribution, and media metadata. Generated discovery places with `Place.discovery` metadata stay internal by default.

The current public Montreal MVP is the curated set of 12 routes and 60 places. The expanded discovery catalog remains available to admin/validation flows as internal review material.

Issue reports from the public report form post to `/api/report-issue`, validate against published route/place/stop context, apply a lightweight honeypot/rate-limit guard, and are kept in the mock provider's in-process review queue. The form also keeps a local browser copy when storage is available. A durable database-backed report store is still required before switching away from `DATA_SOURCE=mock`.

`npm run validate:content` runs the catalog validators plus public crawl-manifest checks. It should pass before deploys and after content edits.

## Content States

Curated MVP records use `contentStatus="ready"` with verified editorial source metadata. This means the records are complete enough for MVP public rendering and validation, not final field-published editorial content. Generated discovery records stay review-labeled and are not public content.

## Import Sources

Planned dry-run sources:

- OpenStreetMap/Overpass for candidate POIs and paths
- Wikidata for structured references
- Montreal open data for municipal datasets
- Wikimedia Commons for licensed media candidates

## Import Rules

- Dry run is the default.
- External imports write review candidates, not public content.
- Dedupe by slug, name, coordinate proximity, and source IDs.
- Preserve source attribution on every candidate.
- Never overwrite curated content without an explicit future `--force` flow.
- Do not run large imports by default.

## Current Scripts

- `scripts/sync-pois.ts`
- `scripts/sync-routes.ts`
- `scripts/import/osm-overpass.ts`
- `scripts/import/wikidata.ts`
- `scripts/import/montreal-open-data.ts`
- `scripts/import/normalize-places.ts`
- `scripts/import/wikimedia-commons.ts`
- `scripts/import/dedupe-places.ts`
- `scripts/import/review-queue.ts`

The legacy `scripts/import/*` commands remain safe stubs. The discovery sync commands below generate deterministic review data from the configured provider and do not mutate curated files or the database unless `--write` is passed.

Discovery sync commands:

```powershell
npm run sync:pois
npm run sync:routes
```

Both commands are dry-run by default. Use `-- --write` only when a review cache is intentionally needed:

- POI review cache: `data/imports/review/montreal-pois.cache.json`
- Generated route cache: `data/generated/montreal-routes.cache.json`

Default sync uses `DISCOVERY_POI_PROVIDER=regional_generated`, which keeps `DATA_SOURCE=mock` bootable without external APIs. To test OpenStreetMap/Overpass candidates, set `DISCOVERY_POI_PROVIDER=osm_overpass` and `ENABLE_EXTERNAL_IMPORTS=true`; candidates preserve OpenStreetMap source IDs, source URLs, and review metadata.

## Montreal Discovery Configuration

Default discovery coverage is configured in `lib/discovery/config.ts` and can be adjusted with env vars:

- `DISCOVERY_DEFAULT_CITY=montreal`
- `DISCOVERY_DEFAULT_RADIUS_KM=90`
- `DISCOVERY_MAX_POIS_PER_AREA=14`
- `DISCOVERY_POI_BATCH_SIZE=60`
- `DISCOVERY_ROUTE_GENERATION_ENABLED=true`
- `DISCOVERY_MAX_ROUTES_PER_THEME=2`
- `DISCOVERY_MIN_POIS_PER_ROUTE=3`
- `DISCOVERY_MAX_POIS_PER_ROUTE=5`
- `DISCOVERY_MAX_ROUTE_DURATION_MIN=180`
- `DISCOVERY_ROUTE_RADIUS_KM=9`
- `DISCOVERY_ROUTES_SHOWN=36`
- `DISCOVERY_CACHE_TTL=604800`
- `DISCOVERY_COVERAGE_AREAS_JSON` for replacing the default Montreal Island, Laval, Longueuil, South Shore, North Shore, West Island, and nearby day-trip areas.

The mock provider now merges curated places/routes with generated regional discovery candidates and generated route clusters. Generated records carry `Place.discovery` provider fields so they can later be replaced or enriched by Google Places, Mapbox, Foursquare, Yelp, tourism-board, or custom curated adapters without changing the UI contract.

Route geometry scripts:

- `scripts/routes/build-route-geometry.ts`
- `scripts/routes/validate-route-geometry.ts`
- `scripts/routes/recalculate-route-metrics.ts`
- `scripts/routes/export-routes-geojson.ts`

## Review Targets

- Move reviewed candidates to `data/curated/` or provider-backed JSON in a future slice.
- Keep raw import responses in `data/imports/raw/` only when intentionally small and useful.
- Keep generated content review-labeled until validation and field review pass; provider-backed records can replace generated candidates in a future slice.
