import { isInsideCityBounds } from './cityProfiles';
import type {
  CityProfile,
  Coordinate,
  MVPWalkRequest,
  POI,
  POIProvider,
  RouteCandidate,
  RoutingProvider,
} from './mvpTypes';

export interface RouteEngineDependencies {
  city: CityProfile;
  poiProvider: POIProvider;
  routingProvider: RoutingProvider;
}

export interface RouteEngineWithFallbackDependencies extends RouteEngineDependencies {
  fallbackRoutingProvider: RoutingProvider;
}

const minimumPrimaryRouteCandidates = 5;
const maxLoopEndpointDistanceMeters = 150;

function isFiniteCoordinate(coordinate: Coordinate) {
  return Number.isFinite(coordinate.lat) && Number.isFinite(coordinate.lng);
}

function distanceMetersBetween(a: Coordinate, b: Coordinate) {
  const earthRadiusMeters = 6_371_000;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const deltaLat = ((b.lat - a.lat) * Math.PI) / 180;
  const deltaLng = ((b.lng - a.lng) * Math.PI) / 180;
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function deriveTimeGoalMinutes(request: MVPWalkRequest, city: CityProfile): number {
  const targetMeters = request.stepGoal * city.defaultStepLengthMeters;
  const derivedMinutes = Math.round(targetMeters / city.defaultWalkingSpeedMps / 60);

  return Math.max(15, Math.min(240, derivedMinutes));
}

export function normalizeMVPWalkRequest(request: MVPWalkRequest, city: CityProfile): MVPWalkRequest & { timeGoalMinutes: number } {
  return {
    ...request,
    timeGoalMinutes: request.timeGoalMinutes ?? deriveTimeGoalMinutes(request, city),
  };
}

function validateLoopPath(path: { geometry: Coordinate[] }, start: Coordinate, city: CityProfile) {
  const first = path.geometry[0];
  const last = path.geometry.at(-1);

  if (!first || !last) throw new Error('Routed path has no usable geometry.');
  if (path.geometry.some((coordinate) => !isInsideCityBounds(coordinate, city))) {
    throw new Error('Routed path leaves Montréal bounds.');
  }
  if (
    distanceMetersBetween(first, start) > maxLoopEndpointDistanceMeters ||
    distanceMetersBetween(last, start) > maxLoopEndpointDistanceMeters
  ) {
    throw new Error('Routed path does not return to the start.');
  }
}

export function validateMVPWalkRequest(
  request: MVPWalkRequest,
  city: CityProfile,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (request.cityId !== city.id) errors.push('Only Montréal is available in the MVP.');
  if (!isFiniteCoordinate(request.start.coordinate)) {
    errors.push('Start point coordinates must be finite numbers.');
  } else if (!isInsideCityBounds(request.start.coordinate, city)) {
    errors.push('Start point must be inside Montréal.');
  }
  if (!Number.isFinite(request.stepGoal) || request.stepGoal < 1500 || request.stepGoal > 20000) {
    errors.push('Choose between 1,500 and 20,000 steps.');
  }
  if (
    request.timeGoalMinutes !== undefined &&
    (!Number.isFinite(request.timeGoalMinutes) || request.timeGoalMinutes < 15 || request.timeGoalMinutes > 240)
  ) {
    errors.push('Choose between 15 and 240 minutes.');
  }
  if (request.interests.length === 0) errors.push('Pick at least one interest.');
  if (request.routeType !== 'loop') errors.push('The MVP only supports loop routes.');

  return { valid: errors.length === 0, errors };
}

export function metersForWalkTarget(request: MVPWalkRequest, city: CityProfile) {
  const normalizedRequest = normalizeMVPWalkRequest(request, city);
  const primaryMeters = Math.round(request.stepGoal * city.defaultStepLengthMeters);
  const timeSanityMeters = Math.round(
    normalizedRequest.timeGoalMinutes * 60 * city.defaultWalkingSpeedMps,
  );

  return {
    primaryMeters,
    timeSanityMeters,
    minMeters: Math.round(primaryMeters * 0.85),
    maxMeters: Math.round(primaryMeters * 1.15),
  };
}

function chunkPOIs(pois: POI[], desiredRoutes: number): POI[][] {
  const groups: POI[][] = [];
  const uniquePois = Array.from(new Map(pois.map((poi) => [poi.id, poi])).values());

  for (let index = 0; index < desiredRoutes; index += 1) {
    const groupSize = Math.min(uniquePois.length, 2 + (index % 3));
    const group: POI[] = [];

    for (let offset = 0; offset < groupSize; offset += 1) {
      group.push(uniquePois[(index + offset) % uniquePois.length]);
    }

    groups.push(group);
  }

  return groups;
}

function coordinateAtDistance(
  start: Coordinate,
  distanceMeters: number,
  bearingDegrees: number,
): Coordinate {
  const bearing = (bearingDegrees * Math.PI) / 180;
  const latOffset = (Math.cos(bearing) * distanceMeters) / 111_320;
  const lngOffset = (Math.sin(bearing) * distanceMeters) / (111_320 * Math.cos((start.lat * Math.PI) / 180));

  return {
    lat: start.lat + latOffset,
    lng: start.lng + lngOffset,
  };
}

function routeAnchorFor(
  request: MVPWalkRequest,
  city: CityProfile,
  targetMeters: number,
  candidateIndex: number,
): POI {
  const baseBearings = [0, 45, 90, 135, 180, 225, 270, 315];
  const routeRadiusMeters = Math.max(700, Math.min(2400, Math.round(targetMeters / 3)));
  const bearings = baseBearings.map((bearing, index) => baseBearings[(index + candidateIndex) % baseBearings.length]);
  const coordinate = bearings
    .map((bearing) => coordinateAtDistance(request.start.coordinate, routeRadiusMeters, bearing))
    .find((candidate) => isInsideCityBounds(candidate, city)) ?? city.center;

  return {
    id: `route-anchor-${request.cityId}-${candidateIndex + 1}`,
    cityId: request.cityId,
    name: `Loop shaping anchor ${candidateIndex + 1}`,
    category: request.interests[0],
    coordinate,
    source: 'route-anchor',
    moods: [request.mood],
    interestTags: [request.interests[0]],
    computedRouteValue: 0,
    metadata: {
      hidden: true,
      routeRadiusMeters,
    },
    lastImportedAt: new Date(0).toISOString(),
  };
}

export async function generateRouteCandidates(
  request: MVPWalkRequest,
  dependencies: RouteEngineDependencies,
): Promise<RouteCandidate[]> {
  const validation = validateMVPWalkRequest(request, dependencies.city);

  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }

  const normalizedRequest = normalizeMVPWalkRequest(request, dependencies.city);
  const target = metersForWalkTarget(normalizedRequest, dependencies.city);
  const searchRadius = Math.max(1800, Math.round(target.primaryMeters / 2));
  const pois = await dependencies.poiProvider.findNearby({
    city: dependencies.city,
    center: normalizedRequest.start.coordinate,
    radiusMeters: searchRadius,
    interests: normalizedRequest.interests,
    mood: normalizedRequest.mood,
  });

  const routeGroups = chunkPOIs(pois, 8);
  const targetAdjustments = [0, -0.08, 0.11, -0.15, 0.15, -0.04, 0.07, 0.2];
  const candidates: RouteCandidate[] = [];
  const skippedCandidateErrors: string[] = [];
  const noMatchingPois = pois.length === 0;

  for (const [index, waypoints] of routeGroups.entries()) {
    const adjustedTarget = Math.round(target.primaryMeters * (1 + targetAdjustments[index]));
    const routeWaypoints = [
      ...waypoints,
      routeAnchorFor(normalizedRequest, dependencies.city, adjustedTarget, index),
    ];
    let path;

    try {
      path = await dependencies.routingProvider.walkingRoute({
        start: normalizedRequest.start.coordinate,
        waypoints: routeWaypoints,
        targetMeters: adjustedTarget,
        profile: 'walking',
      });
      validateLoopPath(path, normalizedRequest.start.coordinate, dependencies.city);
    } catch (error) {
      skippedCandidateErrors.push(
        `route-${normalizedRequest.cityId}-${index + 1}: ${error instanceof Error ? error.message : 'Routing provider failed'}`,
      );
      continue;
    }

    candidates.push({
      id: `route-${normalizedRequest.cityId}-${index + 1}`,
      label: `Generated loop ${index + 1}`,
      cityId: normalizedRequest.cityId,
      geometry: path.geometry,
      pois: waypoints,
      routingWaypoints: routeWaypoints.map((waypoint) => waypoint.coordinate),
      distanceMeters: path.distanceMeters,
      durationSeconds: path.durationSeconds,
      estimatedSteps: Math.round(path.distanceMeters / dependencies.city.defaultStepLengthMeters),
      provider: path.provider,
      debug: {
        targetMeters: adjustedTarget,
        waypointStrategy: noMatchingPois
          ? 'distance-anchor loop without visible POIs'
          : `${waypoints.length} POI loop with hidden distance anchor`,
        fallbackReason: noMatchingPois ? 'No matching POIs found; generated a basic loop from distance anchors.' : undefined,
        requestedWaypointCount: routeWaypoints.length + 2,
      },
    });
  }

  if (candidates.length === 0 && skippedCandidateErrors.length > 0) {
    throw new Error(skippedCandidateErrors.join('; '));
  }

  if (skippedCandidateErrors.length > 0) {
    candidates.forEach((candidate) => {
      candidate.debug.skippedCandidateErrors = skippedCandidateErrors;
    });
  }

  return candidates;
}

export async function generateRouteCandidatesWithFallback(
  request: MVPWalkRequest,
  dependencies: RouteEngineWithFallbackDependencies,
): Promise<{ candidates: RouteCandidate[]; usedFallback: boolean; fallbackReason?: string }> {
  try {
    const candidates = await generateRouteCandidates(request, dependencies);

    if (candidates.length < minimumPrimaryRouteCandidates) {
      const skippedErrors = candidates
        .flatMap((candidate) => candidate.debug.skippedCandidateErrors ?? [])
        .filter((error, index, errors) => errors.indexOf(error) === index);
      const skippedErrorDetails = skippedErrors.length > 0 ? ` ${skippedErrors.join('; ')}` : '';

      throw new Error(
        `Primary routing returned only ${candidates.length} candidate(s).${skippedErrorDetails}`,
      );
    }

    return { candidates, usedFallback: false };
  } catch (error) {
    const fallbackReason = error instanceof Error ? error.message : 'Routing provider failed.';
    try {
      const candidates = await generateRouteCandidates(request, {
        city: dependencies.city,
        poiProvider: dependencies.poiProvider,
        routingProvider: dependencies.fallbackRoutingProvider,
      });

      return {
        candidates: candidates.map((candidate) => ({
          ...candidate,
          debug: {
            ...candidate.debug,
            fallbackReason,
          },
        })),
        usedFallback: true,
        fallbackReason,
      };
    } catch (fallbackError) {
      const secondaryReason = fallbackError instanceof Error ? fallbackError.message : 'Fallback routing provider failed.';
      const combinedReason = `${fallbackReason}; ${secondaryReason}`;

      return {
        candidates: [],
        usedFallback: true,
        fallbackReason: combinedReason,
      };
    }
  }
}
