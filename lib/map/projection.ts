import type { Coordinates } from "@/lib/types";

export type CoordinateBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export type ProjectedCoordinate = {
  x: number;
  y: number;
};

export const montrealDefaultBounds: CoordinateBounds = {
  minLat: 45.47,
  maxLat: 45.56,
  minLng: -73.63,
  maxLng: -73.52
};

export function computeCoordinateBounds(points: Coordinates[], paddingRatio = 0.18): CoordinateBounds {
  if (!points.length) {
    return montrealDefaultBounds;
  }

  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const latSpan = Math.max(...lats) - Math.min(...lats);
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);
  const paddingLat = Math.max(0.006, latSpan * paddingRatio);
  const paddingLng = Math.max(0.006, lngSpan * paddingRatio);

  return {
    minLat: Math.min(...lats) - paddingLat,
    maxLat: Math.max(...lats) + paddingLat,
    minLng: Math.min(...lngs) - paddingLng,
    maxLng: Math.max(...lngs) + paddingLng
  };
}

export function projectCoordinate(point: Coordinates, bounds: CoordinateBounds): ProjectedCoordinate {
  const lngSpan = bounds.maxLng - bounds.minLng || 1;
  const latSpan = bounds.maxLat - bounds.minLat || 1;

  return {
    x: 8 + ((point.lng - bounds.minLng) / lngSpan) * 84,
    y: 92 - ((point.lat - bounds.minLat) / latSpan) * 84
  };
}

export function zoomBounds(bounds: CoordinateBounds, zoom: number): CoordinateBounds {
  if (zoom <= 1) {
    return bounds;
  }

  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLng = (bounds.minLng + bounds.maxLng) / 2;
  const latHalfSpan = (bounds.maxLat - bounds.minLat) / (2 * zoom);
  const lngHalfSpan = (bounds.maxLng - bounds.minLng) / (2 * zoom);

  return {
    minLat: centerLat - latHalfSpan,
    maxLat: centerLat + latHalfSpan,
    minLng: centerLng - lngHalfSpan,
    maxLng: centerLng + lngHalfSpan
  };
}
