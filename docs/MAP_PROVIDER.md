# Map Provider

## Current Behavior

The app uses MapLibre GL JS as the browser map renderer. It does not load Mapbox GL, does not require a Mapbox token, and does not choose a public OpenStreetMap tile server by default.

When `NEXT_PUBLIC_MAP_STYLE_URL` is blank, `components/map/map-shell.tsx` renders the local `MapFallback`. The fallback uses stored place and route coordinates, so pages still boot and remain usable without an external map provider.

## Configuration

Set these public variables for a real tile-backed MapLibre map:

```env
NEXT_PUBLIC_MAP_STYLE_URL="https://tiles.example.com/style.json"
NEXT_PUBLIC_MAP_ATTRIBUTION="Example tiles and data attribution"
NEXT_PUBLIC_MAP_PROVIDER="example"
NEXT_PUBLIC_DEFAULT_CITY="montreal"
NEXT_PUBLIC_DEFAULT_CENTER_LAT="45.5017"
NEXT_PUBLIC_DEFAULT_CENTER_LNG="-73.5673"
```

These values are public by design because the browser loads the style. Do not put private server keys in public variables. If a provider requires a secret token, issue a browser-safe style URL through a server-side proxy or provider-managed public key.

## Data Flow

- `lib/data/geojson.ts` converts places to GeoJSON Point features and routes to LineString features.
- Place feature properties include public UI fields such as id, slug, name, category, neighborhood, summary, tags, and related route count.
- Internal QA fields such as source quality are not added to public map popups.
- Route geometry uses curated stored geometry when available. If route geometry is missing, helpers can derive a temporary LineString from ordered stop coordinates.
- Invalid or missing coordinates are filtered before they reach MapLibre sources.

## Renderer

- `components/map/map-shell.tsx` dynamically imports `maplibre-gl`.
- Places render as clustered place-first pins.
- Route lines render as optional overlays when route context is supplied.
- Route stops render as numbered secondary points on route detail and live route maps.
- `components/map/MapFallback.tsx` remains the no-provider fallback for missing config or style load failures.
- `app/layout.tsx` imports `maplibre-gl/dist/maplibre-gl.css`.

## Provider Rules

- Changing tile providers should require env/config changes only.
- Production should use a configured hosted or self-hosted vector tile/style provider.
- Do not rely on public OpenStreetMap raster tiles as the production default.
- Keep attribution visible when a tile-backed map is configured.
- Keep external map calls optional so `DATA_SOURCE=mock` and local boot keep working.

## Future Self-Hosted OSM Plan

Self-hosted OSM tiles are intentionally not implemented yet. The intended path is:

1. Download a city or regional OSM extract.
2. Generate vector tiles from that extract.
3. Serve the vector tiles and style JSON from an internal tile service.
4. Set `NEXT_PUBLIC_MAP_STYLE_URL` to the self-hosted style URL.
5. Set `NEXT_PUBLIC_MAP_ATTRIBUTION` to the required OSM and provider attribution.

Current limitations: no live geolocation, no turn-by-turn routing, no offline tiles, and some route lines are derived from stored stop coordinates rather than surveyed walking geometry.
