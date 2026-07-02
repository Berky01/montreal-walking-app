# Meaningful Routes Feature Matrix

This matrix tracks the production app, not the Stitch prototype export. P0 is the functional Montreal web app. P1 is scaffolded behind flags. P2 remains roadmap-only unless explicitly promoted.

## Status Legend

- Done: usable in the current app.
- Partial: implemented but still needs hardening or broader tests.
- Flagged: data/component scaffold exists, hidden by feature flags or absent from primary nav.
- Planned: documented but not implemented.
- Deferred: out of scope for the current web MVP.

## P0 Core Functional App

| Feature | Status | Current state |
|---|---|---|
| App home | Done | `/app` renders shared route/place data with a real photo hero, map preview, route/place preview selection, local continue/saved/recent state, and filtered quick chips. |
| Search | Partial | Deterministic parser, URL `q` state, removable chips, reset, match reasons, no-results state, parser tests. |
| Route catalog | Partial | Time, interest, difficulty, route shape, accessibility, neighborhood, weather, sorting, URL state, tested filter/sort logic. |
| Route comparison | Done | `/routes/compare` uses the browser-local compare basket when available, caps it to four routes, includes a comparison map, and falls back to featured routes when empty. |
| Route detail | Done | Shared route data, approved hero media, credits, metadata, metrics, save/share, photo-backed stop list, map, notes. |
| Live route | Partial | Versioned local session state supports start, pause, resume, previous/next, mark visited, skip, complete, abandon, refresh persistence, current/next stop photos, actual walked distance, elapsed time, progress, and history save. |
| Completion | Partial | Reads active/completed session data and saves completed walks to local history. |
| Saved library | Done | Routes and places save locally and survive refresh via versioned storage. |
| History | Done | Completed walks render with stats, delete, share, and walk-again actions. |
| Places catalog | Partial | Shared photo-backed place cards, filters, map/list selection. |
| Place detail | Done | Shared place data, approved hero media, credits, story/practical sections, save, map, related routes, metadata. |
| Settings | Partial | Units, pace, interests, quiet/rainy/accessibility preferences, location status, and labeled local alert preferences persist locally. |
| Issue reporting | Done | Route/stop/place context, category, severity, notes, validation, and browser-local persistence. |
| Map abstraction | Done | `MapShell`, no-key Leaflet/OpenStreetMap raster tile default, selected route/place/stop markers, route-line selection, fit bounds, visible attribution, and SVG fallback without API-key crash. |
| Media governance | Done | Local `public/media` assets, `data/media/media-assets.json`, license/source validation, coverage reporting, and generated fallback rules. |

## P1 Stitch Parity Features

| Feature | Status | Flag |
|---|---|---|
| Map explorer | Flagged | `mapExplorer` |
| Offline route cards | Flagged | `offlineCards` |
| Route export | Flagged | `routeExport` |
| Weather/time suggestions | Flagged | `weatherSuggestions` |
| Accessibility detail pages | Flagged | `accessibilityNotes` |
| Neighborhood pages | Flagged | `neighborhoodPages`; shared neighborhood data exists. |
| Premium city packs | Flagged | `premiumPacks`; pack data is non-commercial scaffold only. |
| Partner guest route kits | Flagged | `partnerPortal`; partner kit data is preview scaffold only. |
| Admin QA dashboard | Flagged | `adminQa`; local issue data is shaped for future admin use. |

## P2 Roadmap Only

| Feature | Status | Notes |
|---|---|---|
| Audio stories | Deferred | Flag exists; no audio product work. |
| Tickets/tours | Deferred | Flag exists; no marketplace or booking work. |
| Heritage/UNESCO layers | Deferred | Requires map explorer/content QA maturity. |
| Dynamic route generation | Deferred | Flag exists; no AI generation. |
| Road-trip mode | Deferred | Explicitly out of current scope. |
| Pilgrimage mode | Deferred | Explicitly out of current scope. |
| Multi-city expansion | Deferred | City model exists; Montreal remains the MVP city. |
| Payments/subscriptions | Deferred | Not added. |
