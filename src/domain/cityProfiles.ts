import type { CityProfile } from './mvpTypes';

const baseWeights = {
  parks: 1,
  waterfront: 1,
  cafes: 1,
  architecture: 1,
  churches: 1,
  viewpoints: 1,
  calm: 1,
};

export const montrealCityProfile: CityProfile = {
  id: 'montreal',
  name: 'Montréal',
  bounds: {
    north: 45.705,
    south: 45.395,
    east: -73.475,
    west: -73.975,
  },
  center: { lat: 45.5019, lng: -73.5674 },
  defaultWalkingSpeedMps: 1.35,
  defaultStepLengthMeters: 0.75,
  avoidRoadClasses: ['motorway', 'trunk', 'primary'],
  moodWeights: {
    calm: { ...baseWeights, parks: 1.25, calm: 1.5 },
    scenic: { ...baseWeights, parks: 1.3, waterfront: 1.5, viewpoints: 1.4 },
    historic: { ...baseWeights, architecture: 1.35, churches: 1.35 },
    coffee: { ...baseWeights, cafes: 1.6, architecture: 1.15 },
    green: { ...baseWeights, parks: 1.7, waterfront: 1.25 },
    energetic: { ...baseWeights, cafes: 1.2, waterfront: 1.15 },
  },
};

export function isInsideCityBounds(
  coordinate: { lat: number; lng: number },
  city: CityProfile,
): boolean {
  return (
    coordinate.lat <= city.bounds.north &&
    coordinate.lat >= city.bounds.south &&
    coordinate.lng <= city.bounds.east &&
    coordinate.lng >= city.bounds.west
  );
}
