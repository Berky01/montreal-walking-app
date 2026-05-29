import { describe, expect, it } from 'vitest';
import { runProviderSelfTest } from './providerSelfTest';

describe('provider self-test', () => {
  it('reports skipped checks when live provider keys are missing', async () => {
    const result = await runProviderSelfTest({
      env: {},
      fetcher: async () => {
        throw new Error('fetch should not be called');
      },
    });

    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'maptiler-style', status: 'skipped' }),
        expect.objectContaining({ id: 'geoapify-geocode', status: 'skipped' }),
        expect.objectContaining({ id: 'mapbox-walking-route', status: 'skipped' }),
      ]),
    );
    expect(result.ok).toBe(false);
  });

  it('reports skipped checks instead of calling providers when keys are placeholders', async () => {
    const result = await runProviderSelfTest({
      env: {
        MAPTILER_API_KEY: 'replace-with-maptiler-key',
        GEOAPIFY_API_KEY: 'your-geoapify-api-key',
        MAPBOX_ACCESS_TOKEN: 'mapbox-token-here',
      },
      fetcher: async () => {
        throw new Error('fetch should not be called for placeholders');
      },
    });

    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'maptiler-style', status: 'skipped' }),
        expect.objectContaining({ id: 'geoapify-geocode', status: 'skipped' }),
        expect.objectContaining({ id: 'mapbox-walking-route', status: 'skipped' }),
      ]),
    );
    expect(result.ok).toBe(false);
  });

  it('runs lightweight checks against configured live providers', async () => {
    const requestedUrls: string[] = [];
    const result = await runProviderSelfTest({
      env: {
        MAPTILER_API_KEY: 'maptiler-key',
        GEOAPIFY_API_KEY: 'geoapify-key',
        MAPBOX_ACCESS_TOKEN: 'mapbox-key',
      },
      fetcher: async (input) => {
        const url = String(input);

        requestedUrls.push(url);

        if (url.includes('api.maptiler.com')) {
          return { ok: true, json: async () => ({ version: 8 }) } as Response;
        }

        if (url.includes('api.geoapify.com/v1/routing')) {
          return {
            ok: true,
            json: async () => ({
              features: [
                {
                  properties: { distance: 900, time: 700 },
                  geometry: {
                    type: 'LineString',
                    coordinates: [[-73.5996, 45.5234], [-73.598, 45.524], [-73.5996, 45.5234]],
                  },
                },
              ],
            }),
          } as Response;
        }

        if (url.includes('api.geoapify.com')) {
          return {
            ok: true,
            json: async () => ({
              features: [
                {
                  properties: {
                    place_id: 'laurier',
                    formatted: 'Station Laurier, Montréal',
                    lat: 45.5272,
                    lon: -73.5897,
                  },
                },
              ],
            }),
          } as Response;
        }

        if (url.includes('api.mapbox.com')) {
          return {
            ok: true,
            json: async () => ({
              routes: [
                {
                  geometry: { coordinates: [[-73.5996, 45.5234], [-73.598, 45.524], [-73.5996, 45.5234]] },
                  distance: 900,
                  duration: 700,
                },
              ],
            }),
          } as Response;
        }

        throw new Error(`Unexpected URL ${url}`);
      },
    });

    expect(result.ok).toBe(true);
    expect(result.checks.every((check) => check.status === 'ok')).toBe(true);
    expect(requestedUrls.some((url) => url.includes('api.maptiler.com'))).toBe(true);
    expect(requestedUrls.some((url) => url.includes('api.geoapify.com'))).toBe(true);
    expect(requestedUrls.some((url) => url.includes('api.geoapify.com/v1/routing'))).toBe(true);
  });

  it('reports failed provider checks without throwing', async () => {
    const result = await runProviderSelfTest({
      env: {
        GEOAPIFY_API_KEY: 'bad-key',
      },
      fetcher: async () => ({ ok: false, status: 401, text: async () => 'Unauthorized' }) as Response,
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'geoapify-geocode',
          status: 'failed',
          message: expect.stringContaining('401'),
        }),
      ]),
    );
  });

  it('times out MapTiler style checks instead of hanging provider self-test', async () => {
    const result = await runProviderSelfTest({
      env: {
        MAPTILER_API_KEY: 'maptiler-key',
      },
      fetcher: async () => new Promise<Response>(() => {}),
      timeoutMs: 1,
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'maptiler-style',
          status: 'failed',
          message: 'MapTiler style timed out after 1ms.',
        }),
      ]),
    );
  });
});
