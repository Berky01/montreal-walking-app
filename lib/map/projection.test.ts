import { describe, expect, it } from "vitest";
import { computeCoordinateBounds, projectCoordinate, zoomBounds } from "@/lib/map/projection";

describe("map projection helpers", () => {
  it("computes padded bounds around route coordinates", () => {
    const bounds = computeCoordinateBounds([
      { lat: 45.5, lng: -73.57 },
      { lat: 45.51, lng: -73.55 }
    ]);

    expect(bounds.minLat).toBeLessThan(45.5);
    expect(bounds.maxLat).toBeGreaterThan(45.51);
    expect(bounds.minLng).toBeLessThan(-73.57);
    expect(bounds.maxLng).toBeGreaterThan(-73.55);
  });

  it("projects coordinates into the responsive SVG viewport", () => {
    const bounds = computeCoordinateBounds([
      { lat: 45.5, lng: -73.57 },
      { lat: 45.51, lng: -73.55 }
    ]);
    const point = projectCoordinate({ lat: 45.505, lng: -73.56 }, bounds);

    expect(point.x).toBeGreaterThanOrEqual(8);
    expect(point.x).toBeLessThanOrEqual(92);
    expect(point.y).toBeGreaterThanOrEqual(8);
    expect(point.y).toBeLessThanOrEqual(92);
  });

  it("zooms bounds around their center", () => {
    const bounds = { minLat: 0, maxLat: 10, minLng: 0, maxLng: 20 };
    const zoomed = zoomBounds(bounds, 2);

    expect(zoomed.minLat).toBe(2.5);
    expect(zoomed.maxLat).toBe(7.5);
    expect(zoomed.minLng).toBe(5);
    expect(zoomed.maxLng).toBe(15);
  });
});
