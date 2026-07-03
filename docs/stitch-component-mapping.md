# Stitch component mapping

This repo does not ship static Stitch HTML as the production app. The Stitch review surface in `src/stitchReview.tsx`, tokens in `src/design/stitchTokens.ts`, and rules in `DESIGN.md` are used as reference material for production React components.

## Source artifacts

- `DESIGN.md`: compact outdoor-readable mobile route tool, restrained color, stable card dimensions, plain empty states, direct errors.
- `src/stitchReview.tsx`: review-only screens selected with `?stitchScreen=...`.
- `src/design/stitchTokens.ts`: color, radius, spacing, and type tokens used as the visual baseline.

## Production mapping

| Product surface | Stitch reference | Production implementation |
| --- | --- | --- |
| Enriched POI pages | `route-detail`, `poi-card`, `poi-card-practical`, `poi-card-hook` | `src/components/PlaceTrustPage.tsx` renders the place hero, trust badges, source summary, approved media, and then-now module. |
| Source drawer | `route-detail` trust panel and compact card patterns | `SourceDrawer` renders source records, reliability, dates, license, attribution, and linked content in a semantic section. |
| Historical media and then-now comparison | POI card structure, route detail grid, DESIGN empty-state rule | `HistoricalMediaSection` and `ThenNowModule` render approved current/historical media with attribution and the required empty state. |
| Live walk tracker | `active-walk`, `active-walk-navigation`, `active-walk-progress`, `active-walk-streamlined`, `active-walk-variants` | `LiveRouteTrustPage` exposes estimated steps, pace, and current-stop source review context from route trust data. |
| Completion and walk journal | `walk-complete`, `walk-complete-summary`, `saved-progress`, `route-feedback` | Existing app completion, history, saved route, and feedback flows remain the production source. This source/trust pass does not replace them. |
| Planner workspace | `home`, `home-goal-first`, `start-location`, `route-comparison`, `desktop-planner` | Existing planner flow remains intact. The new trust routes are early SPA routes and do not disturb the normal planner state machine. |
| Devices and trackers | `active-walk-variants` | Not publicly enabled. The trust page includes an explicit boundary note to avoid presenting device features that are outside current scope. |
| Offline city packs | No production-approved Stitch equivalent in this repo | Not publicly enabled. The implementation keeps source/trust data local but does not add offline downloads. |
| Admin source QA | Card, metric, and dashboard patterns from `desktop-planner` | `AdminRouteQaPage` is route-gated and disabled unless `?admin=1` or `VITE_ENABLE_ADMIN_QA=true` is present. |
| Partner route kits | No production-approved Stitch equivalent in this repo | Not publicly enabled. Partner dashboards/kits remain outside current scope. |

## Implementation constraints

- Production code is TypeScript and React, not pasted Stitch markup.
- Trust state is driven by `src/lib/content-trust.ts` and `src/data/placeTrustData.ts`.
- Accessibility improvements take precedence over exact Stitch structure: route sections have headings, source drawer controls have descriptive accessible names, and live metrics expose labelled regions.
- Data architecture and privacy constraints take precedence over visual parity: admin QA is gated, location/device features are not exposed, and media attribution is mandatory.
