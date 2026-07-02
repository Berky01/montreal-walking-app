import { describe, expect, it } from "vitest";
import type { Route } from "@/lib/types";
import { parseSearchIntent, rankRoutes } from ".";

const baseRoute: Route = {
  id: "route-1",
  slug: "architecture-cafe",
  cityId: "montreal",
  title: "Architecture Cafe Walk",
  description: "A compact architecture route with a cafe stop.",
  story: "A story.",
  area: "Old Montreal",
  distanceKm: 2.7,
  durationMin: 45,
  difficulty: "easy",
  routeType: "loop",
  pace: "relaxed",
  tags: ["architecture", "cafes", "quiet"],
  interests: ["architecture", "cafes", "history"],
  moodTags: ["quiet", "scenic"],
  bestTime: "Morning",
  bestFor: ["Architecture details"],
  whyThisRoute: ["Compact and calm"],
  startPlaceId: "place-1",
  endPlaceId: "place-1",
  stops: [],
  metrics: [],
  accessibilityNotes: [],
  safetyNotes: [],
  coordinates: { lat: 45.504, lng: -73.556 },
  geometry: {
    type: "LineString",
    coordinates: [
      { lat: 45.504, lng: -73.556 },
      { lat: 45.505, lng: -73.557 }
    ]
  },
  sources: [],
  media: [],
  contentStatus: "ready",
  sourceQuality: "draft",
  qaStatus: {
    content: "ready",
    geometry: "rough",
    fieldCheck: "not_started",
    accessibility: "partial",
    sources: "missing",
    overall: "review",
    score: 60
  },
  qaScore: 60,
  lastReviewedAt: "2026-07-01"
};

describe("route engine", () => {
  it("parses duration, interest, and mood from natural language", () => {
    const intent = parseSearchIntent("quiet architecture walk under 1 hour with cafes");

    expect(intent.durationMaxMin).toBe(60);
    expect(intent.interests).toEqual(expect.arrayContaining(["architecture", "cafes"]));
    expect(intent.moods).toContain("quiet");
    expect(intent.explanationChips).toEqual(
      expect.arrayContaining(["Quiet mood", "Architecture theme", "Cafe stops included", "Under 60 min"])
    );
  });

  it("parses the P0 route-search prompt examples", () => {
    expect(parseSearchIntent("rainy day museums")).toMatchObject({
      interests: expect.arrayContaining(["museums"]),
      moods: expect.arrayContaining(["rainy day"]),
      weatherIntent: "rainy_day"
    });

    expect(parseSearchIntent("accessible sunset walk")).toMatchObject({
      interests: expect.arrayContaining(["accessible"]),
      moods: expect.arrayContaining(["scenic"]),
      needsAccessibleRoute: true,
      wantsScenicViewpoints: true
    });

    expect(parseSearchIntent("cafes and history near Old Montreal")).toMatchObject({
      interests: expect.arrayContaining(["cafes", "history"]),
      wantsCafeOrFood: true,
      areaHints: expect.arrayContaining(["Old Montreal"])
    });

    expect(parseSearchIntent("short loop with churches")).toMatchObject({
      durationMaxMin: 45,
      routeShape: "loop",
      interests: expect.arrayContaining(["churches"])
    });

    expect(parseSearchIntent("family-friendly park walk")).toMatchObject({
      interests: expect.arrayContaining(["nature"]),
      moods: expect.arrayContaining(["family-friendly"])
    });

    expect(parseSearchIntent("viewpoints without stairs")).toMatchObject({
      interests: expect.arrayContaining(["scenic"]),
      needsAccessibleRoute: true,
      wantsScenicViewpoints: true
    });

    expect(parseSearchIntent("food walk in Little Italy")).toMatchObject({
      interests: expect.arrayContaining(["markets"]),
      wantsCafeOrFood: true,
      areaHints: expect.arrayContaining(["Little Italy"])
    });
  });

  it("parses difficulty and route shape intents", () => {
    expect(parseSearchIntent("easy scenic loop")).toMatchObject({
      difficulty: "easy",
      routeShape: "loop",
      wantsScenicViewpoints: true
    });
  });

  it("ranks routes by matching duration, interests, and mood with explanations", () => {
    const results = rankRoutes("quiet architecture walk under 1 hour with cafes", [
      baseRoute,
      {
        ...baseRoute,
        id: "route-2",
        slug: "long-nature",
        title: "Long Nature Walk",
        durationMin: 140,
        tags: ["nature"],
        interests: ["nature"],
        moodTags: ["energetic"]
      }
    ]);

    expect(results[0]?.route.slug).toBe("architecture-cafe");
    expect(results[0]?.score).toBeGreaterThan(results[1]?.score ?? 0);
    expect(results[0]?.matchReasons).toEqual(
      expect.arrayContaining(["Matches quiet mood", "Includes architecture", "Includes cafes", "Fits under 60 min"])
    );
  });

  it("uses structured stop text when ranking interests", () => {
    const museumRoute: Route = {
      ...baseRoute,
      id: "route-museum",
      slug: "campus-stops",
      title: "Campus Walk",
      tags: ["campus"],
      interests: ["campus"],
      moodTags: [],
      stops: [
        {
          id: "stop-mccord",
          placeId: "mccord-stewart-museum",
          order: 1,
          title: "McCord Stewart Museum",
          description: "Museum stop near McGill.",
          distanceFromStartKm: 0,
          recommendedStopMin: 8,
          coordinates: { lat: 45.5035, lng: -73.5734 }
        }
      ]
    };

    const results = rankRoutes("museum walk", [
      {
        ...baseRoute,
        id: "route-general",
        slug: "general-walk",
        tags: ["parks"],
        interests: ["parks"],
        moodTags: []
      },
      museumRoute
    ]);

    expect(results[0]?.route.slug).toBe("campus-stops");
    expect(results[0]?.matchReasons).toContain("Includes museums");
  });
});
