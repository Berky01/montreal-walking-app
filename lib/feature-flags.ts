export const featureFlagKeys = [
  "mapExplorer",
  "offlineCards",
  "routeExport",
  "weatherSuggestions",
  "accessibilityNotes",
  "neighborhoodPages",
  "premiumPacks",
  "partnerPortal",
  "adminQa",
  "audioStories",
  "ticketsTours",
  "heritageLayers",
  "dynamicRouteGeneration",
  "roadTripMode",
  "pilgrimageMode",
  "multiCityExpansion"
] as const;

export type FeatureFlagKey = (typeof featureFlagKeys)[number];
export type FeatureFlags = Record<FeatureFlagKey, boolean>;

export const featureFlagDefaults = Object.fromEntries(featureFlagKeys.map((key) => [key, false])) as FeatureFlags;

export function normalizeFeatureFlags(value: unknown): FeatureFlags {
  const stored = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return Object.fromEntries(featureFlagKeys.map((key) => [key, stored[key] === true])) as FeatureFlags;
}

export function isFeatureEnabled(flags: FeatureFlags, key: FeatureFlagKey): boolean {
  return flags[key] === true;
}
