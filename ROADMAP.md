# Meaningful Routes Roadmap

## Release 0 - Foundation

- Keep the existing Next.js app and visual MVP.
- Normalize shared TypeScript models for city, neighborhood, place, route, stop, saved item, walk session, completed walk, preferences, issue reports, city packs, and partner kits.
- Use `DATA_SOURCE=mock` by default and keep mock/JSON boot independent from external APIs.
- Add canonical feature flags for incomplete P1/P2 surfaces.
- Add versioned local storage with safe parse, legacy migration, unavailable-storage fallback, and canonical `meaningful-routes:v1:*` keys.
- Make saved routes/places, walk sessions, completed walks, settings, issue reports, and feature flags local-persistent.

## Release 1 - Full P0 Web App

- Search by natural language with deterministic parsing, URL state, removable chips, match reasons, no-results, reset, and tests.
- Route catalog filters by time, interest, difficulty, route shape, accessibility, neighborhood, and rainy-day suitability.
- Route comparison reads the browser-local compare basket and falls back to featured routes when empty.
- Route detail, live route, completion, saved, history, places, place detail, settings, and issue reporting remain primary app surfaces.
- Map rendering goes through a shared abstraction with Leaflet tiles and a graceful no-key SVG fallback.
- Public SEO basics stay on landing, route list/detail, and place list/detail pages.

## Release 2 - Functional MVP

- Status: shipped on 2026-07-01.
- Use real no-key Leaflet/OpenStreetMap raster tiles by default with visible attribution and an SVG/local fallback if tile loading fails.
- Keep 12 Montreal routes and 60 Montreal places centralized in typed mock data with coordinates, route geometry, stop-place references, notes, media metadata, and validators.
- Make `/app` center the product around a real map, actionable route preview, persisted continue/saved/recent state, and filtered route entry chips.
- Make `/routes`, `/places`, route detail, and live route mode share route lines, place markers, numbered stop markers, selected/highlight states, fit bounds, and marker/line selection behavior.
- Keep saved items, compare basket, active walk sessions, completed walk history, settings, and issue reports browser-local for this release.
- Let units and pace visibly affect route metrics, and let interests/accessibility preferences bias recommended route ordering.
- Cap compare baskets to four unique routes and keep failed browser storage writes visible to the UI instead of silently claiming success.
- Validate that each route polyline includes its stop coordinates, not only that geometry coordinates are syntactically valid.
- Keep issue reporting local-first with required-field validation, route/stop/place prefill, and a browser-local success state.

## Release 2A - Real Photo MVP Sprint

- Status: in progress on 2026-07-01.
- Establish a clean repository baseline, source-of-truth docs, and Git/GitHub workflow before starting more feature work.
- Add a governed local real-photo pipeline with Wikimedia Commons batch import, local downloads, and source/license metadata.
- Use approved real photos across app hero, route cards, place cards, route detail, place detail, stop timelines, live route, saved, history, map preview cards, and neighborhood previews.
- Keep generated visuals as fallback only.
- Validate media with `npm run validate:media` and coverage report generation.
- Keep Google Places, paid map providers, cloud storage, AI, auth, and payments deferred.

## Release 3 - P1 Stitch Parity Behind Flags

- Map explorer.
- Offline route cards.
- Route export/share completion.
- Weather/time suggestions.
- Accessibility detail surfaces.
- Neighborhood pages.
- Premium city-pack previews without payments.
- Partner guest route kits without partner analytics.
- Admin QA backed by local issue/route QA data.

## Release 4 - Platform Readiness

- External data/provider adapters.
- Content QA workflows.
- Cloud persistence and account strategy.
- Entitlement/payments design only after pack value is proven.
- Multi-city tooling after Montreal content and QA are stable.

## Release 5 - P2 Vision

- Audio stories.
- Tickets/tours.
- Heritage layers.
- Dynamic route generation constrained to verified places.
- Road-trip planner.
- Pilgrimage mode.
- Native mobile app.
