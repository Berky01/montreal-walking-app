import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('deployment configuration', () => {
  it('does not provide a default placeholder admin token in Docker Compose', () => {
    const compose = readFileSync('docker-compose.yml', 'utf8');

    expect(compose).not.toContain('ADMIN_TOKEN: ${ADMIN_TOKEN:-change-me}');
    expect(compose).toContain('ADMIN_TOKEN: ${ADMIN_TOKEN:-}');
  });

  it('documents the live readiness probe for deployment checks', () => {
    const deployReadme = readFileSync('deploy/README.md', 'utf8');
    const packageJson = readFileSync('package.json', 'utf8');

    expect(deployReadme).toContain('/api/health/live');
    expect(deployReadme).toContain('/api/health/providers');
    expect(deployReadme).toContain('npm run setup:env');
    expect(deployReadme).toContain('npm run import:pois');
    expect(deployReadme).toContain('partial import errors');
    expect(deployReadme).toContain('Partial imports do not overwrite the existing cache');
    expect(deployReadme).toContain('npm run doctor');
    expect(deployReadme).toContain('DOCTOR_PUBLIC_BASE_URL');
    expect(deployReadme).toContain('proxied `/api/client-config`');
    expect(deployReadme).toContain('proxied `/api/health/live`');
    expect(deployReadme).toContain('public `/api/geocode`');
    expect(deployReadme).toContain('public `/api/routes/generate`');
    expect(deployReadme).toContain('frontend returns the app shell');
    expect(deployReadme).toContain('HTTPS public URL');
    expect(deployReadme).toContain('Do not deploy a partial live route setup');
    expect(deployReadme).toContain('`MAPTILER_API_KEY` and `GEOAPIFY_API_KEY` must be configured together');
    expect(deployReadme).toContain('`MAPBOX_ACCESS_TOKEN` is optional');
    expect(deployReadme).toContain('below the launch-quality threshold');
    expect(packageJson).toContain('"doctor"');
    expect(packageJson).toContain('"setup:env"');
    expect(packageJson).toContain('"import:pois"');
  });

  it('binds API and database ports to localhost by default', () => {
    const compose = readFileSync('docker-compose.yml', 'utf8');
    const envExample = readFileSync('.env.example', 'utf8');

    expect(compose).toContain('${API_BIND:-127.0.0.1}:${API_PORT:-5174}:5174');
    expect(compose).toContain('${POSTGRES_BIND:-127.0.0.1}:${POSTGRES_PORT:-5432}:5432');
    expect(envExample).toContain('API_BIND=127.0.0.1');
    expect(envExample).toContain('POSTGRES_BIND=127.0.0.1');
  });

  it('documents route and geocode rate-limit environment variables', () => {
    const compose = readFileSync('docker-compose.yml', 'utf8');
    const envExample = readFileSync('.env.example', 'utf8');
    const deployReadme = readFileSync('deploy/README.md', 'utf8');

    expect(compose).toContain('GEOCODE_RATE_LIMIT_MAX: ${GEOCODE_RATE_LIMIT_MAX:-60}');
    expect(compose).toContain('GEOCODE_RATE_LIMIT_WINDOW_MS: ${GEOCODE_RATE_LIMIT_WINDOW_MS:-60000}');
    expect(envExample).toContain('GEOCODE_RATE_LIMIT_MAX=60');
    expect(envExample).toContain('GEOCODE_RATE_LIMIT_WINDOW_MS=60000');
    expect(deployReadme).toContain('GEOCODE_RATE_LIMIT_MAX');
  });

  it('mounts host data into the API container so imported POIs are deployed and backed up', () => {
    const compose = readFileSync('docker-compose.yml', 'utf8');
    const deployReadme = readFileSync('deploy/README.md', 'utf8');

    expect(compose).toContain('${APP_DATA_DIR:-./data}:/app/data');
    expect(compose).not.toContain('walking_api_data:/app/data');
    expect(compose).not.toContain('walking_api_data:');
    expect(deployReadme).toContain('APP_DATA_DIR');
    expect(deployReadme).toContain('same host data directory');
    expect(deployReadme).toContain('npm run import:pois` writes to the matching path under `APP_DATA_DIR`');
  });

  it('uses container data paths in Docker even when local .env uses host-relative paths', () => {
    const compose = readFileSync('docker-compose.yml', 'utf8');

    expect(compose).toContain('POI_CACHE_PATH: /app/data/montreal-pois.json');
    expect(compose).toContain('ROUTE_STORE_PATH: /app/data/route-store.json');
    expect(compose).not.toContain('POI_CACHE_PATH: ${POI_CACHE_PATH:-/app/data/montreal-pois.json}');
    expect(compose).not.toContain('ROUTE_STORE_PATH: ${ROUTE_STORE_PATH:-/app/data/route-store.json}');
  });

  it('keeps local secrets, cached data, and dependencies out of Docker build context', () => {
    const dockerIgnore = readFileSync('.dockerignore', 'utf8');

    expect(dockerIgnore).toContain('.env');
    expect(dockerIgnore).toContain('node_modules');
    expect(dockerIgnore).toContain('dist');
    expect(dockerIgnore).toContain('data');
    expect(dockerIgnore).toContain('.git');
  });

  it('defines Docker health checks for frontend, API, and PostGIS services', () => {
    const compose = readFileSync('docker-compose.yml', 'utf8');
    const deployReadme = readFileSync('deploy/README.md', 'utf8');

    expect(compose).toContain('healthcheck:');
    expect(compose).toContain('http://127.0.0.1:80/');
    expect(compose).toContain('http://127.0.0.1:5174/api/health/providers');
    expect(compose).toContain('pg_isready -U walking -d walking');
    expect(compose).toContain('condition: service_healthy');
    expect(deployReadme).toContain('docker compose ps');
    expect(deployReadme).toContain('healthy');
  });

  it('checks the frontend API proxy in Docker health checks', () => {
    const compose = readFileSync('docker-compose.yml', 'utf8');

    expect(compose).toContain('http://127.0.0.1:80/');
    expect(compose).toContain('http://127.0.0.1:80/api/health/providers');
  });

  it('keeps MapLibre out of the initial app bundle by lazy-loading the live map renderer', () => {
    const routeMapSource = readFileSync('src/components/RouteMap.tsx', 'utf8');

    expect(routeMapSource).not.toMatch(/^import maplibregl from 'maplibre-gl';$/m);
    expect(routeMapSource).toContain("await import('maplibre-gl')");
  });
});
