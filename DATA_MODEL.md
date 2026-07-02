# Meaningful Routes Data Model

## P0 Core Records

- `City`: MVP city metadata, locale, timezone, center point, and lifecycle status.
- `Place`: reusable point of interest with category, area, coordinates, story, why-it-matters copy, practical info, tags, related route slugs, source/media metadata, accessibility notes, and safety notes.
- `Route`: curated walk with city, area, distance, duration, difficulty, route shape, tags, moods, best-for copy, start/end places, stops, metrics, geometry, notes, QA state, media, and sources.
- `RouteStop`: ordered stop with place link, description, distance from start, recommended dwell time, and coordinates.
- `SavedItem`: local saved route/place record.
- `CompareBasket`: browser-local ordered route slug list used by `/routes/compare`, normalized to four unique route slugs.
- `WalkSession`: local route session with route id/slug/title, status, started/ended/paused time, pause duration, current stop index, current/next stop pointers, visited/skipped stop ids, progress percent, elapsed minutes, and actual distance.
- `CompletedWalk`: currently the same stored shape as `WalkSession` with status `completed`.
- `UserPreferences`: units, pace, interests, quiet/rainy-day/accessibility preferences, location permission state, and local alert preferences.
- `IssueReport`: route/place/stop context, category, severity, description, status, and created timestamp. Release 2 reports are saved browser-locally after client validation.
- `MapMarkerModel`: derived client model for route markers, place markers, numbered stop markers, selected state, live current/next/visited states, marker coordinates, and route/place selection targets.
- `ContentSource`, `SourceAttribution`, `MediaLicense`, and `MediaAsset`: media governance records for local photos, generated fallbacks, source URLs, creator/license metadata, owner links, approval state, and validation confidence.
- `DataImportSource`, `DataImportRun`, and `ExternalProviderConfig`: batch/manual/runtime integration tracking for media and future provider adapters.
- `PlaceExternalRefs` and `RouteExternalRefs`: optional external identifiers for Wikidata, Wikimedia Commons, OSM, Google Places, Montreal open data, and official websites.
- `MediaCoverageReport`: derived coverage summary with approved real photos, generated fallbacks, review/rejected counts, missing hero/card photos, and route/place coverage.

## P1 Scaffold Records

- `Neighborhood`: city-scoped grouping with center point, tags, matching route slugs, and matching place slugs.
- `CityPack`: flagged preview grouping for future city packs. No payments or entitlements are implemented.
- `PartnerKit`: flagged preview grouping for future guest route kits. No partner portal or analytics are implemented.

## P2 Roadmap Records

P2 concepts such as audio stories, tickets/tours, heritage layers, dynamic route generation, road-trip planning, pilgrimage stages, and full multi-city expansion are not modeled beyond feature flags unless promoted into a scoped release.

## Local Storage Keys

- `meaningful-routes:v1:saved-items`
- `meaningful-routes:v1:compare-basket`
- `meaningful-routes:v1:walk-sessions`
- `meaningful-routes:v1:completed-walks`
- `meaningful-routes:v1:preferences`
- `meaningful-routes:v1:issue-reports`
- `meaningful-routes:v1:feature-flags`

Each value is written as a schema-versioned envelope by `lib/storage.ts`. Legacy pre-v1 keys are migrated on read where a local fallback exists.

## Release 2 Validation Rules

- The mock catalog must keep at least 12 routes and 60 places.
- Every visible place must have valid latitude/longitude coordinates.
- Every route must have a LineString geometry with valid coordinates.
- Every route stop must reference an existing place id and have valid coordinates.
- Every route geometry must pass through each route stop coordinate within the validator tolerance.
- Saved-item writes report storage failure so UI controls do not show false saved state when browser storage is unavailable.
- Production image media must be approved, local, non-hotlinked, commercial-safe, and source/license attributed.
- `needs_review` or `rejected` media cannot be used for hero/card roles.
- Generated visuals can appear only as fallback media.
