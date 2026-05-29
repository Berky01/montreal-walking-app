import { interestOptions } from '@walking-app/shared';
import type { Interest } from '@walking-app/shared';

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-CA').format(Math.round(value));
}

export function humanDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

export function categoryLabel(category: Interest) {
  return interestOptions.find((option) => option.id === category)?.label ?? category;
}

export function poiStopTime(category: Interest) {
  if (category === 'cafes') return '8 min';
  if (category === 'viewpoints' || category === 'waterfront') return '5 min';
  return '3 min';
}

export function reasonForPOI(category: Interest) {
  if (category === 'cafes') return 'Good pause point without turning the walk into an errand.';
  if (category === 'parks') return 'Adds a softer block and a place to reset your pace.';
  if (category === 'architecture') return 'A visible street-level detail worth slowing down for.';
  if (category === 'waterfront') return 'Gives the loop a clear scenic anchor.';
  if (category === 'transit') return 'Keeps the walk easy to exit if plans change.';
  return 'A practical nearby discovery that fits this route.';
}
