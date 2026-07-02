import { describe, expect, it } from "vitest";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_DEFAULT_CITY,
  DEFAULT_MAP_PROVIDER,
  DEFAULT_MAP_STYLE_URL,
  getMapViewportCoordinates,
  resolveDefaultMapCenter,
  resolveMapStyle,
  resolvePublicMapConfig
} from "@/lib/map/map-config";

describe("map configuration", () => {
  it("does not silently choose a public tile provider when no style URL is configured", () => {
    expect(resolveMapStyle(undefined)).toBeUndefined();
    expect(DEFAULT_MAP_STYLE_URL).toBe("");
  });

  it("uses the configured MapLibre style URL when one is supplied", () => {
    expect(resolveMapStyle("https://tiles.example.com/style.json")).toBe("https://tiles.example.com/style.json");
  });

  it("resolves public map runtime config for configured and fallback states", () => {
    expect(resolvePublicMapConfig({})).toEqual({
      styleUrl: undefined,
      attribution: "",
      provider: DEFAULT_MAP_PROVIDER,
      defaultCity: DEFAULT_MAP_DEFAULT_CITY,
      center: DEFAULT_MAP_CENTER,
      configured: false
    });

    expect(
      resolvePublicMapConfig({
        styleUrl: "https://tiles.example.com/style.json",
        attribution: "Example provider",
        provider: "example",
        defaultCity: "montreal",
        centerLat: "45.5",
        centerLng: "-73.56"
      })
    ).toMatchObject({
      styleUrl: "https://tiles.example.com/style.json",
      attribution: "Example provider",
      provider: "example",
      defaultCity: "montreal",
      center: { lat: 45.5, lng: -73.56 },
      configured: true
    });
  });

  it("uses the Montreal center when configured coordinates are invalid", () => {
    expect(resolveDefaultMapCenter("not-a-lat", "-73.56")).toEqual(DEFAULT_MAP_CENTER);
  });

  it("fits place-only maps to place coordinates", () => {
    const coordinates = getMapViewportCoordinates([], [
      { coordinates: { lat: 45.5045, lng: -73.5561 } },
      { coordinates: { lat: 45.5085, lng: -73.5539 } }
    ]);

    expect(coordinates).toEqual([
      { lat: 45.5045, lng: -73.5561 },
      { lat: 45.5085, lng: -73.5539 }
    ]);
  });

  it("prioritizes route geometry over surrounding place coordinates", () => {
    const coordinates = getMapViewportCoordinates(
      [
        {
          geometry: {
            type: "LineString",
            coordinates: [
              { lat: 45.5, lng: -73.57 },
              { lat: 45.51, lng: -73.55 }
            ]
          }
        }
      ],
      [{ coordinates: { lat: 45.9, lng: -73.1 } }]
    );

    expect(coordinates).toEqual([
      { lat: 45.5, lng: -73.57 },
      { lat: 45.51, lng: -73.55 }
    ]);
  });
});
