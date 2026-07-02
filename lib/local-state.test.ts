import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  abandonRouteSession,
  completeRouteSession,
  deleteWalkHistoryItem,
  getFeatureFlags,
  getActiveRouteSession,
  getCompareRouteSlugs,
  getLocalIssueReports,
  getUserPreferences,
  getWalkHistoryItems,
  isRouteInCompareBasket,
  isSavedItem,
  pauseRouteSession,
  resumeRouteSession,
  saveFeatureFlags,
  saveLocalIssueReport,
  setCompareRouteSelected,
  skipRouteStop,
  startRouteSession,
  toggleCompareRoute,
  toggleSavedItem,
  visitRouteStop
} from "@/lib/local-state";
import { getRouteBySlug } from "@/lib/data/index";
import { storageKeys } from "@/lib/storage";

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-01T12:00:00.000Z"));
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key)
      },
      dispatchEvent: vi.fn()
    }
  });
});

describe("local route state", () => {
  it("persists active session progress and completion history", () => {
    const route = getRouteBySlug("old-montreal-monuments-loop");
    expect(route).toBeDefined();

    const started = startRouteSession(route!);
    expect(started.currentStopIndex).toBe(0);
    expect(started.status).toBe("active");
    expect(started.endedAt).toBeNull();
    expect(started.pausedAt).toBeNull();
    expect(started.skippedStopIds).toEqual([]);
    expect(store.has(storageKeys.walkSessions)).toBe(true);
    expect(store.has("meaningful-routes-active-sessions")).toBe(false);

    const visited = visitRouteStop(route!, route!.stops[1].id);
    expect(visited.visitedStopIds).toContain(route!.stops[1].id);
    expect(getActiveRouteSession(route!.slug)?.progressPercent).toBeGreaterThan(0);

    pauseRouteSession(route!.slug);
    expect(getActiveRouteSession(route!.slug)?.status).toBe("paused");
    vi.advanceTimersByTime(5 * 60 * 1000);
    resumeRouteSession(route!.slug);
    expect(getActiveRouteSession(route!.slug)?.status).toBe("active");
    expect(getActiveRouteSession(route!.slug)?.totalPausedMs).toBe(5 * 60 * 1000);

    const completed = completeRouteSession(route!);
    expect(completed.status).toBe("completed");
    expect(completed.endedAt).toBe("2026-07-01T12:05:00.000Z");
    expect(completed.currentStopIndex).toBeGreaterThanOrEqual(0);
    expect(completed.totalPausedMs).toBe(5 * 60 * 1000);
    expect(completed.skippedStopIds).toEqual([]);
    expect(getWalkHistoryItems()).toHaveLength(1);
    expect(getActiveRouteSession(route!.slug)).toBeUndefined();
    expect(store.has(storageKeys.completedWalks)).toBe(true);
  });

  it("advances the active stop after marking the current stop visited", () => {
    const route = getRouteBySlug("old-montreal-monuments-loop");
    expect(route).toBeDefined();

    startRouteSession(route!);
    const updated = visitRouteStop(route!, route!.stops[0].id);

    expect(updated.visitedStopIds).toContain(route!.stops[0].id);
    expect(updated.currentStopIndex).toBe(1);
    expect(updated.currentStopId).toBe(route!.stops[1].id);
    expect(updated.nextStopId).toBe(route!.stops[2].id);
    expect(updated.progressPercent).toBe(Math.round((1 / route!.stops.length) * 100));
  });

  it("deletes a completed walk from history", () => {
    const route = getRouteBySlug("place-darmes-circuit");
    expect(route).toBeDefined();
    const completed = completeRouteSession(route!);

    deleteWalkHistoryItem(completed.id);

    expect(getWalkHistoryItems()).toEqual([]);
  });

  it("abandons active sessions without saving them to completed history", () => {
    const route = getRouteBySlug("place-darmes-circuit");
    expect(route).toBeDefined();

    startRouteSession(route!);
    const abandoned = abandonRouteSession(route!.slug);

    expect(abandoned?.status).toBe("abandoned");
    expect(abandoned?.endedAt).toBe("2026-07-01T12:00:00.000Z");
    expect(getActiveRouteSession(route!.slug)).toBeUndefined();
    expect(getWalkHistoryItems()).toEqual([]);
  });

  it("advances to the next stop and records walked distance when the current stop is marked visited", () => {
    const route = getRouteBySlug("old-montreal-monuments-loop");
    expect(route).toBeDefined();

    startRouteSession(route!);
    const visited = visitRouteStop(route!, route!.stops[0].id);

    expect(visited.visitedStopIds).toEqual([route!.stops[0].id]);
    expect(visited.currentStopIndex).toBe(1);
    expect(visited.currentStopId).toBe(route!.stops[1].id);
    expect(visited.actualDistanceKm).toBeGreaterThan(0);
  });

  it("persists local issue reports with severity and stop context", () => {
    const report = saveLocalIssueReport({
      routeSlug: "place-darmes-circuit",
      category: "safety",
      severity: "high",
      stopId: "place-darmes-circuit-stop-1",
      description: "Crossing signal is out."
    });

    expect(report.severity).toBe("high");
    expect(getLocalIssueReports()).toEqual([report]);
    expect(store.has(storageKeys.issueReports)).toBe(true);
  });

  it("persists feature flags with safe defaults", () => {
    expect(getFeatureFlags().mapExplorer).toBe(false);

    const flags = saveFeatureFlags({ mapExplorer: true, audioStories: true });

    expect(flags.mapExplorer).toBe(true);
    expect(flags.audioStories).toBe(true);
    expect(flags.routeExport).toBe(false);
    expect(getFeatureFlags()).toMatchObject({
      mapExplorer: true,
      routeExport: false,
      multiCityExpansion: false
    });
    expect(store.has(storageKeys.featureFlags)).toBe(true);
  });

  it("persists compare basket route slugs and toggles selected routes", () => {
    const firstRoute = getRouteBySlug("old-montreal-monuments-loop");
    const secondRoute = getRouteBySlug("place-darmes-circuit");
    expect(firstRoute).toBeDefined();
    expect(secondRoute).toBeDefined();

    const firstToggle = toggleCompareRoute(firstRoute!);
    expect(firstToggle.selected).toBe(true);
    expect(firstToggle.routeSlugs).toEqual([firstRoute!.slug]);
    expect(isRouteInCompareBasket(firstRoute!.slug)).toBe(true);

    const secondToggle = toggleCompareRoute(secondRoute!);
    expect(secondToggle.selected).toBe(true);
    expect(getCompareRouteSlugs()).toEqual([secondRoute!.slug, firstRoute!.slug]);
    expect(store.has(storageKeys.compareBasket)).toBe(true);

    const removed = toggleCompareRoute(firstRoute!);
    expect(removed.selected).toBe(false);
    expect(getCompareRouteSlugs()).toEqual([secondRoute!.slug]);
    expect(isRouteInCompareBasket(firstRoute!.slug)).toBe(false);
  });

  it("sets compare basket membership idempotently from checkbox state", () => {
    const route = getRouteBySlug("old-montreal-monuments-loop");
    expect(route).toBeDefined();

    expect(setCompareRouteSelected(route!, true)).toMatchObject({ selected: true });
    expect(setCompareRouteSelected(route!, true).routeSlugs).toEqual([route!.slug]);
    expect(isRouteInCompareBasket(route!.slug)).toBe(true);

    expect(setCompareRouteSelected(route!, false)).toMatchObject({ selected: false });
    expect(getCompareRouteSlugs()).toEqual([]);
  });

  it("caps compare basket state to four unique route slugs", () => {
    const selected = getRouteBySlug("old-montreal-monuments-loop")!;
    const allRoutes = [
      selected,
      getRouteBySlug("churches-courtyards-walk")!,
      getRouteBySlug("architecture-river-views")!,
      getRouteBySlug("mount-royal-sunrise-loop")!,
      getRouteBySlug("plateau-architecture-cafe-crawl")!
    ];

    for (const route of allRoutes) {
      toggleCompareRoute(route);
    }

    expect(getCompareRouteSlugs()).toHaveLength(4);
    expect(getCompareRouteSlugs()).toEqual([
      "plateau-architecture-cafe-crawl",
      "mount-royal-sunrise-loop",
      "architecture-river-views",
      "churches-courtyards-walk"
    ]);
  });

  it("reports a failed save without marking the item saved", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: (key: string) => store.get(key) ?? null,
          setItem: () => {
            throw new Error("storage disabled");
          },
          removeItem: (key: string) => store.delete(key)
        },
        dispatchEvent: vi.fn()
      }
    });

    const result = toggleSavedItem({
      itemId: "route-old-montreal-loop",
      itemSlug: "old-montreal-monuments-loop",
      itemTitle: "Old Montreal Monuments Loop",
      itemType: "route"
    });

    expect(result.ok).toBe(false);
    expect(result.saved).toBe(false);
    expect(isSavedItem("route", "old-montreal-monuments-loop")).toBe(false);
  });

  it("normalizes stored compare slugs and stored preference defaults", () => {
    store.set(
      storageKeys.compareBasket,
      JSON.stringify({
        schemaVersion: 1,
        data: ["old-montreal-monuments-loop", "", "old-montreal-monuments-loop", "place-darmes-circuit"],
        updatedAt: "2026-07-01T12:00:00.000Z"
      })
    );
    store.set(
      storageKeys.preferences,
      JSON.stringify({
        schemaVersion: 1,
        data: {
          units: "imperial"
        },
        updatedAt: "2026-07-01T12:00:00.000Z"
      })
    );

    expect(getCompareRouteSlugs()).toEqual(["old-montreal-monuments-loop", "place-darmes-circuit"]);
    expect(getUserPreferences()).toMatchObject({
      units: "imperial",
      preferredPace: "relaxed",
      interests: ["history", "architecture"],
      alertPreferences: {
        routeChanges: true,
        accessibility: true,
        weather: false
      }
    });
  });

  it("skips the current stop, advances the active pointer, and counts skipped progress", () => {
    const route = getRouteBySlug("old-montreal-monuments-loop");
    expect(route).toBeDefined();

    startRouteSession(route!);
    const skipped = skipRouteStop(route!, route!.stops[0].id);

    expect(skipped.skippedStopIds).toEqual([route!.stops[0].id]);
    expect(skipped.visitedStopIds).toEqual([]);
    expect(skipped.currentStopIndex).toBe(1);
    expect(skipped.currentStopId).toBe(route!.stops[1].id);
    expect(skipped.progressPercent).toBe(Math.round((1 / route!.stops.length) * 100));
  });
});
