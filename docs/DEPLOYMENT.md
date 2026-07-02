# Deployment

## Target

- Hostname: `routeapp.plexplease.xyz`
- Runtime: Docker on the Unraid server
- Public access: existing Cloudflare Zero Trust remote-managed Tunnel / `cloudflared`
- Internal service: `routeapp:3000` on Docker network `appdata_media`

Completed implementation work should be deployed to this Unraid target and verified at `https://routeapp.plexplease.xyz/` unless the user explicitly says not to deploy.

## Source-Control Rule

Do not commit real credentials.

The app currently requires no runtime secrets. Cloudflare and SSH credentials are used from the local environment or existing Unraid configuration during deployment only. Keep real values in ignored env files, Cloudflare, or server-side appdata paths.

Use Git/GitHub as the release trail:

1. Commit a verified local checkpoint.
2. Push to `origin` at `https://github.com/Berky01/meaningful-routes.git`.
3. Deploy implementation changes to Unraid.
4. Verify the live URL.

Docs-only changes do not require a live app redeploy because the running container is unchanged.

The deployed `/api/build-info` response should match the pushed commit SHA after implementation deploys.

## Build Pattern

The app uses Next.js standalone output for a minimal production container:

- `next.config.mjs` sets `output: "standalone"`.
- `Dockerfile` builds with `npm ci` and copies `.next/standalone` plus `.next/static`.
- `docker-compose.routeapp.yml` attaches the container to the existing `appdata_media` network.

## Cloudflare Tunnel Route

The `plexplease` Cloudflare Tunnel is remote-managed in Zero Trust. Do not rely on editing the local Unraid `cloudflared` `config.yml` for public app routes. The local file is only used to start the connector; Cloudflare sends the active ingress config remotely.

Add a published application route in Cloudflare Zero Trust:

```yaml
Hostname: routeapp.plexplease.xyz
Service URL: http://routeapp:3000
```

Also create or update the public DNS record:

```txt
Type: CNAME
Name: routeapp
Target: <plexplease tunnel UUID>.cfargotunnel.com
Proxy: enabled
TTL: automatic
```

The current local `CLOUDFLARE_API_TOKEN` was rejected by Cloudflare during deployment (`Invalid access token`), so DNS/tunnel route updates require a refreshed API token or dashboard access.

## Verification

Before implementation deploys, run:

```powershell
npm run lint
npm run typecheck
npm run validate:data
npm run validate:routes
npm run validate:media
npm run build
```

After deployment:

```powershell
ssh plexplease "docker ps --filter name=routeapp --format '{{.Names}} {{.Status}}'"
ssh plexplease "docker exec cloudflared cloudflared tunnel --config /etc/cloudflared/config.yml ingress validate"
Invoke-WebRequest -Uri "https://routeapp.plexplease.xyz/" -UseBasicParsing
```
