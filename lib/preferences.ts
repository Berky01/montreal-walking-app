import type { UserPreferences } from "@/lib/types";

const kmToMiles = 0.621371;

export function formatDistanceForUnits(km: number, units: UserPreferences["units"]): string {
  if (units === "imperial") {
    return `${(km * kmToMiles).toFixed(1)} mi`;
  }

  return `${km.toFixed(1)} km`;
}

export function estimateDurationForPace(minutes: number, pace: UserPreferences["preferredPace"]): number {
  const multiplier = pace === "relaxed" ? 1.2 : pace === "brisk" ? 0.8 : 1;
  return Math.max(1, Math.round(minutes * multiplier));
}
