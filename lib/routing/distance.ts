import type { Coordinates, RouteGeometry } from "@/lib/types";

export function geometryDistanceKm(geometry: RouteGeometry): number {
  return geometry.coordinates.slice(1).reduce((total, point, index) => {
    return total + haversineKm(geometry.coordinates[index], point);
  }, 0);
}

function haversineKm(a: Coordinates, b: Coordinates): number {
  const radiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const value =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * radiusKm * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}
