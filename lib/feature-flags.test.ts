import { describe, expect, it } from "vitest";
import { featureFlagDefaults, featureFlagKeys, normalizeFeatureFlags } from "@/lib/feature-flags";

describe("feature flags", () => {
  it("defines every incomplete Stitch surface as disabled by default", () => {
    expect(featureFlagKeys).toEqual([
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
    ]);
    expect(Object.values(featureFlagDefaults).every((enabled) => enabled === false)).toBe(true);
  });

  it("normalizes partial or unknown stored values against safe defaults", () => {
    expect(normalizeFeatureFlags({ mapExplorer: true, unknownFlag: true })).toMatchObject({
      mapExplorer: true,
      offlineCards: false,
      audioStories: false,
      multiCityExpansion: false
    });
  });
});
