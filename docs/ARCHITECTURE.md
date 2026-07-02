# Architecture

## Framework

The app is a Next.js App Router project with TypeScript and Tailwind CSS. Pages are static or server-rendered against local mock data unless client state is required for filters, search, or local interactions.

## Proposed App Router Structure

```txt
app/
  layout.tsx
  page.tsx
  app/page.tsx
  search/page.tsx
  routes/page.tsx
  routes/[slug]/page.tsx
  routes/[slug]/live/page.tsx
  routes/[slug]/complete/page.tsx
  places/page.tsx
  places/[slug]/page.tsx
  saved/page.tsx
  history/page.tsx
  settings/page.tsx
  report-issue/page.tsx
  admin/route-qa/page.tsx
components/
  layout/
  ui/
  routes/
  places/
  map/
  search/
  walk/
  library/
  admin/
lib/
  types/
  data/
  mock-data/
  route-engine/
  utils/
docs/
```

P0A implements the first nine routes. P0B routes can be stubbed or skipped until the user-side journey compiles and is visually usable.

## Component Architecture

Components are grouped by ownership:

- `components/layout`: app shell, top navigation, mobile bottom navigation, page containers, split map layout.
- `components/ui`: reusable visual primitives such as buttons, cards, chips, tabs, metric ribbons, and empty/loading/error states.
- `components/routes`: route cards, route lists, filters, hero, metrics, stop timeline, notes, and comparison table.
- `components/places`: place cards, place filters, place hero, and related routes.
- `components/map`: MapLibre-backed discovery map shell, clustered place pins, optional route overlays, projected fallback map, and preview cards.
- `components/search`: natural-language search box, suggestions, intent chips, and search results.
- `components/walk`: live route panel, current step, progress, next stop, and end walk controls.

Shared components receive typed data props and avoid page-specific hardcoded data.

## Route Structure

- `/` introduces Meaningful Routes and sends users into Montreal route discovery.
- `/app` is the app-like home and around-me experience.
- `/search` accepts natural-language queries and shows deterministic interpretation.
- `/routes` lists/filter routes with a provider-backed map.
- `/routes/[slug]` is the route confidence page.
- `/routes/[slug]/live` is mocked live walking guidance.
- `/routes/[slug]/complete` summarizes a mocked completed walk.
- `/places` lists monuments and meaningful places.
- `/places/[slug]` explains one place and related routes.

## Styling And Tokens

Tailwind is configured from `meaningful_routes/DESIGN.md`.

Key strategy:

- CSS variables define brand tokens in `app/globals.css`.
- Tailwind theme aliases map to semantic tokens such as `primary`, `surface`, `surface-container`, `on-surface`, and `outline`.
- Inter is loaded through `next/font`.
- Layout uses a 4px rhythm, 16px mobile margins, and 48px desktop margins.
- Cards use the Stitch 16px radius unless a smaller control radius is required.
- Buttons and inputs use 8px radius.
- Shadows are subtle and reserved for cards and floating map controls.

## Mock Data Strategy

Provider-backed data access lives in `lib/data/`. The default mock provider reads curated TypeScript content from `lib/mock-data/`.

- `cities.ts` contains Montreal.
- `places.ts` contains at least 30 Montreal places.
- `routes.ts` contains 8 complete routes with stops, notes, tags, metrics, QA status, source placeholders, and LineString geometry.
- Derived helpers can live beside data or under `lib/utils/` when shared.

Mock image handling should avoid temporary Stitch `lh3.googleusercontent.com` URLs. First-pass cards can use CSS gradients, map shells, or stable placeholder surfaces keyed by route/place category.

## Route Engine Strategy

`lib/route-engine/` contains a deterministic mock parser/scorer.

Responsibilities:

- Parse duration phrases such as `30 min`, `under 1 hour`, `90 minutes`, and `half day`.
- Detect interests such as history, architecture, churches, cafes, scenic, nature, waterfront, hidden gems, quiet, and accessible.
- Detect mood words such as quiet, scenic, hidden, historical, family-friendly, romantic, and rainy day.
- Score local mock routes against the parsed intent.
- Return explanation chips and transparent per-route match reasons.

The route engine must not call an AI API.

## State Strategy

- Most P0A pages use server-rendered mock data.
- Search and filters use small client components when URL or local UI state is needed.
- Save/history/settings use browser-local state for the Phase 2A app foundation.
- Live route mode uses deterministic mock progress values in this run.

## Future Backend/API Notes

The app should be ready to add backend services later, but this run does not create them.

Current and future backend seams:

- route/place content API
- search interpretation service
- saved routes and history persistence
- issue reports
- admin route QA workflow
- provider-agnostic MapLibre style/tile configuration
- real routing provider integration
- media asset service

External map calls remain optional. `NEXT_PUBLIC_MAP_STYLE_URL` enables MapLibre tiles when configured; when it is blank, the local fallback map keeps mock-data boot working without a provider key.

## Deployment Notes

The production target is a Dockerized Next.js standalone app on the Unraid server, exposed through the existing Cloudflare Zero Trust remote-managed Tunnel as `routeapp.plexplease.xyz`.

- The app container is named `routeapp`.
- The container listens on port `3000`.
- The container joins the existing `appdata_media` Docker network.
- Cloudflare Zero Trust should route `routeapp.plexplease.xyz` to `http://routeapp:3000`.
- Real deployment credentials are not stored in the repository.

See `docs/DEPLOYMENT.md` for the operational checklist.
