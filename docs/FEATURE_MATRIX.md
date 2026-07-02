# Feature Matrix

Date: 2026-07-01

## Implemented P0

- Responsive app shell with desktop top navigation and mobile bottom navigation.
- Public pages: `/`, `/app`, `/search`, `/routes`, `/routes/compare`, `/routes/[slug]`, `/routes/[slug]/live`, `/routes/[slug]/complete`, `/places`, `/places/[slug]`, `/saved`, `/history`, `/settings`, `/report-issue`.
- Provider-backed Montreal catalog with 12 routes and 60 places.
- Deterministic route search for duration, mood, interests, area hints, accessibility, museums, public art, markets, and campus.
- URL-backed route result filters for duration, interest, difficulty, route type, accessibility, and sorting.
- Route/place cards with save controls and visual placeholders that avoid unlicensed hotlinks.
- Route details with story, metrics, tags, start/save/share, stops linked to places, safety notes, accessibility notes, and map preview.
- MapLibre discovery map with configured style-provider support and local fallback map when no style URL is configured or tile loading fails.
- Local saved routes and places.
- Local compare basket drives `/routes/compare` when routes are selected.
- Local active route sessions with pause/resume, previous/next stop, mark visited, progress, report issue, and completion handoff.
- Completion page reads local session/history state and can save completed walks.
- History page shows completed walks, total metrics, walk again, share, and delete item actions.
- Settings persist units, pace, interests, accessibility preferences, location fallback, and labeled local alert preferences locally.
- Issue reporting includes route, stop/place context, type, severity, notes, client validation, browser-local persistence, and success/error states.
- Public SEO metadata for route/place list pages, search, route detail, and place detail.

## Scaffolded P1

- External service boundaries for map provider, routing provider, import pipeline, media attribution, optional Postgres/PostGIS, and future AI.
- Read-only admin content, route QA, route builder, and issues pages.
- Dry-run route geometry and import scripts.
- Media attribution components and placeholder policy.

## Deferred P2

- Offline route downloads.
- PDF/GPX exports.
- Weather/time integrations.
- Accessibility route variants.
- Neighborhood guide publishing workflow.
- Premium city packs.
- Partner guest route kits.
- Audio stories.
- Tickets/tours/affiliate booking.
- UNESCO/heritage layers.
- Real AI route generation.
- Road-trip planner.
- Pilgrimage mode.
- Multi-city expansion.

## Known Limitations

- Route geometry is curated from ordered stops, not turn-by-turn pedestrian routing.
- The static map remains the fallback if MapLibre style configuration is missing or tile loading fails.
- Saved items, route sessions, issue reports, settings, and history are local to the browser.
- Issue reports remain browser-local in the MVP; the mock server endpoint is retained for adapter coverage.
- Playwright smoke tests cover core flows and viewport overflow checks when a local server is running.
