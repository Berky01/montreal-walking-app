import type { Interest, Mood } from './types';

export type CityId = 'montreal';

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface RouteScoringWeights {
  parks: number;
  waterfront: number;
  cafes: number;
  architecture: number;
  churches: number;
  viewpoints: number;
  calm: number;
}

export interface CityProfile {
  id: CityId;
  name: string;
  bounds: BoundingBox;
  center: Coordinate;
  defaultWalkingSpeedMps: number;
  defaultStepLengthMeters: number;
  avoidRoadClasses: string[];
  moodWeights: Record<Mood, RouteScoringWeights>;
}

export interface GeocodedPlace {
  id?: string;
  label: string;
  coordinate: Coordinate;
}

export interface MVPWalkRequest {
  cityId: CityId;
  start: GeocodedPlace;
  stepGoal: number;
  timeGoalMinutes?: number;
  mood: Mood;
  interests: Interest[];
  routeType: 'loop';
}

export interface POI {
  id: string;
  cityId: CityId;
  name: string;
  category: Interest;
  coordinate: Coordinate;
  source: 'osm-seed' | 'curated' | 'osm-overpass' | 'route-anchor';
  sourceOsmId?: string;
  moods: Mood[];
  interestTags: Interest[];
  computedRouteValue: number;
  curatedRouteValue?: number;
  openingHours?: string;
  metadata?: Record<string, string | number | boolean>;
  lastImportedAt: string;
}

export interface POISearchInput {
  city: CityProfile;
  center: Coordinate;
  radiusMeters: number;
  interests: Interest[];
  mood: Mood;
}

export interface WalkingRouteInput {
  start: Coordinate;
  waypoints: POI[];
  targetMeters: number;
  profile: 'walking';
}

export interface RoutedPath {
  geometry: Coordinate[];
  distanceMeters: number;
  durationSeconds: number;
  provider: string;
}

export interface RouteCandidate {
  id: string;
  label: string;
  cityId: CityId;
  geometry: Coordinate[];
  pois: POI[];
  routingWaypoints?: Coordinate[];
  distanceMeters: number;
  durationSeconds: number;
  estimatedSteps: number;
  provider: string;
  debug: {
    targetMeters: number;
    waypointStrategy: string;
    fallbackReason?: string;
    requestedWaypointCount?: number;
    skippedCandidateErrors?: string[];
  };
}

export interface RouteScore {
  total: number;
  breakdown: {
    stepFit: number;
    timeFit: number;
    moodMatch: number;
    interestMatch: number;
    poiSpacing: number;
    detourPenalty: number;
    parkWaterfrontBonus: number;
    excessTurnPenalty: number;
  };
}

export interface ScoredRoute extends RouteCandidate {
  score: RouteScore;
  explanation: string;
  scoreSummary: string[];
  fitCategory?: RouteFitCategory;
  fitReason?: string;
  exportLinks: {
    googleMaps: string;
    gpx: string;
  };
}

export type RouteFitCategory = 'best-fit' | 'shorter' | 'scenic' | 'fewer-stops' | 'fallback-option';

export interface RouteSummary {
  id: string;
  label: string;
  explanation: string;
  estimatedSteps: number;
  durationSeconds: number;
  distanceMeters: number;
  poiCount: number;
  fitCategory?: RouteFitCategory;
  fitReason?: string;
}

export interface GeocodingProvider {
  search(query: string, city: CityProfile): Promise<GeocodedPlace[]>;
  reverse(coordinate: Coordinate): Promise<GeocodedPlace | null>;
}

export interface POIProvider {
  findNearby(input: POISearchInput): Promise<POI[]>;
}

export interface RoutingProvider {
  walkingRoute(input: WalkingRouteInput): Promise<RoutedPath>;
}

export interface FeedbackRecord {
  id: string;
  routeId: string;
  labels: string[];
  note?: string;
  createdAt: string;
}

export type LocalProfileId = 'local';

export interface SavedRouteRecord {
  id: string;
  profileId: LocalProfileId;
  routeId: string;
  route: ScoredRoute;
  createdAt: string;
}

export type WalkSessionStatus = 'active' | 'paused' | 'completed';

export interface WalkSessionRecord {
  id: string;
  profileId: LocalProfileId;
  routeId: string;
  route: ScoredRoute;
  status: WalkSessionStatus;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  elapsedSeconds: number;
  estimatedSteps: number;
  discoveredPoiIds: string[];
}

export interface CompletedWalkSummary {
  id: string;
  routeId: string;
  routeLabel: string;
  status: 'completed';
  startedAt: string;
  completedAt: string;
  elapsedSeconds: number;
  estimatedSteps: number;
  discoveredCount: number;
}

export type POIAction = 'save' | 'skip' | 'discovered';

export interface POIActionRecord {
  id: string;
  profileId: LocalProfileId;
  walkId: string;
  routeId: string;
  poiId: string;
  action: POIAction;
  poi: {
    poiId: string;
    routeId: string;
    name: string;
    category: Interest;
    coordinate: Coordinate;
  };
  createdAt: string;
}

export interface ProgressSummary {
  profileId: LocalProfileId;
  cityId: CityId;
  placesDiscovered: number;
  loopsCompleted: number;
  savedRoutes: number;
  estimatedNeighborhoodCoverage: number;
  savedDiscoveries: POIActionRecord[];
}
