import type {
  Coordinates,
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  GeoJsonLineString,
  GeoJsonPoint,
  Place,
  Route
} from "@/lib/data/types";

export function routeToGeoJson(route: Route): GeoJsonFeature {
  const geometry = routeGeometryToLineString(route);

  return {
    type: "Feature",
    geometry,
    properties: {
      id: route.id,
      slug: route.slug,
      title: route.title,
      area: route.area,
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      difficulty: route.difficulty,
      geometrySource: geometry.coordinates.length === route.geometry.coordinates.length ? "curated" : "derived_from_stops"
    }
  };
}

export function routesToFeatureCollection(routes: Route[]): GeoJsonFeatureCollection<GeoJsonLineString> {
  return {
    type: "FeatureCollection",
    features: routes.map(routeToGeoJson).filter((feature) => feature.geometry.coordinates.length > 1)
  };
}

export function placeToFeature(place: Place): GeoJsonFeature<GeoJsonPoint> | null {
  if (!validateCoordinates(place.coordinates)) {
    return null;
  }

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: toGeoJsonPosition(place.coordinates)
    },
    properties: {
      id: place.id,
      slug: place.slug,
      name: place.name,
      category: place.category,
      styleKey: getPlaceCategoryStyleKey(place.category),
      neighborhood: place.area,
      summary: place.whyItMatters || place.shortDescription,
      tags: place.tags.slice(0, 6),
      routeCount: place.relatedRouteSlugs.length
    }
  };
}

export function placesToFeatureCollection(places: Place[]): GeoJsonFeatureCollection<GeoJsonPoint> {
  return {
    type: "FeatureCollection",
    features: places.map(placeToFeature).filter(Boolean) as Array<GeoJsonFeature<GeoJsonPoint>>
  };
}

export function toGeoJsonPosition(coordinates: Coordinates): [number, number] {
  return [coordinates.lng, coordinates.lat];
}

export function toRouteGeometry(points: Coordinates[]) {
  return {
    type: "LineString" as const,
    coordinates: points
  };
}

export function routeStopsToLineString(route: Pick<Route, "stops">): GeoJsonLineString | null {
  const coordinates = route.stops.map((stop) => stop.coordinates).filter(validateCoordinates).map(toGeoJsonPosition);

  if (coordinates.length < 2) {
    return null;
  }

  return {
    type: "LineString",
    coordinates
  };
}

export function routeGeometryToLineString(route: Pick<Route, "geometry" | "stops">): GeoJsonLineString {
  const coordinates = route.geometry.coordinates.filter(validateCoordinates).map(toGeoJsonPosition);

  if (coordinates.length > 1) {
    return {
      type: "LineString",
      coordinates
    };
  }

  return routeStopsToLineString(route) ?? {
    type: "LineString",
    coordinates: []
  };
}

export function getCityBounds(points: Coordinates[]): [[number, number], [number, number]] | null {
  const validPoints = points.filter(validateCoordinates);

  if (!validPoints.length) {
    return null;
  }

  const lats = validPoints.map((point) => point.lat);
  const lngs = validPoints.map((point) => point.lng);

  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)]
  ];
}

export function getPlaceCategoryStyleKey(category: Place["category"]): string {
  if (["church", "historic_building", "heritage_building", "architecture"].includes(category)) {
    return "heritage";
  }

  if (["museum", "campus", "public_art"].includes(category)) {
    return "culture";
  }

  if (["park", "viewpoint", "waterfront"].includes(category)) {
    return "landscape";
  }

  if (["market", "cafe", "cafe_adjacent_stop"].includes(category)) {
    return "street-life";
  }

  if (["square", "public_square", "street"].includes(category)) {
    return "civic";
  }

  return "landmark";
}

export function validateCoordinates(coordinates: Coordinates | null | undefined): coordinates is Coordinates {
  return Boolean(
    coordinates &&
      Number.isFinite(coordinates.lat) &&
      Number.isFinite(coordinates.lng) &&
      coordinates.lat >= -90 &&
      coordinates.lat <= 90 &&
      coordinates.lng >= -180 &&
      coordinates.lng <= 180
  );
}
