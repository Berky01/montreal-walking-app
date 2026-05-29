import { describe, expect, it } from 'vitest';
import { montrealCityProfile } from '../cityProfiles';
import type { POI } from '../mvpTypes';
import { createCachedPOIProvider } from './cachedPOIProvider';

const importedCafe: POI = {
  id: 'osm-111',
  cityId: 'montreal',
  name: 'Imported Cafe',
  category: 'cafes',
  coordinate: { lat: 45.5235, lng: -73.5995 },
  source: 'osm-overpass',
  sourceOsmId: '111',
  moods: ['coffee', 'energetic'],
  interestTags: ['cafes'],
  computedRouteValue: 80,
  lastImportedAt: '2026-05-26T00:00:00.000Z',
};

describe('cached POI provider', () => {
  it('uses imported cache POIs before seeded fallback data', async () => {
    const provider = createCachedPOIProvider({
      loadPois: async () => [importedCafe],
    });

    const pois = await provider.findNearby({
      city: montrealCityProfile,
      center: { lat: 45.5234, lng: -73.5996 },
      radiusMeters: 1200,
      interests: ['cafes'],
      mood: 'coffee',
    });

    expect(pois[0]).toEqual(expect.objectContaining({
      id: 'osm-111',
      source: 'osm-overpass',
      name: 'Imported Cafe',
    }));
  });

  it('falls back to seed POIs when the cache cannot be loaded', async () => {
    const provider = createCachedPOIProvider({
      loadPois: async () => {
        throw new Error('cache unavailable');
      },
    });

    const pois = await provider.findNearby({
      city: montrealCityProfile,
      center: { lat: 45.5234, lng: -73.5996 },
      radiusMeters: 1200,
      interests: ['parks'],
      mood: 'calm',
    });

    expect(pois.length).toBeGreaterThan(0);
    expect(pois.some((poi) => poi.source === 'osm-seed' || poi.source === 'curated')).toBe(true);
  });

  it('filters malformed cached POIs with non-finite coordinates', async () => {
    const invalidPoi: POI = {
      ...importedCafe,
      id: 'bad-cache-poi',
      coordinate: { lat: Number.NaN, lng: Number.POSITIVE_INFINITY },
    };
    const provider = createCachedPOIProvider({
      loadPois: async () => [invalidPoi, importedCafe],
      fallbackPois: [],
    });

    const pois = await provider.findNearby({
      city: montrealCityProfile,
      center: { lat: 45.5234, lng: -73.5996 },
      radiusMeters: 1200,
      interests: ['cafes'],
      mood: 'coffee',
    });

    expect(pois).toEqual([importedCafe]);
  });
});
