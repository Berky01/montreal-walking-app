import { isInsideCityBounds } from './cityProfiles';
import type { CityProfile, GeocodedPlace } from './mvpTypes';

const coordinatePattern = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

export type StartInputParseResult =
  | { kind: 'coordinate'; place: GeocodedPlace }
  | { kind: 'invalid-coordinate'; error: string }
  | { kind: 'address' };

export function parseCoordinateInput(input: string, city: CityProfile): GeocodedPlace | null {
  const parsed = parseStartInput(input, city);

  return parsed.kind === 'coordinate' ? parsed.place : null;
}

export function parseStartInput(input: string, city: CityProfile): StartInputParseResult {
  const match = input.match(coordinatePattern);

  if (!match) return { kind: 'address' };

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  const coordinate = { lat, lng };

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { kind: 'invalid-coordinate', error: 'Coordinates are not valid numbers.' };
  }

  if (!isInsideCityBounds(coordinate, city)) {
    return { kind: 'invalid-coordinate', error: 'Coordinates must be inside Montréal.' };
  }

  return {
    kind: 'coordinate',
    place: {
      id: `coordinate-${lat}-${lng}`,
      label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      coordinate,
    },
  };
}
