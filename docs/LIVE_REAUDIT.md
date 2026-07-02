# Live Reaudit

Date: 2026-07-01

## Audited Surface

- `package.json`, app routes under `app/`, shared components under `components/`, provider code under `lib/data/`, route search under `lib/route-engine/`, local saved/history state in `lib/local-state.ts`, mock content in `lib/mock-data/`, API routes, Docker files, and deployment docs.
- Current public pages include `/`, `/app`, `/search`, `/routes`, `/routes/compare`, `/routes/[slug]`, `/routes/[slug]/live`, `/routes/[slug]/complete`, `/places`, `/places/[slug]`, `/saved`, `/history`, `/report-issue`, and read-only admin content pages.
- Git history is not useful in this checkout because the current branch has no commits and the app files are untracked.

## Current Implementation

- Runtime data access flows through `lib/data/index.ts`; `DATA_SOURCE=mock` selects the mock provider by default.
- The catalog now contains 12 Montreal routes and 60 Montreal places, all with coordinates, source placeholders, media placeholders, safety/accessibility metadata, and map-ready route geometry.
- Map rendering uses `components/map/map-shell.tsx`. It renders MapLibre when `NEXT_PUBLIC_MAP_STYLE_URL` is configured and falls back to the local route/marker map when style config is blank or tile loading fails.
- Search is deterministic in `lib/route-engine` and ranks provider-backed route data by duration, area, interests, tags, and moods.
- Saved items, active walk sessions, compare baskets, preferences, completed walk history, and issue reports are browser-local through `lib/local-state.ts`.
- `/api/report-issue` remains available for the provider boundary, but the Functional MVP report form validates and stores reports locally first.

## Gaps And Risks

- Route geometries are curated LineStrings assembled from ordered stops, not reviewed turn-by-turn pedestrian routing.
- Sources and media are placeholders until official, field, Wikimedia, or municipal attribution is reviewed.
- `DATA_SOURCE=postgres` is a prepared boundary only; keep `DATA_SOURCE=mock` for local and live MVP boot until database access is implemented and restore-tested.
- Admin tools are read-only dashboards and QA views. There is no route-builder write workflow yet.
- Import scripts are dry-run stubs and must not be treated as automated publication tooling.

## Validation Target

Run the Phase 2B sequence before deploys:

```powershell
npm run lint
npm run typecheck
npm run validate:data
npm run validate:routes
npm run validate:media
npm run build
```
