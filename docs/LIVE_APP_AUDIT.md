# Live App Audit

Date: 2026-07-01

## Current State

- Next.js App Router app with Tailwind, TypeScript, and standalone Docker output.
- Existing visual MVP covers `/`, `/app`, `/search`, `/routes`, route detail/live/complete, `/places`, place detail, `/saved`, `/history`, `/settings`, `/report-issue`, and `/admin/route-qa`.
- Data previously lived directly in `lib/mock-data` and pages imported those arrays.
- The old map was a placeholder shell with decorative pins and route lines.
- Save, history, and issue reporting existed visually but were not wired to durable local/API state.

## Phase 2A Changes Needed

- Provider-backed data access with mock default and Postgres preparation.
- Expanded Montreal catalog with at least 30 coordinate-backed places and 8 routes.
- GeoJSON-ready route LineStrings and validation.
- Fallback map that works without external keys, plus optional real map style support.
- API routes for routes, places, search interpretation, health, issue reports, and admin summary.
- Local saved library and walk history.
- Admin content readiness views.
- Unraid/Docker healthcheck and deployment docs.

## Risks

- `DATA_SOURCE=postgres` is intentionally prepared but not implemented.
- Issue reports are stored in memory for the mock provider and reset with the server process.
- Real map rendering now uses MapLibre when `NEXT_PUBLIC_MAP_STYLE_URL` is configured; the fallback map remains available when map style config is blank or tile loading fails.
