import type { Coordinates, GeoJsonFeature, GeoJsonFeatureCollection, GeoJsonPoint } from "@/lib/types";
import { toGeoJsonPosition, validateCoordinates } from "@/lib/data/geojson";
import type { MapMarkerModel, MapMarkerState } from "./markers";

export const placeStyleColors: Record<string, string> = {
  heritage: "#7b4f2a",
  culture: "#3f627e",
  landscape: "#2d5a27",
  "street-life": "#8a5a10",
  civic: "#5f654f",
  landmark: "#154212"
};

export function mapMarkersToFeatureCollection(markers: MapMarkerModel[]): GeoJsonFeatureCollection<GeoJsonPoint> {
  return {
    type: "FeatureCollection",
    features: markers.filter((marker) => validateCoordinates(marker.coordinates)).map(markerToFeature)
  };
}

export function markerToFeature(marker: MapMarkerModel): GeoJsonFeature<GeoJsonPoint> {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: toGeoJsonPosition(marker.coordinates)
    },
    properties: {
      id: marker.id,
      kind: marker.kind,
      label: marker.kind === "stop" ? marker.label : "",
      slug: marker.selection?.slug ?? null,
      selectionType: marker.selection?.type ?? null,
      title: marker.title,
      selected: marker.selected,
      state: marker.state,
      sortKey: markerStateToSortKey(marker.state, marker.selected)
    }
  };
}

export function toMapLibreLngLat(coordinates: Coordinates): [number, number] {
  return [coordinates.lng, coordinates.lat];
}

export function markerStateToSortKey(state: MapMarkerState, selected: boolean): number {
  if (selected || state === "current") {
    return 90;
  }

  if (state === "next") {
    return 80;
  }

  if (state === "visited") {
    return 70;
  }

  if (state === "skipped") {
    return 60;
  }

  if (state === "route") {
    return 50;
  }

  return 40;
}
