# Meaningful Routes Architecture

## Current Stack

- Framework: Next.js App Router under `app/`.
- Language: TypeScript with strict checking.
- UI: React 19, Tailwind CSS, lucide-react icons.
- Tests: Vitest unit tests.
- Package manager: npm with `package-lock.json`.
- Data source: `DATA_SOURCE=mock` by default; Postgres provider is intentionally not configured.
- Deployment: Docker/Unraid deployment docs live under `docs/`; live deployment must update `https://routeapp.plexplease.xyz/` when access is available.

## System Boundary

The app should be built as reusable systems rather than one-off Stitch screens:

- Discovery and search.
- Route catalog and route detail.
- Live walk sessions.
- Completion/history.
- Saved library.
- Places and neighborhoods.
- Settings/preferences.
- Map abstraction.
- Offline/export/share scaffolds.
- Weather/accessibility context.
- Admin QA, partner kits, and premium packs behind flags.

## Data Flow

1. Server pages read from `lib/data/index.ts`.
2. `lib/data/index.ts` selects the mock provider unless `DATA_SOURCE=postgres`.
3. Mock data lives in `lib/mock-data/*`.
4. Client-only user state lives in `lib/local-state.ts`.
5. `lib/local-state.ts` persists through `lib/storage.ts` with schema-versioned local storage envelopes.
6. Incomplete product surfaces are controlled by `lib/feature-flags.ts` and `FeatureFlagGate`.

## Component Layers

- `components/layout`: app shell, top nav, mobile nav, split map layout, bottom sheet, sticky action bar.
- `components/map`: MapLibre/fallback map abstraction, clustered place pins, optional route overlays, map panel, preview cards.
- `components/media`: approved local photo rendering, responsive image wrapper, visible media credits, and gallery helpers.
- `components/routes`: route cards, lists, filters, notes, stop timeline.
- `components/places`: place cards, place list/detail helpers.
- `components/library`: save controls, saved library, preferences form.
- `components/walk`: live route, progress, completion, history save.
- `components/feedback`: issue report form.
- `components/system`: feature flag gate.

## Feature Flags

All flags default to `false` and persist under `meaningful-routes:v1:feature-flags`:

`mapExplorer`, `offlineCards`, `routeExport`, `weatherSuggestions`, `accessibilityNotes`, `neighborhoodPages`, `premiumPacks`, `partnerPortal`, `adminQa`, `audioStories`, `ticketsTours`, `heritageLayers`, `dynamicRouteGeneration`, `roadTripMode`, `pilgrimageMode`, `multiCityExpansion`.

## Constraints

- Do not require external APIs for local boot.
- Do not hotlink unlicensed images.
- Store production photos locally under `public/media/*` and source/license metadata under `data/media/media-assets.json`.
- Keep media ingestion behind batch/manual scripts in `scripts/media/*`; runtime UI reads local data only.
- Do not expose unfinished P2 features in primary navigation.
- Do not add real auth, payments, subscriptions, AI generation, road-trip mode, pilgrimage mode, audio stories, ticket marketplace, partner analytics, or offline downloads in the current scope.
