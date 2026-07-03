import { describe, expect, it } from "vitest";
import { getPlaceBySlug } from "@/lib/data/index";
import { getPlaceSourceTrustSummary, getThenNowMedia } from "@/lib/content-trust";
import type { MediaAsset } from "@/lib/types";

describe("content trust summaries", () => {
  it("summarizes public place source and approved media confidence", () => {
    const place = getPlaceBySlug("place-darmes");
    expect(place).toBeDefined();

    const summary = getPlaceSourceTrustSummary(place!);

    expect(summary).toMatchObject({
      qualityLabel: "Source checked",
      qualityTone: "primary",
      reviewDateLabel: "2026-07-01",
      sourceCount: 1,
      verifiedSourceCount: 1,
      primarySourceLabel: "Meaningful Routes editorial review",
      hasVerifiedSources: true
    });
    expect(summary.approvedPhotoCount).toBeGreaterThan(0);
    expect(summary.licenseLabels).toContain("CC BY-SA 4.0");
  });

  it("keeps then-now historical media explicit instead of inventing an archive image", () => {
    const place = getPlaceBySlug("place-darmes");
    expect(place).toBeDefined();

    const media = getThenNowMedia(place!.media);

    expect(media.hasHistoricalMedia).toBe(false);
    expect(media.thenAsset).toBeUndefined();
    expect(media.nowAsset?.id).toBe("place-darmes-wikimedia-photo");
  });

  it("selects archival media as the then image when one is attached", () => {
    const current: MediaAsset = {
      id: "current-photo",
      alt: "Current view.",
      type: "image",
      localPath: "/media/current.jpg",
      url: "/media/current.jpg",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Current.jpg",
      sourceType: "wikimedia_commons",
      creator: "Current photographer",
      licenseName: "CC BY-SA 4.0",
      licenseAllowsCommercialUse: true,
      attributionText: "Photo by Current photographer, CC BY-SA 4.0.",
      status: "approved"
    };
    const historical: MediaAsset = {
      ...current,
      id: "archive-photo",
      alt: "Historical archive view.",
      localPath: "/media/archive.jpg",
      url: "/media/archive.jpg",
      sourceUrl: "https://archive.example/photo",
      sourceType: "public_domain_archive",
      creator: "Archive",
      title: "Historical archive view",
      attributionText: "Archive photo, public domain.",
      licenseName: "Public domain"
    };

    const media = getThenNowMedia([current, historical]);

    expect(media.hasHistoricalMedia).toBe(true);
    expect(media.thenAsset?.id).toBe("archive-photo");
    expect(media.nowAsset?.id).toBe("current-photo");
  });

  it("does not duplicate an archival asset as the current view", () => {
    const historicalOnly: MediaAsset = {
      id: "archive-photo",
      alt: "Historical archive view.",
      type: "image",
      localPath: "/media/archive.jpg",
      url: "/media/archive.jpg",
      sourceUrl: "https://archive.example/photo",
      sourceType: "public_domain_archive",
      creator: "Archive",
      title: "Historical archive view",
      attributionText: "Archive photo, public domain.",
      licenseName: "Public domain",
      licenseAllowsCommercialUse: true,
      status: "approved"
    };

    const media = getThenNowMedia([historicalOnly]);

    expect(media.thenAsset?.id).toBe("archive-photo");
    expect(media.nowAsset).toBeUndefined();
  });
});
