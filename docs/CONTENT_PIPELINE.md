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

- `scripts/import/osm-overpass.ts`
- `scripts/import/wikidata.ts`
- `scripts/import/montreal-open-data.ts`
- `scripts/import/normalize-places.ts`
- `scripts/import/wikimedia-commons.ts`
- `scripts/import/dedupe-places.ts`
- `scripts/import/review-queue.ts`

These are safe stubs and currently do not fetch or publish external data.

Route geometry scripts:

- `scripts/routes/build-route-geometry.ts`
- `scripts/routes/validate-route-geometry.ts`
- `scripts/routes/recalculate-route-metrics.ts`
- `scripts/routes/export-routes-geojson.ts`

## Review Targets

- Move reviewed candidates to `data/curated/` or provider-backed JSON in a future slice.
- Keep raw import responses in `data/imports/raw/` only when intentionally small and useful.
- Keep generated content out of public routes until validation passes.
