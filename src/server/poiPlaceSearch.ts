import { isInsideCityBounds } from '../domain/cityProfiles';
import type { CityProfile, GeocodedPlace, POI } from '../domain/mvpTypes';

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function nameMatchScore(query: string, name: string) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedName = normalizeSearchText(name);

  if (!normalizedQuery || !normalizedName.includes(normalizedQuery)) return 0;
  if (normalizedName === normalizedQuery) return 100;
  if (normalizedName.startsWith(normalizedQuery)) return 85;
  return 65;
}

export function searchPOIStartPlaces(
  query: string,
  pois: POI[],
  city: CityProfile,
  limit = 5,
): GeocodedPlace[] {
  return pois
    .filter((poi) => poi.name && poi.cityId === city.id && isInsideCityBounds(poi.coordinate, city))
    .map((poi) => ({
      poi,
      score: nameMatchScore(query, poi.name),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      const routeValueA = a.poi.curatedRouteValue ?? a.poi.computedRouteValue;
      const routeValueB = b.poi.curatedRouteValue ?? b.poi.computedRouteValue;

      return b.score - a.score || routeValueB - routeValueA || a.poi.name.localeCompare(b.poi.name);
    })
    .slice(0, limit)
    .map(({ poi }) => ({
      id: `poi-${poi.id}`,
      label: poi.name,
      coordinate: poi.coordinate,
    }));
}
