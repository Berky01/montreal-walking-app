# Routing Provider

## Current State

Routes currently use curated manual LineStrings generated from ordered stop coordinates. These geometries are good enough for map preview and validation, but they are not turn-by-turn walking paths.

The implemented boundary lives in `lib/routing/`:

- `manualProvider` returns stored geometry.
- `osrmProvider`, `valhallaProvider`, and `graphhopperProvider` are server-side adapter boundaries that fail clearly until request generation is implemented.
- `getRoutingProvider()` defaults `none` to the manual provider.

## Environment Boundary

```env
ROUTING_PROVIDER="none"
ROUTING_BASE_URL=""
ROUTING_PROFILE="walking"
ROUTING_TIMEOUT_MS="10000"
```

Supported future values:

- `none`
- `manual`
- `osrm`
- `valhalla`
- `graphhopper`

## Rules

- Routing provider calls must run server-side only.
- Public pages must never call a routing engine on render.
- Generated geometry must be cached and reviewed before replacing curated geometry.
- Missing provider config must fall back to stored route geometry.
- Curated geometry must not be overwritten automatically.

## Next Slice

Implement one external provider request path, then keep generated geometry in a review queue before curated replacement.
