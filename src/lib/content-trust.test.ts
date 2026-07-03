import { describe, expect, it } from "vitest";
import { getPlaceBySlug } from "@/lib/data/index";
import type { PlaceMedia, PlaceSource } from "@/lib/types";
import { getNormalizedPlaceTrustRecord, getPlaceSourceTrustSummary, getThenNowMedia } from "./content-trust";

describe("src content trust utilities", () => {
  it("normalizes place sources into explicit verification status records", () => {
    const place = getPlaceBySlug("place-darmes");
    expect(place).toBeDefined();

    const trustRecord = getNormalizedPlaceTrustRecord(place!);
    const source: PlaceSource | undefined = trustRecord.sources[0];

    expect(trustRecord.sourceQualityScore).toBe("verified");
    expect(trustRecord.lastReviewedAt).toBe("2026-07-01");
    expect(source?.verificationStatus).toBe("verified");
    expect(source?.label).toBe("Meaningful Routes editorial review");
  });

  it("normalizes media approval, attribution, and then-now support", () => {
    const place = getPlaceBySlug("place-darmes");
    expect(place).toBeDefined();

    const trustRecord = getNormalizedPlaceTrustRecord(place!);
    const approvedMedia: PlaceMedia | undefined = trustRecord.media.find((asset) => asset.approvalStatus === "approved");

    expect(approvedMedia?.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    expect(approvedMedia?.attributionText).toContain("CC BY-SA 4.0");
    expect(trustRecord.thenNow.hasHistoricalMedia).toBe(false);
    expect(trustRecord.thenNow.nowAsset?.approvalStatus).toBe("approved");
  });

  it("keeps the public summary and then-now selectors available from the src entry point", () => {
    const place = getPlaceBySlug("place-darmes");
    expect(place).toBeDefined();

    expect(getPlaceSourceTrustSummary(place!).qualityLabel).toBe("Source checked");
    expect(getThenNowMedia(place!.media).nowAsset?.id).toBe("place-darmes-wikimedia-photo");
  });
});
