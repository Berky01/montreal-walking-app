import type { Place, Route, Source } from "@/lib/data/types";

export const GENERATED_ROUTE_SOURCE_ID = "source-generated-discovery-routes";
export const PUBLIC_WALK_MAX_DISTANCE_KM = 12;
export const PUBLIC_FAMILY_ROUTE_MAX_DISTANCE_KM = 6;

const publicContentStatuses = new Set(["ready", "published"]);
const generatedRouteTags = new Set(["day-trip", "regional discovery", "bike-friendly"]);

export function getPublicRoutes(routes: Route[], places: Place[]): Route[] {
  return routes.filter((route) => isPublicRoute(route, places));
}

export function getPublicPlaces(places: Place[], routes: Route[] = []): Place[] {
  return places.filter((place) => isPublicPlace(place, routes));
}

export function isPublicRoute(route: Route, places: Place[]): boolean {
  return getPublicRouteReadinessIssues(route, places).length === 0;
}

export function isPublicPlace(place: Place, routes: Route[] = []): boolean {
  void routes;
  return getPublicPlaceReadinessIssues(place).length === 0;
}

export function getPublicRouteReadinessIssues(route: Route, places: Place[]): string[] {
  const issues: string[] = [];
  const placeById = new Map(places.map((place) => [place.id, place]));

  if (route.sources.some((source) => source.id === GENERATED_ROUTE_SOURCE_ID)) {
    issues.push(`Route ${route.slug} is a generated discovery route.`);
  }

  if (!publicContentStatuses.has(route.contentStatus)) {
    issues.push(`Route ${route.slug} is ${route.contentStatus}, not public-ready.`);
  }

  if (route.sourceQuality === "draft") {
    issues.push(`Route ${route.slug} has draft source quality.`);
  }

  if (!route.sources.length) {
    issues.push(`Route ${route.slug} is missing source attribution.`);
  }

  if (route.sources.some(isReviewOnlySource)) {
    issues.push(`Route ${route.slug} has review-only source attribution.`);
  }

  if (!route.safetyNotes.length) {
    issues.push(`Route ${route.slug} is missing safety notes.`);
  }

  if (!route.accessibilityNotes.length) {
    issues.push(`Route ${route.slug} is missing accessibility notes.`);
  }

  if (!route.media.length) {
    issues.push(`Route ${route.slug} is missing media metadata.`);
  }

  if (!Number.isFinite(route.distanceKm) || route.distanceKm <= 0 || route.distanceKm > PUBLIC_WALK_MAX_DISTANCE_KM) {
    issues.push(`Route ${route.slug} is outside public walking distance limits.`);
  }

  if (isFamilyRoute(route) && route.distanceKm > PUBLIC_FAMILY_ROUTE_MAX_DISTANCE_KM) {
    issues.push(`Route ${route.slug} exceeds family walking distance limits.`);
  }

  if (hasGeneratedRouteSignal(route)) {
    issues.push(`Route ${route.slug} has regional, day-trip, or non-walking route signals.`);
  }

  if (!hasValidRouteGeometry(route)) {
    issues.push(`Route ${route.slug} is missing valid route geometry.`);
  }

  if (route.qaStatus.content !== "ready") {
    issues.push(`Route ${route.slug} content QA is not ready.`);
  }

  if (route.qaStatus.geometry !== "ready") {
    issues.push(`Route ${route.slug} geometry QA is not ready.`);
  }

  if (route.qaStatus.fieldCheck === "not_started") {
    issues.push(`Route ${route.slug} has not started field-check review.`);
  }

  if (route.qaStatus.sources === "missing") {
    issues.push(`Route ${route.slug} is missing source QA.`);
  }

  if (route.qaStatus.overall === "draft") {
    issues.push(`Route ${route.slug} overall QA is draft.`);
  }

  if (route.qaScore < 80 || route.qaStatus.score !== route.qaScore) {
    issues.push(`Route ${route.slug} does not meet public QA score requirements.`);
  }

  if (route.stops.length < 2) {
    issues.push(`Route ${route.slug} must have at least two public stops.`);
  }

  const stopOrders = route.stops.map((stop) => stop.order);
  if (new Set(stopOrders).size !== stopOrders.length || stopOrders.some((order, index) => order !== index + 1)) {
    issues.push(`Route ${route.slug} stop order is not sequential.`);
  }

  for (const stop of route.stops) {
    const place = placeById.get(stop.placeId);
    if (!place) {
      issues.push(`Route ${route.slug} references missing place ${stop.placeId}.`);
      continue;
    }

    if (!isPublicPlace(place)) {
      issues.push(`Route ${route.slug} references hidden place ${stop.placeId}.`);
    }
  }

  return issues;
}

export function getPublicPlaceReadinessIssues(place: Place): string[] {
  const issues: string[] = [];

  if (place.discovery) {
    issues.push(`Place ${place.slug} is a generated discovery place.`);
  }

  if (!publicContentStatuses.has(place.contentStatus)) {
    issues.push(`Place ${place.slug} is ${place.contentStatus}, not public-ready.`);
  }

  if (place.sourceQuality === "draft") {
    issues.push(`Place ${place.slug} has draft source quality.`);
  }

  if (!hasValidCoordinates(place.coordinates)) {
    issues.push(`Place ${place.slug} is missing valid coordinates.`);
  }

  if (!place.sources.length) {
    issues.push(`Place ${place.slug} is missing source attribution.`);
  }

  if (place.sources.some(isReviewOnlySource)) {
    issues.push(`Place ${place.slug} has review-only source attribution.`);
  }

  if (!place.safetyNotes.length) {
    issues.push(`Place ${place.slug} is missing safety notes.`);
  }

  if (!place.accessibilityNotes.length) {
    issues.push(`Place ${place.slug} is missing accessibility notes.`);
  }

  if (!place.media.length) {
    issues.push(`Place ${place.slug} is missing media metadata.`);
  }

  return issues;
}

function isReviewOnlySource(source: Source): boolean {
  return source.status !== "verified" || source.type === "placeholder";
}

function hasGeneratedRouteSignal(route: Route): boolean {
  return [...route.tags, ...route.interests, ...route.moodTags].some((tag) => generatedRouteTags.has(tag));
}

function isFamilyRoute(route: Route): boolean {
  return [...route.tags, ...route.interests, ...route.moodTags, ...route.bestFor.map((item) => item.toLowerCase())].some(
    (tag) => tag.includes("family")
  );
}

function hasValidRouteGeometry(route: Route): boolean {
  return (
    route.geometry.type === "LineString" &&
    route.geometry.coordinates.length >= 2 &&
    route.geometry.coordinates.every(hasValidCoordinates)
  );
}

function hasValidCoordinates(coordinates: { lat: number; lng: number } | undefined): boolean {
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
