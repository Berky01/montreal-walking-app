# Unraid Deployment

Run the MVP with Docker Compose behind your Unraid reverse proxy.

For local development, run `npm run setup:env`, run `npm run dev:api`, then run `npm run dev`. The API loads `.env` automatically and stores POIs/routes under `data/` unless you override the paths.

1. Run `npm run setup:env` to create `.env` and generate local `POSTGRES_PASSWORD` and `ADMIN_TOKEN` values. The command repairs only blank/default local secrets and leaves provider keys untouched.
2. For Unraid, set `APP_DATA_DIR` to the host folder you want to back up, and keep `POI_CACHE_PATH=/app/data/montreal-pois.json` and `ROUTE_STORE_PATH=/app/data/route-store.json`.
3. Add provider keys when replacing seeded providers with live calls. `MAPTILER_API_KEY` powers the browser map and is exposed through `/api/client-config`, so use a browser-restricted MapTiler key. `GEOAPIFY_API_KEY` powers live address search and the default walking routing provider. `MAPBOX_ACCESS_TOKEN` is optional and kept only as a future routing fallback.
4. Run `npm run import:pois` to refresh `POI_CACHE_PATH` before deploy. The command exits non-zero if Overpass returns partial import errors or the cache does not cover every MVP interest category. Partial imports do not overwrite the existing cache.
5. Run `docker compose up -d --build`.
6. Put the frontend behind HTTPS through Nginx Proxy Manager, Caddy, or Traefik.

Docker Compose mounts `${APP_DATA_DIR:-./data}` to `/app/data` in the API container. Use the same host data directory for `npm run import:pois`, route persistence, and backups so imported POIs are visible to the deployed API.
When `POI_CACHE_PATH` starts with `/app/data/`, `npm run import:pois` writes to the matching path under `APP_DATA_DIR` on the host.
After startup, run `docker compose ps` and confirm the frontend, API, and PostGIS containers are healthy before routing traffic through the reverse proxy.

Use `GET /api/health/providers` to inspect provider configuration. Use `GET /api/health/live` for live readiness checks: it returns `200` only when maps, geocoding, routing, the POI cache, persistence, and the admin token are configured; otherwise it returns `503` with the missing items.
Do not deploy a partial live route setup. `MAPTILER_API_KEY` and `GEOAPIFY_API_KEY` must be configured together for the current live MVP: MapTiler serves the map, Geoapify handles geocoding, and Geoapify Routing generates walking geometry. `MAPBOX_ACCESS_TOKEN` is optional; if it is present, Mapbox remains available as a routing fallback path in the codebase, but it is not required for live readiness. For local seeded testing, set `USE_SEEDED_PROVIDERS=true`.

The operator panel is hidden from the public app unless `ENABLE_OPS_PANEL=true` is set and the URL includes `?ops=1`. Keep it disabled for normal public launches; enable it temporarily when you need browser access to provider self-tests, POI import, route smoke tests, feedback review, or route debug tools. Admin actions still require `ADMIN_TOKEN`.

Run `npm run doctor` after starting or restarting the API to check environment keys, `/api/health/providers`, `/api/health/live`, `/api/client-config`, provider self-tests, and canonical Montréal route smoke tests in one pass. If `.env` changes, restart the API before trusting health results. Set `DOCTOR_API_BASE_URL=https://your-domain.example` when checking the deployed reverse-proxy URL instead of the local API port. Set `DOCTOR_PUBLIC_BASE_URL=https://your-domain.example` to also verify the HTTPS public URL, public frontend returns the app shell, proxied `/api/health/providers`, proxied `/api/health/live`, proxied `/api/client-config`, public `/api/geocode`, and public `/api/routes/generate`.
The doctor can pass provider readiness while still failing route smoke tests if a generated route is below the launch-quality threshold. Treat that as a route-quality/scoring issue, not a missing-key issue.
When `DOCTOR_PUBLIC_BASE_URL` is set, the doctor warns if `ENABLE_OPS_PANEL=true` is still enabled. Disable it before public launch after provider and route smoke checks are complete.

Route generation and geocoding are rate-limited per client address. Tune `ROUTE_GENERATION_RATE_LIMIT_MAX`, `ROUTE_GENERATION_RATE_LIMIT_WINDOW_MS`, `GEOCODE_RATE_LIMIT_MAX`, and `GEOCODE_RATE_LIMIT_WINDOW_MS` if your provider quotas require stricter limits.

By default, Compose binds the API and Postgres ports to `127.0.0.1` only. Keep that default for public deployments and route browser traffic through the frontend container, which proxies `/api` internally. Set `API_BIND=0.0.0.0` or `POSTGRES_BIND=0.0.0.0` only when you intentionally need LAN access.

Browser geolocation only works on HTTPS origins. Do not expose this publicly without replacing default secrets.
