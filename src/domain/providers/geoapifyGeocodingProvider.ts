import { isInsideCityBounds } from '../cityProfiles';
import type { CityProfile, GeocodedPlace, GeocodingProvider } from '../mvpTypes';
import { fetchWithTimeout } from './fetchWithTimeout';

interface GeoapifyOptions {
  apiKey?: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

function isFiniteCoordinate(coordinate: { lat: number; lng: number }) {
  return Number.isFinite(coordinate.lat) && Number.isFinite(coordinate.lng);
}

export function createGeoapifyGeocodingProvider(options: GeoapifyOptions): GeocodingProvider {
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? 8_000;

  return {
    async search(query: string, city: CityProfile): Promise<GeocodedPlace[]> {
      if (!options.apiKey) return [];

      const params = new URLSearchParams({
        text: query,
        apiKey: options.apiKey,
        limit: '6',
        filter: `rect:${city.bounds.west},${city.bounds.south},${city.bounds.east},${city.bounds.north}`,
        bias: `proximity:${city.center.lng},${city.center.lat}`,
      });
      const response = await fetchWithTimeout(
        fetcher,
        `https://api.geoapify.com/v1/geocode/search?${params.toString()}`,
        undefined,
        timeoutMs,
        `Geoapify geocoding timed out after ${timeoutMs}ms.`,
      );

      if (!response.ok) throw new Error(`Geoapify geocoding failed with ${response.status}`);

      const data = await response.json() as {
        features?: Array<{
          properties?: {
            place_id?: string | number;
            formatted?: string;
            lat?: number;
            lon?: number;
          };
        }>;
      };

      return (data.features ?? [])
        .map((feature): GeocodedPlace | null => {
          const properties = feature.properties;

          if (!properties?.formatted || typeof properties.lat !== 'number' || typeof properties.lon !== 'number') {
            return null;
          }

          return {
            id: String(properties.place_id ?? properties.formatted),
            label: properties.formatted,
            coordinate: { lat: properties.lat, lng: properties.lon },
          };
        })
        .filter((place): place is GeocodedPlace => Boolean(place))
        .filter((place) => isInsideCityBounds(place.coordinate, city));
    },

    async reverse(coordinate: { lat: number; lng: number }): Promise<GeocodedPlace | null> {
      if (!options.apiKey) return null;
      if (!isFiniteCoordinate(coordinate)) return null;

      const params = new URLSearchParams({
        lat: String(coordinate.lat),
        lon: String(coordinate.lng),
        apiKey: options.apiKey,
      });
      const response = await fetchWithTimeout(
        fetcher,
        `https://api.geoapify.com/v1/geocode/reverse?${params.toString()}`,
        undefined,
        timeoutMs,
        `Geoapify reverse geocoding timed out after ${timeoutMs}ms.`,
      );

      if (!response.ok) throw new Error(`Geoapify reverse geocoding failed with ${response.status}`);
      const data = await response.json() as {
        features?: Array<{ properties?: { place_id?: string | number; formatted?: string; lat?: number; lon?: number } }>;
      };
      const first = data.features?.[0]?.properties;

      if (!first?.formatted) return null;
      const resultCoordinate = {
        lat: typeof first.lat === 'number' ? first.lat : coordinate.lat,
        lng: typeof first.lon === 'number' ? first.lon : coordinate.lng,
      };

      if (!isFiniteCoordinate(resultCoordinate)) return null;

      return {
        id: String(first.place_id ?? first.formatted),
        label: first.formatted,
        coordinate: resultCoordinate,
      };
    },
  };
}
