# Architecture Notes

## Current delivery assumption

The MVP is **webapp first**. Desktop and mobile browsers are the first delivery surface. Native mobile apps can be added later after the Montreal route discovery loop is validated.

The current workspace may only contain this handoff package. If an existing implementation appears later, inspect it before changing architecture.

## Recommended architecture

```text
apps/web/ or src/              Responsive webapp
  pages/ or routes/            Explore, Compare, Detail, ActiveWalk, Complete, Saved, History, Settings
  components/                  RouteCard, RouteMapWeb, FilterPanel, StopList, ProgressPanel
  state/                       saved routes, active walk session, user preferences
  services/                    API client if used, web storage, geolocation, maps

packages/shared/src/domain/   Shared models and logic
  city.ts
  place.ts
  route.ts
  scoring.ts
  comparison.ts
  walkSession.ts
  filters.ts
  formatting.ts

src/server/                   Fastify API
  routes.ts
  places.ts
  sessions.ts
  feedback.ts
  health.ts

data/                         seed data / fixtures
```

## Domain-first principle

Route filtering, comparison labels, completion math, and scoring should live in shared domain code where possible, not buried in React components.

## Web storage

MVP can persist locally first in `localStorage` or IndexedDB:

- saved routes
- active walk session
- completed history
- preferences

If an API exists, mirror later.

## Route geometry

Use a provider abstraction:

```ts
interface RouteGeometryProvider {
  getRouteGeometry(routeId: string): Promise<GeoJSONLineString>;
}
```

For MVP, seed route geometry can be static.

## Map provider

Keep `RouteMapWeb` provider-abstracted.

Acceptance:

- never blank if valid geometry exists
- fits full route bounds
- displays stops
- handles map load failure gracefully

## API-first endpoints later

See `api/openapi.yaml`.
