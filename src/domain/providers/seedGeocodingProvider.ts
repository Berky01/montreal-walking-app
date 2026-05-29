import { isInsideCityBounds } from '../cityProfiles';
import type { CityProfile, GeocodedPlace, GeocodingProvider } from '../mvpTypes';

const places: GeocodedPlace[] = [
  { id: 'place-mile-end', label: 'Mile End', coordinate: { lat: 45.5234, lng: -73.5996 } },
  { id: 'place-station-laurier', label: 'Station Laurier', coordinate: { lat: 45.5272, lng: -73.5897 } },
  { id: 'place-parc-la-fontaine', label: 'Parc La Fontaine', coordinate: { lat: 45.5273, lng: -73.5704 } },
  { id: 'place-verdun', label: 'Verdun waterfront', coordinate: { lat: 45.4594, lng: -73.5721 } },
  { id: 'place-old-montreal', label: 'Old Montréal', coordinate: { lat: 45.505, lng: -73.556 } },
];

export function createSeedGeocodingProvider(): GeocodingProvider {
  return {
    async search(query: string, city: CityProfile) {
      const normalized = query.trim().toLowerCase();

      return places.filter(
        (place) =>
          place.label.toLowerCase().includes(normalized) &&
          isInsideCityBounds(place.coordinate, city),
      );
    },
    async reverse(coordinate) {
      return {
        id: 'reverse-seed',
        label: `${coordinate.lat.toFixed(4)}, ${coordinate.lng.toFixed(4)}`,
        coordinate,
      };
    },
  };
}
