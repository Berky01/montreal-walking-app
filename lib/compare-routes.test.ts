import { describe, expect, it } from "vitest";
import { getRoutes } from "@/lib/data/index";
import { parseCompareRouteIds, resolveComparedRoutes } from "@/lib/compare-routes";

describe("route comparison resolver", () => {
  it("uses persisted compare slugs in selected order and ignores unknown or duplicate slugs", () => {
    const result = resolveComparedRoutes(getRoutes(), [
      "place-darmes-circuit",
      "missing-route",
      "old-montreal-monuments-loop",
      "place-darmes-circuit"
    ]);

    expect(result.usedFallback).toBe(false);
    expect(result.missingSlugs).toEqual(["missing-route"]);
    expect(result.routes.map((route) => route.slug)).toEqual([
      "place-darmes-circuit",
      "old-montreal-monuments-loop"
    ]);
  });

  it("parses shareable compare URL ids with public-route sanitization order and a cap of four", () => {
    const routes = getRoutes();
    const parsed = parseCompareRouteIds(
      "place-darmes-circuit,missing-route,old-montreal-monuments-loop,place-darmes-circuit,churches-courtyards-walk,architecture-river-views,mount-royal-sunrise-loop",
      routes
    );

    expect(parsed.validSlugs).toEqual([
      "place-darmes-circuit",
      "old-montreal-monuments-loop",
      "churches-courtyards-walk",
      "architecture-river-views"
    ]);
    expect(parsed.missingSlugs).toEqual(["missing-route"]);
  });

  it("falls back to featured routes when the persisted basket is empty or invalid", () => {
    const routes = getRoutes();
    const emptyResult = resolveComparedRoutes(routes, []);
    const invalidResult = resolveComparedRoutes(routes, ["missing-route"], 3);

    expect(emptyResult.usedFallback).toBe(true);
    expect(emptyResult.routes).toEqual(routes.slice(0, 4));
    expect(invalidResult.usedFallback).toBe(true);
    expect(invalidResult.missingSlugs).toEqual(["missing-route"]);
    expect(invalidResult.routes).toEqual(routes.slice(0, 3));
  });
});
