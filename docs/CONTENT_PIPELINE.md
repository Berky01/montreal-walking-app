# Content Pipeline

## Content States

The current catalog uses `contentStatus="ready"` with source/media placeholders. This means the records are complete enough for MVP rendering and validation, not field-published editorial content.

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
