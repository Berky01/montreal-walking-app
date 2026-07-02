import { describe, expect, it } from "vitest";
import { getPlaces, getRoutes } from "@/lib/data/index";
import {
  buildMediaCoverageReport,
  getPrimaryMediaAsset,
  getRouteMediaAsset
} from "@/lib/media/media-selection";
import type { MediaAsset, Place, Route } from "@/lib/types";

const approvedPhoto: MediaAsset = {
  id: "approved-photo",
  type: "image",
  role: "hero",
  localPath: "/media/places/approved-photo.jpg",
  url: "/media/places/approved-photo.jpg",
  originalUrl: "https://upload.wikimedia.org/example/original.jpg",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Approved_photo.jpg",
  sourceType: "wikimedia_commons",
  provider: "wikimedia_commons",
  creator: "Example photographer",
  title: "Approved photo",
  alt: "A verified Montreal place photo.",
  attributionText: "Photo by Example photographer, CC BY-SA 4.0, via Wikimedia Commons.",
  licenseName: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  licenseAllowsCommercialUse: true,
  licenseRequiresAttribution: true,
  licenseRequiresShareAlike: true,
  width: 1600,
  height: 1067,
  placeId: "place-a",
  importedAt: "2026-07-01",
  lastCheckedAt: "2026-07-01",
  confidence: "verified",
  status: "approved"
};

const generatedFallback: MediaAsset = {
  id: "generated-fallback",
  type: "generated",
  role: "fallback",
  alt: "Generated route fallback visual.",
  sourceType: "generated_local",
  provider: "meaningful_routes",
  creator: "Meaningful Routes",
  title: "Generated fallback",
  attributionText: "Generated local visual by Meaningful Routes.",
  licenseName: "Internal generated visual",
  licenseAllowsCommercialUse: true,
  licenseRequiresAttribution: false,
  licenseRequiresShareAlike: false,
  confidence: "verified",
  status: "fallback_only"
};

describe("media selection", () => {
  it("prefers approved real photos over generated fallbacks and review assets", () => {
    const needsReview: MediaAsset = {
      ...approvedPhoto,
      id: "needs-review",
      localPath: "/media/places/needs-review.jpg",
      url: "/media/places/needs-review.jpg",
      status: "needs_review"
    };

    expect(getPrimaryMediaAsset([generatedFallback, needsReview, approvedPhoto], "hero")).toEqual(approvedPhoto);
  });

  it("uses an approved stop photo when a route has no route-level photo", () => {
    const route = {
      slug: "sample-route",
      media: [generatedFallback],
      stops: [{ placeId: "place-a", order: 1 }]
    } as Route;
    const places = [{ id: "place-a", media: [approvedPhoto] }] as Place[];

    expect(getRouteMediaAsset(route, places, "card")).toEqual(approvedPhoto);
  });

  it("keeps generated media as a fallback when no approved real photo exists", () => {
    expect(getPrimaryMediaAsset([generatedFallback], "hero")).toEqual(generatedFallback);
  });

  it("reports the seeded Montreal media coverage floor", () => {
    const report = buildMediaCoverageReport({ routes: getRoutes(), places: getPlaces() });

    expect(report.totalMediaAssets).toBeGreaterThanOrEqual(59);
    expect(report.approvedRealPhotos).toBeGreaterThanOrEqual(40);
    expect(report.generatedFallbacks).toBeGreaterThanOrEqual(1);
    expect(report.routePhotoCoverage.covered).toBeGreaterThanOrEqual(12);
    expect(report.placePhotoCoverage.covered).toBeGreaterThanOrEqual(40);
    expect(report.missingRouteHeroPhotos).toEqual([]);
  });
});
