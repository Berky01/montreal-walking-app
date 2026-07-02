import { describe, expect, it } from "vitest";
import { validateMediaCatalog } from "@/lib/media/validation";
import type { MediaAsset } from "@/lib/types";

const approvedAsset: MediaAsset = {
  id: "approved",
  type: "image",
  role: "card",
  localPath: "/media/places/approved.jpg",
  url: "/media/places/approved.jpg",
  originalUrl: "https://upload.wikimedia.org/example/approved.jpg",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Approved.jpg",
  sourceType: "wikimedia_commons",
  provider: "wikimedia_commons",
  creator: "Example photographer",
  title: "Approved",
  alt: "Approved Montreal place photo.",
  attributionText: "Photo by Example photographer, CC BY 4.0, via Wikimedia Commons.",
  licenseName: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  licenseAllowsCommercialUse: true,
  licenseRequiresAttribution: true,
  licenseRequiresShareAlike: false,
  width: 1200,
  height: 800,
  importedAt: "2026-07-01",
  lastCheckedAt: "2026-07-01",
  confidence: "verified",
  status: "approved"
};

describe("media catalog validation", () => {
  it("rejects hotlinked production photos and missing license metadata", () => {
    const invalidRemote = {
      ...approvedAsset,
      id: "remote",
      localPath: undefined,
      url: "https://example.com/photo.jpg",
      licenseName: undefined,
      licenseUrl: undefined
    } as MediaAsset;

    const result = validateMediaCatalog({
      routes: [{ slug: "route-a", media: [invalidRemote] }],
      places: []
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("route route-a media remote is hotlinked; production media must use localPath.");
    expect(result.errors).toContain("route route-a media remote is missing license metadata.");
  });

  it("blocks rejected or needs-review media from primary hero/card roles", () => {
    const result = validateMediaCatalog({
      routes: [],
      places: [
        {
          slug: "place-a",
          media: [{ ...approvedAsset, id: "review", status: "needs_review", role: "hero" }]
        }
      ]
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("place place-a media review cannot be used as hero while status is needs_review.");
  });
});
