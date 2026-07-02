import { describe, expect, it } from "vitest";
import type { MapMarkerModel } from "@/lib/map/markers";
import { mapMarkersToFeatureCollection, markerStateToSortKey, toMapLibreLngLat } from "@/lib/map/maplibre";

const stopMarker: MapMarkerModel = {
  id: "stop-1",
  kind: "stop",
  label: "1",
  ariaLabel: "Show stop 1 on map",
  title: "Place d'Armes",
  coordinates: { lat: 45.5045, lng: -73.5561 },
  selected: true,
  state: "next",
  selection: { type: "place", slug: "place-darmes" }
};

describe("MapLibre map helpers", () => {
  it("converts app coordinates to MapLibre longitude-latitude order", () => {
    expect(toMapLibreLngLat(stopMarker.coordinates)).toEqual([-73.5561, 45.5045]);
  });

  it("builds point features without exposing marker aria text", () => {
    const collection = mapMarkersToFeatureCollection([stopMarker]);

    expect(collection.features).toHaveLength(1);
    expect(collection.features[0]).toMatchObject({
      geometry: {
        type: "Point",
        coordinates: [-73.5561, 45.5045]
      },
      properties: {
        id: "stop-1",
        kind: "stop",
        label: "1",
        slug: "place-darmes",
        selectionType: "place",
        title: "Place d'Armes",
        selected: true,
        state: "next"
      }
    });
    expect(collection.features[0].properties.ariaLabel).toBeUndefined();
  });

  it("filters invalid marker coordinates", () => {
    const collection = mapMarkersToFeatureCollection([
      stopMarker,
      {
        ...stopMarker,
        id: "bad",
        coordinates: { lat: Number.NaN, lng: -73.56 }
      }
    ]);

    expect(collection.features.map((feature) => feature.properties.id)).toEqual(["stop-1"]);
  });

  it("sorts selected and current markers above default markers", () => {
    expect(markerStateToSortKey("current", false)).toBeGreaterThan(markerStateToSortKey("default", false));
    expect(markerStateToSortKey("default", true)).toBeGreaterThan(markerStateToSortKey("next", false));
  });
});
