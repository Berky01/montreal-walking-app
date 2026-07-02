# Release Notes

## Repository operations update - 2026-07-02

- Added a root `README.md` for quick start, validation, documentation, and safe project workflow.
- Added `docs/README.md` as the active documentation index and source-of-truth guide.
- Added `docs/WORKFLOW.md` with the Git, GitHub, branch, commit, validation, and deployment operating model.
- Documented the private GitHub remote `https://github.com/Berky01/meaningful-routes` and the normal `git push` flow for future sessions.
- Added `docs/decisions/ADR-001-operating-model.md` to record the local-first app and GitHub-backed workflow decision.
- Tightened `.gitignore` so generated logs, test artifacts, package caches, Playwright CLI output, and deployment output do not become baseline Git history.
- Updated project instructions and deployment/backups/media/data docs to clarify docs-only versus implementation deployment rules.

## Product-readiness sprint - 2026-07-01

### Release 2 functional MVP follow-up

- `/app` now uses the real shared map in the first viewport and quick chips open meaningful filtered route results instead of generic search queries.
- Leaflet now uses a no-key OpenStreetMap raster tile template by default when no `NEXT_PUBLIC_MAP_STYLE_URL` or `NEXT_PUBLIC_MAP_TILE_URL` is configured, while keeping the local SVG fallback if the tile layer fails to load.
- Leaflet and the SVG fallback now share the same tested marker model, so route previews, place markers, selected stops, current stop, next stop, and visited stop states stay consistent across `/app`, `/routes`, `/places`, route detail, and live route mode.
- Route polylines, route markers, place markers, and numbered stop markers now share selected/highlight behavior; route lines can be selected on tile-backed maps.
- Route recommendations can bias toward saved interests, quiet/rainy-day preferences, cafe preferences, and stair-avoidance preferences while preserving explicit filters and sort modes.
- Live route mode now advances to the next stop and updates walked distance/progress when the current stop is marked visited.
- Report issue now validates client-side before posting, honors route/stop query prefill, resolves stop context to the matching place when possible, and still saves submitted reports locally.
- Settings alert toggles are labeled as local future-reminder preferences; no notification system is implied in this MVP.
- Place detail pages now expose the place-level safety and accessibility notes already present in the shared data model.
- Route comparison now reads the persisted browser compare basket instead of always comparing the first four routes.
- Route cards on `/routes` now toggle the local compare basket visibly, and the route catalog shows the selected compare count.
- Added focused tests for compare-basket route resolution, map-style defaults, map marker models, preference-biased filtering, and live route state transitions.
- Added route geometry validation that fails when a route polyline no longer passes through its stop coordinates.
- Compare baskets now normalize to four unique route slugs, and failed browser storage writes no longer mark routes or places as saved.
- Added tested quick-filter configuration for the `/app` first-viewport route chips and tested Leaflet marker HTML helpers for map fallback presentation.
- `/app` route and place cards now drive the adjacent map selection, and live route mode shows actual elapsed/walked metrics alongside remaining time.

### Visible changes

- Visible Functional Webapp Sprint: rebuilt the main `/app` surface around a visual Montreal walking dashboard, route discovery hero, route/place cards, map panel, mood entry points, neighborhoods, and local saved/history summary.
- Added reusable CSS/SVG visuals for routes, places, neighborhoods, route heroes, place heroes, visual badges, route patterns, and stop markers without remote images.
- Upgraded route detail into a guide page with a visual hero, map-backed stop timeline, route metrics, why-this-route content, and practical walking notes.
- Upgraded live route mode with current/next/visited stop states, a map tied to session state, thumb-safe controls, completion, abandonment, pause/resume, and issue reporting links.
- Upgraded place catalog and place detail with visual cards, filters, map/list behavior, related routes, nearby places, and practical guide sections.
- Added a live `/api/build-info` endpoint so each deployment can be verified by build time, app version, data source, and route/place counts.
- Removed user-facing prototype and debug language from the Montreal route, search, settings, saved, history, report issue, media, and map surfaces.
- Made saved items, sharing, live route sessions, completion history, and preferences visibly stateful across refreshes.
- Improved the built-in static map with route lines, numbered markers, selected previews, and production-safe copy when no hosted map provider is configured.
- Improved mobile navigation and walk controls, including a sticky route-detail start action and thumb-safe live-route controls.

### Internal changes

- Kept `DATA_SOURCE=mock` as the default and continued to support the JSON/mock fallback path.
- Added Docker build arguments for build SHA and build time so the live container can expose deployment metadata.
- Tightened local-storage event handling so route cards, place cards, saved library, history, live sessions, and settings stay in sync.

### Still local-first

- Saved items, walk history, preferences, and issue reports remain browser-local for this MVP pass.
- The production map uses a no-key public OpenStreetMap raster tile template by default and falls back to the built-in static route/marker map if tiles or map loading fail.
