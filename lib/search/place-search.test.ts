import { describe, expect, it } from "vitest";
import type { Place } from "@/lib/types";
import { rankPlaces } from "./place-search";

const basePlace: Place = {
  id: "place-1",
  slug: "place-darmes",
  cityId: "montreal",
  name: "Place d'Armes",
  category: "public_square",
  area: "Old Montreal",
  coordinates: { lat: 45.504, lng: -73.556 },
  shortDescription: "Historic square beside major landmarks.",
  story: "A civic square with layered history.",
  whyItMatters: "It anchors Old Montreal's religious and financial history.",
  whatToNotice: ["The monument", "Stone facades"],
  practicalInfo: ["Open public square"],
  periodOrStyle: "Historic civic square",
  tags: ["history", "architecture"],
  relatedRouteSlugs: ["old-montreal-monuments-loop"],
  sourceQuality: "verified",
  sources: [],
  media: [],
  contentStatus: "ready",
  accessibilityNotes: [],
  safetyNotes: [],
  lastReviewedAt: "2026-07-01"
};

describe("place search", () => {
  it("ranks places with visible match explanations", () => {
    const results = rankPlaces("old montreal architecture", [
      basePlace,
      {
        ...basePlace,
        id: "place-2",
        slug: "laurier-park",
        name: "Laurier Park",
        category: "park",
        area: "Plateau",
        tags: ["nature"],
        shortDescription: "A neighborhood park.",
        story: "A green neighborhood park.",
        whyItMatters: "A local rest stop.",
        whatToNotice: ["Trees"],
        practicalInfo: ["Open daily"],
        relatedRouteSlugs: []
      }
    ]);

    expect(results[0]?.place.slug).toBe("place-darmes");
    expect(results[0]?.matchReasons).toEqual(
      expect.arrayContaining(["In Old Montreal", "Matches architecture"])
    );
    expect(results[0]?.score).toBeGreaterThan(results[1]?.score ?? 0);
  });
});
