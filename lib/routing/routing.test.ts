import { describe, expect, it } from "vitest";
import { getRouteBySlug } from "@/lib/data/index";
import { geometryDistanceKm } from "@/lib/routing/distance";
import { getRoutingProvider } from "@/lib/routing/index";

describe("routing provider boundary", () => {
  it("uses stored route geometry when provider is none", async () => {
    const route = getRouteBySlug("public-art-downtown-walk");
    expect(route).toBeDefined();

    const provider = getRoutingProvider({ provider: "none" });
    const result = await provider.getRouteGeometry(route!);

    expect(result.provider).toBe("manual");
    expect(result.geometry).toEqual(route!.geometry);
    expect(result.requiresReview).toBe(false);
  });

  it("calculates a positive distance from LineString geometry", () => {
    const route = getRouteBySlug("museums-campus-walk");
    expect(route).toBeDefined();

    expect(geometryDistanceKm(route!.geometry)).toBeGreaterThan(0);
  });
});
