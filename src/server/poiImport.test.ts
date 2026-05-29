import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getPOICacheStatus, importOverpassPOIs } from './poiImport';

describe('POI import', () => {
  it('imports Overpass POIs in category batches and reports category counts', async () => {
    const requestedQueries: string[] = [];
    const result = await importOverpassPOIs({
      fetcher: async (_input, init) => {
        const body = init?.body as URLSearchParams;
        const query = body.get('data') ?? '';

        requestedQueries.push(query);

        if (query.includes('amenity"="cafe')) {
          return {
            ok: true,
            json: async () => ({
              elements: [
                { type: 'node', id: 1, lat: 45.52, lon: -73.6, tags: { amenity: 'cafe', name: 'Cafe One' } },
              ],
            }),
          } as Response;
        }

        if (query.includes('leisure"="park')) {
          return {
            ok: true,
            json: async () => ({
              elements: [
                { type: 'way', id: 2, center: { lat: 45.53, lon: -73.59 }, tags: { leisure: 'park', name: 'Park Two' } },
              ],
            }),
          } as Response;
        }

        return { ok: true, json: async () => ({ elements: [] }) } as Response;
      },
    });

    expect(requestedQueries.length).toBeGreaterThan(3);
    expect(result.imported).toBe(2);
    expect(result.categoryCounts).toEqual({
      cafes: 1,
      parks: 1,
    });
  });

  it('keeps OSM nodes, ways, and relations with the same numeric id as distinct POIs', async () => {
    const result = await importOverpassPOIs({
      fetcher: async (_input, init) => {
        const body = init?.body as URLSearchParams;
        const query = body.get('data') ?? '';

        if (!query.includes('leisure"="park')) {
          return { ok: true, json: async () => ({ elements: [] }) } as Response;
        }

        return {
          ok: true,
          json: async () => ({
            elements: [
              { type: 'node', id: 42, lat: 45.52, lon: -73.6, tags: { leisure: 'park', name: 'Park Node' } },
              { type: 'way', id: 42, center: { lat: 45.53, lon: -73.59 }, tags: { leisure: 'park', name: 'Park Way' } },
              { type: 'relation', id: 42, center: { lat: 45.54, lon: -73.58 }, tags: { leisure: 'park', name: 'Park Relation' } },
            ],
          }),
        } as Response;
      },
    });

    expect(result.imported).toBe(3);
    expect(result.categoryCounts).toEqual({ parks: 3 });
  });

  it('excludes malformed Overpass elements from import results and counts', async () => {
    const result = await importOverpassPOIs({
      fetcher: async (_input, init) => {
        const body = init?.body as URLSearchParams;
        const query = body.get('data') ?? '';

        if (!query.includes('amenity"="cafe')) {
          return { ok: true, json: async () => ({ elements: [] }) } as Response;
        }

        return {
          ok: true,
          json: async () => ({
            elements: [
              { type: 'node', id: 1, lat: Number.NaN, lon: -73.6, tags: { amenity: 'cafe', name: 'Bad Cafe' } },
              { type: 'node', id: 2, lat: 45.52, lon: -73.6, tags: { amenity: 'cafe', name: 'Good Cafe' } },
            ],
          }),
        } as Response;
      },
    });

    expect(result.imported).toBe(1);
    expect(result.categoryCounts).toEqual({ cafes: 1 });
    expect(result.pois).toEqual([
      expect.objectContaining({
        id: 'osm-node-2',
        name: 'Good Cafe',
      }),
    ]);
  });

  it('stores and reads category counts from the POI cache', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-poi-cache-'));
    const cachePath = join(tempDir, 'pois.json');

    try {
      await importOverpassPOIs({
        cachePath,
        fetcher: async (_input, init) => {
          const body = init?.body as URLSearchParams;
          const query = body.get('data') ?? '';

          if (!query.includes('amenity"="cafe')) {
            return { ok: true, json: async () => ({ elements: [] }) } as Response;
          }

          return {
            ok: true,
            json: async () => ({
              elements: [
                { type: 'node', id: 1, lat: 45.52, lon: -73.6, tags: { amenity: 'cafe', name: 'Cafe One' } },
              ],
            }),
          } as Response;
        },
      });

      const rawCache = JSON.parse(await readFile(cachePath, 'utf8')) as { categoryCounts?: Record<string, number> };

      expect(rawCache.categoryCounts).toEqual({ cafes: 1 });
      expect(getPOICacheStatus(cachePath)).toEqual(
        expect.objectContaining({
          cacheAvailable: true,
          count: 1,
          categoryCounts: { cafes: 1 },
        }),
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('computes POI cache status from usable POIs instead of trusting stale category metadata', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-poi-cache-stale-counts-'));
    const cachePath = join(tempDir, 'pois.json');

    try {
      await writeFile(cachePath, JSON.stringify({
        importedAt: '2026-05-26T00:00:00.000Z',
        source: 'overpass-api',
        sourceLicense: 'ODbL',
        categoryCounts: { cafes: 2, parks: 4 },
        pois: [
          {
            id: 'bad-cafe',
            cityId: 'montreal',
            name: 'Bad Cafe',
            category: 'cafes',
            coordinate: { lat: Number.NaN, lng: Number.POSITIVE_INFINITY },
            source: 'osm-overpass',
            sourceOsmId: 'node/1',
            moods: ['coffee'],
            interestTags: ['cafes'],
            computedRouteValue: 80,
            lastImportedAt: '2026-05-26T00:00:00.000Z',
          },
          {
            id: 'valid-park',
            cityId: 'montreal',
            name: 'Valid Park',
            category: 'parks',
            coordinate: { lat: 45.52, lng: -73.6 },
            source: 'osm-overpass',
            sourceOsmId: 'node/2',
            moods: ['green'],
            interestTags: ['parks'],
            computedRouteValue: 80,
            lastImportedAt: '2026-05-26T00:00:00.000Z',
          },
        ],
      }, null, 2));

      expect(getPOICacheStatus(cachePath)).toEqual(
        expect.objectContaining({
          cacheAvailable: true,
          count: 1,
          categoryCounts: { parks: 1 },
        }),
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('reports category import errors even when some POIs were imported', async () => {
    const result = await importOverpassPOIs({
      fetcher: async (_input, init) => {
        const body = init?.body as URLSearchParams;
        const query = body.get('data') ?? '';

        if (query.includes('amenity"="cafe')) {
          return {
            ok: true,
            json: async () => ({
              elements: [
                { type: 'node', id: 1, lat: 45.52, lon: -73.6, tags: { amenity: 'cafe', name: 'Cafe One' } },
              ],
            }),
          } as Response;
        }

        if (query.includes('leisure"="park')) {
          return {
            ok: false,
            status: 429,
            text: async () => 'rate limited',
          } as Response;
        }

        return { ok: true, json: async () => ({ elements: [] }) } as Response;
      },
    });

    expect(result.imported).toBe(1);
    expect(result.importErrors).toEqual([
      'parks: 429 rate limited',
    ]);
  });

  it('times out Overpass imports instead of hanging the admin import job', async () => {
    await expect(importOverpassPOIs({
      fetcher: async () => new Promise<Response>(() => {}),
      timeoutMs: 1,
    })).rejects.toThrow('Overpass POI import failed: cafes: Overpass POI import timed out after 1ms.');
  });

  it('does not overwrite an existing POI cache when an import has partial errors', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-poi-cache-protect-'));
    const cachePath = join(tempDir, 'pois.json');
    const originalCache = {
      importedAt: '2026-05-26T00:00:00.000Z',
      source: 'overpass-api',
      sourceLicense: 'ODbL',
      categoryCounts: { cafes: 1, parks: 1 },
      pois: [
        {
          id: 'original-cafe',
          cityId: 'montreal',
          name: 'Original Cafe',
          category: 'cafes',
          coordinate: { lat: 45.52, lng: -73.6 },
          source: 'osm-overpass',
          sourceOsmId: '1',
          moods: ['coffee'],
          interestTags: ['cafes'],
          computedRouteValue: 75,
          lastImportedAt: '2026-05-26T00:00:00.000Z',
        },
      ],
    };

    try {
      await writeFile(cachePath, JSON.stringify(originalCache, null, 2));
      const result = await importOverpassPOIs({
        cachePath,
        fetcher: async (_input, init) => {
          const body = init?.body as URLSearchParams;
          const query = body.get('data') ?? '';

          if (query.includes('amenity"="cafe')) {
            return {
              ok: true,
              json: async () => ({
                elements: [
                  { type: 'node', id: 999, lat: 45.52, lon: -73.6, tags: { amenity: 'cafe', name: 'Partial Cafe' } },
                ],
              }),
            } as Response;
          }

          if (query.includes('leisure"="park')) {
            return {
              ok: false,
              status: 429,
              text: async () => 'rate limited',
            } as Response;
          }

          return { ok: true, json: async () => ({ elements: [] }) } as Response;
        },
      });
      const cacheAfterImport = JSON.parse(await readFile(cachePath, 'utf8'));

      expect(result.cached).toBe(false);
      expect(result.importErrors).toEqual(['parks: 429 rate limited']);
      expect(cacheAfterImport).toEqual(originalCache);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
