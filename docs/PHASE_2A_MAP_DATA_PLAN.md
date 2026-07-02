# Phase 2A Map And Data Plan

## Data Provider

- `lib/data/types.ts` owns shared models.
- `lib/data/mockProvider.ts` is the default runtime provider.
- `lib/data/postgresProvider.ts` is a prepared seam and throws until database access is implemented.
- `lib/data/index.ts` exposes the app-facing provider functions.

## Validation

- `lib/data/validators.ts` checks route/place counts, duplicate slugs, coordinates, geometry, notes, sources, and QA scores.
- `npm run validate:data` runs the validator against the provider-backed catalog.

## Map Layer

- `components/map/map-shell.tsx` renders MapLibre when a public style URL is configured, then falls back to the local projected map if config or tiles fail.
- `components/map/MapFallback.tsx` renders projected route geometry and markers with no external map keys.
- Routes, places, search, route detail, live route, and place detail use the shared map layer.

## State Flows

- Saved routes and places use `localStorage` through `lib/local-state.ts`.
- Walk completion can save a local history entry.
- Issue reporting posts to `/api/report-issue`.

## Backend Path

- Keep `DATA_SOURCE=mock` in production until query code, migrations, seed export, backups, and restore checks are complete.
- Use `db/migrations/001_init_meaningful_routes.sql` as the starting PostGIS schema.
- Import stubs default to dry-run and must not overwrite curated content without an explicit future implementation.
