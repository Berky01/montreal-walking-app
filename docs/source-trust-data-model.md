# Source and trust data model

The public source/trust implementation is intentionally small and local-first. It gives auditors real typed data, visible routes, and tests without requiring external provider credentials.

## Owning files

- `src/lib/content-trust.ts`: domain types and utility functions.
- `src/data/placeTrustData.ts`: mock Montreal trust records and route trust records.
- `src/components/PlaceTrustPage.tsx`: visible POI, admin QA, and live-route trust surfaces.
- `src/App.trust-routes.test.tsx`, `src/components/PlaceTrustPage.test.tsx`, `src/lib/content-trust.test.ts`: regression tests.
- `scripts/validate-data.ts`, `scripts/validate-routes.ts`, `scripts/validate-media.ts`: package-level validation commands.

## Place trust fields

`PlaceTrustRecord` contains:

- `slug`, `name`, `area`, `summary`
- `verificationStatus`: `verified`, `needs_review`, or `draft`
- `sourceQuality`: `verified`, `needs_review`, or `draft`
- `sourceQualityScore`: numeric 0-100 score
- `lastReviewedAt`: ISO date
- `reportCorrectionHref`
- `linkedContentBlock`
- `sources`: `PlaceSource[]`
- `media`: `PlaceMedia[]`

`PlaceSource` contains:

- title, type, publisher, URL, license, attribution
- reliability
- `accessedAt`, `lastCheckedAt`
- optional linked content block

`PlaceMedia` contains:

- current or historical media kind
- approval status: `approved`, `needs_review`, or `rejected`
- source URL, publisher, creator, license, attribution, and last checked date

## Derived UI state

- `getPlaceSourceTrustSummary()` turns source quality, verification, review date, and media publishers into display labels.
- `getApprovedCurrentMedia()` and `getApprovedHistoricalMedia()` filter media by kind and approval state.
- `getThenNowPair()` only returns a paired comparison when approved current and historical media both exist.
- `buildLiveRouteTrustMetrics()` derives estimated steps, pace, and current-stop review labels from a trusted route.

## Public routes

- `/places/place-darmes`
- `/places/notre-dame-basilica`
- `/places/saint-joseph-oratory`
- `/routes/old-montreal-monuments-loop/live`
- `/routes/churches-courtyards-walk/live`
- `/admin/route-qa`
- `/admin/route-qa?admin=1`

The admin route is intentionally disabled by default. The explicit query flag is a local/demo gate, not real authentication.

## Non-goals preserved

- No premium, payment, real auth, real AI generation, device marketplace, public partner dashboard, or offline download system was added.
- Media is represented with source URLs and attribution metadata. The app does not hotlink remote images into the UI.
- External API calls are not required for the new trust routes.
