import { seedPois } from '../seedPois';
import type { POIProvider, POISearchInput } from '../mvpTypes';

function roughDistanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const latMeters = (a.lat - b.lat) * 111_320;
  const lngMeters = (a.lng - b.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.sqrt(latMeters ** 2 + lngMeters ** 2);
}

export function createSeedPOIProvider(): POIProvider {
  return {
    async findNearby(input: POISearchInput) {
      return seedPois
        .filter((poi) => poi.cityId === input.city.id)
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
    },
  };
}
