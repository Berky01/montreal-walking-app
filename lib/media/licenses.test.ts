import { describe, expect, it } from "vitest";
import {
  describeMediaAttribution,
  isApprovedProductionImageAsset,
  isRejectedLicenseName
} from "@/lib/media/licenses";
import type { MediaAsset } from "@/lib/types";

describe("media attribution copy", () => {
  it("does not expose prototype placeholder copy for normal production UI", () => {
    expect(
      describeMediaAttribution([
        {
          id: "route-image-placeholder",
          alt: "Route preview placeholder",
          type: "image",
          status: "placeholder"
        }
      ])
    ).toBe("Editorial visual");
  });

  it("accepts only approved local production images with commercial-safe license metadata", () => {
    const asset: MediaAsset = {
      id: "place-darmes-wikimedia",
      type: "image",
      role: "hero",
      localPath: "/media/places/place-darmes.jpg",
      url: "/media/places/place-darmes.jpg",
      originalUrl: "https://upload.wikimedia.org/example/original.jpg",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Place_d%27Armes_Montreal.jpg",
      sourceType: "wikimedia_commons",
      provider: "wikimedia_commons",
      creator: "Example photographer",
      title: "Place d'Armes, Montreal",
      alt: "Place d'Armes square in Old Montreal with historic buildings around it.",
      attributionText: "Photo by Example photographer, CC BY-SA 4.0, via Wikimedia Commons.",
      licenseName: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      licenseAllowsCommercialUse: true,
      licenseRequiresAttribution: true,
      licenseRequiresShareAlike: true,
      width: 1600,
      height: 1067,
      placeId: "place-darmes",
      importedAt: "2026-07-01",
      lastCheckedAt: "2026-07-01",
      confidence: "verified",
      status: "approved"
    };

    expect(isApprovedProductionImageAsset(asset)).toBe(true);
  });

  it("rejects non-commercial, unknown, and all-rights-reserved licenses", () => {
    expect(isRejectedLicenseName("CC BY-NC 4.0")).toBe(true);
    expect(isRejectedLicenseName("All rights reserved")).toBe(true);
    expect(isRejectedLicenseName("unknown license")).toBe(true);
    expect(isRejectedLicenseName("CC BY-SA 4.0")).toBe(false);
    expect(isRejectedLicenseName("Public domain")).toBe(false);
  });
});
