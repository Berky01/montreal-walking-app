import type { POI, POIProvider, POISearchInput } from '../mvpTypes';
import { seedPois } from '../seedPois';

interface CachedPOIProviderOptions {
  loadPois: () => Promise<POI[]>;
  fallbackPois?: POI[];
}

function roughDistanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const latMeters = (a.lat - b.lat) * 111_320;
  const lngMeters = (a.lng - b.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180);

  return Math.sqrt(latMeters ** 2 + lngMeters ** 2);
}

function hasUsableCoordinate(poi: POI) {
  return Number.isFinite(poi.coordinate.lat) && Number.isFinite(poi.coordinate.lng);
}

function rankPOIs(pois: POI[], input: POISearchInput): POI[] {
  return pois
    .filter((poi) => poi.cityId === input.city.id)
    .filter(hasUsableCoordinate)
    .map((poi) => ({
      poi,
      distance: roughDistanceMeters(input.center, poi.coordinate),
      interestMatch: poi.interestTags.some((tag) => input.interests.includes(tag)),
      moodMatch: poi.moods.includes(input.mood),
    }))
    .filter((item) => item.distance <= input.radiusMeters || item.interestMatch || item.moodMatch)
    .sort((a, b) => {
      const aScore =
        (a.interestMatch ? 30 : 0) +
        (a.moodMatch ? 20 : 0) +
        (a.poi.curatedRouteValue ?? a.poi.computedRouteValue) -
        a.distance / 500;
      const bScore =
        (b.interestMatch ? 30 : 0) +
        (b.moodMatch ? 20 : 0) +
        (b.poi.curatedRouteValue ?? b.poi.computedRouteValue) -
        b.distance / 500;

      return bScore - aScore;
    })
    .map((item) => item.poi);
}

export function createCachedPOIProvider(options: CachedPOIProviderOptions): POIProvider {
  const fallbackPois = options.fallbackPois ?? seedPois;

  return {
    async findNearby(input: POISearchInput) {
      try {
        const cachedPois = await options.loadPois();
        const ranked = rankPOIs(cachedPois, input);

        if (ranked.length > 0) return ranked;
      } catch {
        return rankPOIs(fallbackPois, input);
      }

      return rankPOIs(fallbackPois, input);
    },
  };
}
