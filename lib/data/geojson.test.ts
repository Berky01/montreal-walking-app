import { describe, expect, it } from "vitest";
import { places } from "@/lib/mock-data/places";
import { routes } from "@/lib/mock-data/routes";
import {
  getCityBounds,
  getPlaceCategoryStyleKey,
  placeToFeature,
  placesToFeatureCollection,
  routeStopsToLineString,
  validateCoordinates
} from "@/lib/data/geojson";

describe("map GeoJSON conversion", () => {
  it("converts places to public point features", () => {
    const place = places[0];
    const feature = placeToFeature(place);

    expect(feature).toMatchObject({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [place.coordinates.lng, place.coordinates.lat]
      },
      properties: {
        id: place.id,
        slug: place.slug,
        name: place.name,
        category: place.category,
        neighborhood: place.area,
        routeCount: place.relatedRouteSlugs.length
      }
    });
    expect(feature?.properties.sourceQuality).toBeUndefined();
  });

  it("filters invalid place coordinates from feature collections", () => {
    const collection = placesToFeatureCollection([
      places[0],
      {
        ...places[1],
        coordinates: { lat: 99, lng: -73.56 }
      }
    ]);

    expect(collection.features.map((feature) => feature.properties.slug)).toEqual([places[0].slug]);
  });

  it("derives a route LineString from stop coordinates", () => {
    const line = routeStopsToLineString(routes[0]);

    expect(line?.type).toBe("LineString");
    expect(line?.coordinates).toEqual(routes[0].stops.map((stop) => [stop.coordinates.lng, stop.coordinates.lat]));
  });

  it("computes bounds only from valid coordinates", () => {
    expect(
      getCityBounds([
        { lat: 45.5, lng: -73.6 },
        { lat: Number.NaN, lng: -73.56 },
        { lat: 45.52, lng: -73.54 }
      ])
    ).toEqual([
      [-73.6, 45.5],
      [-73.54, 45.52]
    ]);
  });

  it("maps categories to stable style keys and validates coordinate ranges", () => {
    expect(getPlaceCategoryStyleKey("church")).toBe("heritage");
    expect(getPlaceCategoryStyleKey("viewpoint")).toBe("landscape");
    expect(validateCoordinates({ lat: 45.5, lng: -73.56 })).toBe(true);
    expect(validateCoordinates({ lat: 120, lng: -73.56 })).toBe(false);
  });
});
