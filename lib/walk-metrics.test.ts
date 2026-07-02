import { describe, expect, it } from "vitest";
import { getRouteBySlug } from "@/lib/data/index";
import type { RouteSession, UserPreferences } from "@/lib/types";
import { buildLiveRouteMetrics, getSessionElapsedMin } from "@/lib/walk-metrics";

const preferences: UserPreferences = {
  units: "metric",
  preferredPace: "balanced",
  interests: [],
  preferQuietRoutes: false,
  preferCafes: false,
  preferIndoorRainyDay: false,
  avoidStairs: false,
  accessibilityNeeds: []
};

describe("live walk metrics", () => {
  it("uses actual session distance and elapsed time instead of planned route totals", () => {
    const route = getRouteBySlug("old-montreal-monuments-loop")!;
    const session: RouteSession = {
      id: "active-route",
      routeId: route.id,
      routeSlug: route.slug,
      routeTitle: route.title,
      status: "active",
      startedAt: "2026-07-01T12:00:00.000Z",
      endedAt: null,
      pausedAt: null,
      totalPausedMs: 5 * 60 * 1000,
      currentStopIndex: 2,
      currentStopId: route.stops[2].id,
      nextStopId: route.stops[3].id,
      visitedStopIds: [route.stops[0].id, route.stops[1].id],
      skippedStopIds: [],
      progressPercent: 29,
      elapsedMin: 0,
      actualDistanceKm: 1.2
    };

    expect(getSessionElapsedMin(session, new Date("2026-07-01T12:20:00.000Z"))).toBe(15);

    const metrics = buildLiveRouteMetrics({
      now: new Date("2026-07-01T12:20:00.000Z"),
      preferences,
      route,
      session
    });

    expect(metrics.map((metric) => [metric.label, metric.value])).toEqual([
      ["Elapsed", "15 min"],
      ["Walked", "1.2 km"],
      ["Remaining", "2.0 km"],
      ["Progress", "29%"],
      ["Visited", "2/7"],
      ["Status", "Active"]
    ]);
  });
});
