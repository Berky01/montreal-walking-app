# Stitch Component Map

Updated: 2026-07-02

This maps approved Stitch UI patterns to production React components. Use this before adding new pages from the Stitch project.

## P0 Prototype Extension

The 2026-07-02 P0 Trust/Walk/Planner/QA prototype adds design references for source trust, then/now media, live walk metrics, journal stats, planner itinerary items, voting, and admin source QA. Treat these as patterns to map onto existing production owners, not as generated code to copy.

Deferred/mock-only prototype components remain out of current MVP implementation scope: `AudioStoryCard`, `DeviceProviderCard`, and `OfflinePackCard`.

| Stitch component or pattern | Production component/module | Props/data needed | Accessibility notes |
|---|---|---|---|
| App frame with desktop nav and mobile bottom nav | `components/layout/app-shell.tsx`, `desktop-top-nav.tsx`, `mobile-bottom-nav.tsx` | Current route links and local-first public nav | Keep all nav links keyboard focusable and avoid linking to disabled feature screens. |
| Page margins and content width | `components/layout/page-container.tsx` | Optional class overrides for route-specific grids | Preserve 16px mobile margins and 48px desktop margins from the style lock. |
| Split list/map explorer | `components/layout/split-map-layout.tsx` | `content`, `map` | Mobile renders map through `BottomSheet`; desktop keeps a visible list alternative. |
| Map panel and map fallback | `components/map/map-shell.tsx`, `MapFallback.tsx`, `MapPreviewCard.tsx` | Published places, published routes, selected item, route session state | Map interactions must always have list/card equivalents. Static fallback is required when tiles are not configured or fail. |
| Place cards | `components/places/place-card.tsx`, `components/media/PlaceCover.tsx` | `Place`, optional preview handler, selected state, variant | Cards must expose real links, image alt text, category/neighborhood metadata, and route inclusion context. |
| Route cards | `components/routes/route-card.tsx`, `route-list.tsx` | `Route`, compare flag, optional preview handler, selected state | Primary actions must be links/buttons, not dead controls. Compare/save state must be visible without color alone. |
| Hero media and visual headers | `components/visual/visuals.tsx`, `components/media/*` | Place/route media and attribution metadata | Prefer approved local media. Do not hotlink unlicensed images. Preserve attribution lines where media is shown. |
| Metric ribbons | `components/ui/metric-ribbon.tsx`, `components/routes/preference-route-metrics.tsx` | Route distance, duration, stops, preferences | Use `dl`/labels where metrics need semantic pairing. |
| Buttons | `components/ui/button.tsx` | Link href or button action, variant, size | Use real `button` or `Link` elements. Icon-only controls need labels; current main buttons include text. |
| Chips and category filters | `components/ui/chip.tsx`, page-specific filter buttons | Category/tag/filter state | Active state uses text plus color. Filter buttons must remain minimum tap size. |
| Cards and content panels | `components/ui/card.tsx` | Children | Use for repeated items and framed tools. Avoid nested cards for page sections. |
| Empty/loading/error states | `components/ui/empty-state.tsx`, `loading-state.tsx`, `error-state.tsx`, `app/not-found.tsx`, `app/error.tsx` | State title, description, action | Unknown routes/places must use designed 404, not raw errors. |
| Places catalog filters | `components/places/places-page-client.tsx` | Published places, URL params | Search input has label. Selects and filter buttons are keyboard reachable. |
| Route catalog filters and compare basket | `components/routes/routes-page-client.tsx` | Published routes/places, preferences, local compare state | Reset and compare links are explicit. Avoid huge unrelated dropdown content. |
| Search and natural-language-like discovery | `components/search/search-page-client.tsx`, `lib/route-engine` | Published routes/places and local ranking | No external AI dependency. Suggested queries must map to real local content. |
| Route detail timeline | `components/routes/route-stop-timeline.tsx`, `route-guide-client.tsx` | Route stops and published places | Stop selection updates map but timeline remains the keyboard/list alternative. |
| Live route controls | `components/walk/live-route-client.tsx`, `progress-bar.tsx` | Route, places, local route session state | Touch targets must stay large. Do not require geolocation for the public MVP. |
| Completion and history | `components/walk/completion-summary-client.tsx`, `history-client.tsx` | Route, local history state | Saving completion must work locally and fail gracefully. |
| Saved library | `components/library/saved-library-client.tsx`, `save-button.tsx` | Published places/routes, local saved state | Empty states explain the local device boundary. |
| Preferences/settings | `components/library/preferences-form.tsx` | Local preferences schema | Form controls need visible labels and should immediately update local ranking behavior. |
| Issue reporting | `components/feedback/issue-report-form.tsx`, `app/api/report-issue/route.ts` | Published routes/places, issue type, honeypot/rate limit | Public form must not expose draft/future content. User-facing messages must not reveal raw server errors. |
| Admin QA | `app/admin/*`, `app/api/admin/*` | All routes/places and validation summaries | Disabled by default with `ENABLE_ADMIN_TOOLS`. Keep `robots` noindex and no public nav links. |

## Production Rules

- Reuse these components before creating new UI primitives.
- Keep mock/JSON fallback mode working.
- Keep external providers behind adapters and optional environment variables.
- Keep future or forbidden concepts out of public navigation even if they exist in Stitch.
- When a Stitch screen needs data that is not production-ready, gate it, consolidate it into an existing page, or document it as deferred.
