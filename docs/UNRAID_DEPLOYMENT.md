# Unraid Deployment

## Required Defaults

- `DATA_SOURCE=mock`
- `NEXT_PUBLIC_MAP_STYLE_URL=` blank unless a hosted MapLibre style provider is configured
- `NEXT_PUBLIC_MAP_PROVIDER=fallback`
- `ROUTING_PROVIDER=none`
- `ENABLE_EXTERNAL_IMPORTS=false`
- `AI_PROVIDER=none`
- `ISSUE_REPORT_STORE_PATH=/app/runtime/issue-reports.json`
- `NEXT_PUBLIC_SITE_URL=https://routeapp.plexplease.xyz`
- Deploy completed implementation work to Unraid so the live public URL is `https://routeapp.plexplease.xyz/` unless explicitly paused.

The app boots without an external map key. When `NEXT_PUBLIC_MAP_STYLE_URL` is blank, the MapLibre shell uses the local fallback map, which renders stored place coordinates, route geometry, and markers without a tile provider.

## Build And Validate

```powershell
npm run lint
npm run typecheck
npm run validate:content
npm run validate:data
npm run validate:routes
npm run validate:media
npm run build
npm run test:smoke
```

## Docker Compose

Use `compose.example.yml` as the reference. The app exposes port `3000` to the Docker network and includes a healthcheck against `/api/health`.

Optional Postgres/PostGIS is behind the `postgres` profile:

```powershell
docker compose -f compose.example.yml --profile postgres up -d postgres
```

Do not switch `DATA_SOURCE=postgres` until the provider is implemented and restore-tested.

## Optional MapLibre Tiles

Set `NEXT_PUBLIC_MAP_STYLE_URL` only after choosing a hosted or self-hosted MapLibre-compatible style URL:

```env
NEXT_PUBLIC_MAP_STYLE_URL=https://basemaps.cartocdn.com/gl/positron-gl-style/style.json
NEXT_PUBLIC_MAP_ATTRIBUTION="&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors &copy; <a href=\"https://carto.com/attributions\">CARTO</a>"
NEXT_PUBLIC_MAP_PROVIDER=carto-positron
```

The running app reads these values through `/api/map-config`, so the Unraid container can change providers through compose environment or a local `.env` file without rebuilding the image.

Do not store private server keys in public variables. If a production provider requires secrets, use a provider-managed public style URL or a server-side proxy that emits a browser-safe style URL.

## Optional Routing

Routing engines are for future admin/build flows only. Leave these defaults for the live mock deployment:

```env
ROUTING_PROVIDER=none
ROUTING_BASE_URL=
ROUTING_PROFILE=walking
ROUTING_TIMEOUT_MS=10000
```

## Healthcheck

Container health uses:

```txt
GET http://127.0.0.1:3000/api/health
```

The endpoint returns data source, counts, validation status, and the number of public crawl paths generated from published routes and places.

## Data Validation

Run before deploys and after content edits:

```powershell
npm run validate:data
```

## Backup Notes

- Mock data is source-controlled TypeScript content.
- Placeholder media metadata is source-controlled; future local media should use `/app/public/media` or a mounted media volume.
- Browser saved/history state lives in user `localStorage` and is not server-backed.
- Public issue reports in mock mode are stored in the `routeapp_runtime` Docker volume at `ISSUE_REPORT_STORE_PATH`; include that volume in Unraid backup snapshots if reports must survive container rebuilds and host failures.
- Future Postgres backups should include `pg_dump`, volume snapshot notes, and a restore drill before production use.

## Update Procedure

1. Pull or copy the updated app files.
2. Run lint, typecheck, data validation, and build.
3. Rebuild the container.
4. Start the app container on the `appdata_media` network.
5. Confirm `/api/health` returns healthy.
6. Confirm Cloudflare routes `routeapp.plexplease.xyz` to `http://routeapp:3000`.
