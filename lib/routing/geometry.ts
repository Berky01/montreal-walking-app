import type { Coordinates, RouteGeometry } from "@/lib/types";

export function createLineStringGeometry(coordinates: Coordinates[]): RouteGeometry {
  return {
    type: "LineString",
    coordinates
  };
}

export function hasUsableGeometry(geometry: RouteGeometry): boolean {
  return geometry.type === "LineString" && geometry.coordinates.length >= 2;
}
