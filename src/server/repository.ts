import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type {
  CompletedWalkSummary,
  FeedbackRecord,
  POIAction,
  POIActionRecord,
  ProgressSummary,
  SavedRouteRecord,
  ScoredRoute,
  WalkSessionRecord,
  WalkSessionStatus,
} from '../domain/mvpTypes';
import { supportedInterests, supportedMoods } from '../domain/walkOptions';

export interface RouteRequestRecord {
  id: string;
  createdAt: string;
  topRoutes: ScoredRoute[];
  remainingRoutes: ScoredRoute[];
  diagnostics?: {
    usedFallback: boolean;
    fallbackReason?: string;
  };
}

export class InMemoryRouteRepository {
  protected routeRequests = new Map<string, RouteRequestRecord>();
  protected routes = new Map<string, ScoredRoute>();
  protected feedback = new Map<string, FeedbackRecord>();
  protected savedRoutes = new Map<string, SavedRouteRecord>();
  protected walkSessions = new Map<string, WalkSessionRecord>();
  protected poiActions = new Map<string, POIActionRecord>();
  protected maxRouteRequests = positiveIntegerEnv('ROUTE_STORE_MAX_REQUESTS', 200);

  saveRouteRequest(record: RouteRequestRecord) {
    this.routeRequests.set(record.id, record);
    this.pruneRouteRequests();
    this.rebuildRouteIndex();
  }

  getRoute(routeId: string): ScoredRoute | undefined {
    return this.routes.get(routeId) ?? this.savedRoutes.get(routeId)?.route;
  }

  getRouteDiagnostics(routeId: string): RouteRequestRecord['diagnostics'] | undefined {
    for (const record of this.routeRequests.values()) {
      if ([...record.topRoutes, ...record.remainingRoutes].some((route) => route.id === routeId)) {
        return record.diagnostics;
      }
    }

    return undefined;
  }

  saveFeedback(routeId: string, labels: string[], note?: string): FeedbackRecord {
    const feedback: FeedbackRecord = {
      id: `feedback-${this.feedback.size + 1}`,
      routeId,
      labels,
      note,
      createdAt: new Date().toISOString(),
    };

    this.feedback.set(feedback.id, feedback);
    return feedback;
  }

  getFeedback(): FeedbackRecord[] {
    return [...this.feedback.values()];
  }

  saveRoute(routeId: string): SavedRouteRecord | undefined {
    const route = this.getRoute(routeId);
    if (!route) return undefined;

    const existing = this.savedRoutes.get(routeId);
    if (existing) return existing;

    const savedRoute: SavedRouteRecord = {
      id: `saved-${routeId}`,
      profileId: 'local',
      routeId,
      route,
      createdAt: new Date().toISOString(),
    };

    this.savedRoutes.set(routeId, savedRoute);
    return savedRoute;
  }

  getSavedRoutes(): SavedRouteRecord[] {
    return [...this.savedRoutes.values()];
  }

  startWalk(routeId: string): WalkSessionRecord | undefined {
    const route = this.getRoute(routeId) ?? this.savedRoutes.get(routeId)?.route;
    if (!route) return undefined;

    const now = new Date().toISOString();
    const walk: WalkSessionRecord = {
      id: `walk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      profileId: 'local',
      routeId,
      route,
      status: 'active',
      startedAt: now,
      updatedAt: now,
      elapsedSeconds: 0,
      estimatedSteps: 0,
      discoveredPoiIds: [],
    };

    this.walkSessions.set(walk.id, walk);
    return walk;
  }

  getWalk(walkId: string): WalkSessionRecord | undefined {
    return this.walkSessions.get(walkId);
  }

  updateWalk(
    walkId: string,
    update: {
      status?: WalkSessionStatus;
      elapsedSeconds?: number;
      estimatedSteps?: number;
      discoveredPoiIds?: string[];
    },
  ): WalkSessionRecord | undefined {
    const walk = this.walkSessions.get(walkId);
    if (!walk) return undefined;

    const now = new Date().toISOString();
    const updated: WalkSessionRecord = {
      ...walk,
      ...update,
      discoveredPoiIds: update.discoveredPoiIds
        ? [...new Set(update.discoveredPoiIds)]
        : walk.discoveredPoiIds,
      updatedAt: now,
      completedAt: update.status === 'completed' ? walk.completedAt ?? now : walk.completedAt,
    };

    this.walkSessions.set(walkId, updated);
    return updated;
  }

  completeWalk(
    walkId: string,
    update: { elapsedSeconds?: number; estimatedSteps?: number; discoveredPoiIds?: string[] } = {},
  ): WalkSessionRecord | undefined {
    return this.updateWalk(walkId, { ...update, status: 'completed' });
  }

  savePOIAction(walkId: string, poiId: string, action: POIAction): POIActionRecord | undefined {
    const walk = this.walkSessions.get(walkId);
    if (!walk) return undefined;

    const poi = walk.route.pois.find((item) => item.id === poiId);
    if (!poi) return undefined;

    const record: POIActionRecord = {
      id: `poi-action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      profileId: 'local',
      walkId,
      routeId: walk.routeId,
      poiId,
      action,
      poi: {
        poiId,
        routeId: walk.routeId,
        name: poi.name,
        category: poi.category,
        coordinate: poi.coordinate,
      },
      createdAt: new Date().toISOString(),
    };

    this.poiActions.set(record.id, record);

    if (action === 'discovered' && !walk.discoveredPoiIds.includes(poiId)) {
      this.updateWalk(walkId, {
        discoveredPoiIds: [...walk.discoveredPoiIds, poiId],
        estimatedSteps: walk.estimatedSteps,
        elapsedSeconds: walk.elapsedSeconds,
        status: walk.status,
      });
    }

    return record;
  }

  getProgress(cityId = 'montreal'): ProgressSummary {
    const completedWalks = [...this.walkSessions.values()]
      .filter((walk) => walk.route.cityId === cityId && walk.status === 'completed');
    const discoveredActions = [...this.poiActions.values()]
      .filter((record) => record.poi && record.action === 'discovered');
    const savedDiscoveries = [...this.poiActions.values()]
      .filter((record) => record.poi && record.action === 'save')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const discoveredKeys = new Set([
      ...completedWalks.flatMap((walk) => walk.discoveredPoiIds.map((poiId) => `${walk.routeId}:${poiId}`)),
      ...discoveredActions.map((record) => `${record.routeId}:${record.poiId}`),
    ]);
    const estimatedNeighborhoodCoverage = Math.min(
      100,
      Math.round(completedWalks.length * 8 + discoveredKeys.size * 2),
    );

    return {
      profileId: 'local',
      cityId: 'montreal',
      placesDiscovered: discoveredKeys.size,
      loopsCompleted: completedWalks.length,
      savedRoutes: this.savedRoutes.size,
      estimatedNeighborhoodCoverage,
      savedDiscoveries,
    };
  }

  getCompletedWalkSummaries(cityId = 'montreal'): CompletedWalkSummary[] {
    return [...this.walkSessions.values()]
      .filter((walk) => walk.route.cityId === cityId && walk.status === 'completed' && walk.completedAt)
      .sort((a, b) => (b.completedAt ?? b.updatedAt).localeCompare(a.completedAt ?? a.updatedAt))
      .map((walk) => ({
        id: walk.id,
        routeId: walk.routeId,
        routeLabel: walk.route.label,
        status: 'completed' as const,
        startedAt: walk.startedAt,
        completedAt: walk.completedAt ?? walk.updatedAt,
        elapsedSeconds: walk.elapsedSeconds,
        estimatedSteps: plausibleCompletedSteps(walk),
        discoveredCount: walk.discoveredPoiIds.length,
      }));
  }

  private pruneRouteRequests() {
    while (this.routeRequests.size > this.maxRouteRequests) {
      const oldestId = this.routeRequests.keys().next().value as string | undefined;

      if (!oldestId) return;
      this.routeRequests.delete(oldestId);
    }
  }

  private rebuildRouteIndex() {
    this.routes.clear();

    for (const record of this.routeRequests.values()) {
      [...record.topRoutes, ...record.remainingRoutes].forEach((route) => {
        this.routes.set(route.id, route);
      });
    }
  }
}

function positiveIntegerEnv(name: string, defaultValue: number) {
  const value = Number(process.env[name]);

  if (!Number.isInteger(value) || value <= 0) return defaultValue;
  return value;
}

function plausibleCompletedSteps(walk: WalkSessionRecord) {
  const elapsedSeconds = Math.max(0, walk.elapsedSeconds);
  const routeDurationSeconds = Math.max(1, walk.route.durationSeconds);
  const elapsedStepCap = Math.round((elapsedSeconds / routeDurationSeconds) * walk.route.estimatedSteps);

  return Math.max(0, Math.min(walk.estimatedSteps, walk.route.estimatedSteps, elapsedStepCap));
}

interface JsonRouteStore {
  routeRequests: RouteRequestRecord[];
  feedback: FeedbackRecord[];
  savedRoutes?: SavedRouteRecord[];
  walkSessions?: WalkSessionRecord[];
  poiActions?: POIActionRecord[];
}

function isScoredRoute(value: unknown): value is ScoredRoute {
  const route = value as Partial<ScoredRoute>;

  return Boolean(
    route &&
    typeof route.id === 'string' &&
    typeof route.label === 'string' &&
    route.cityId === 'montreal' &&
    Array.isArray(route.geometry) &&
    route.geometry.length >= 2 &&
    route.geometry.every((coordinate) =>
      coordinate &&
      typeof coordinate.lat === 'number' &&
      Number.isFinite(coordinate.lat) &&
      typeof coordinate.lng === 'number' &&
      Number.isFinite(coordinate.lng),
    ) &&
    Array.isArray(route.pois) &&
    route.pois.every(isStoredPOI) &&
    isFiniteNumber(route.distanceMeters) &&
    isFiniteNumber(route.durationSeconds) &&
    isFiniteNumber(route.estimatedSteps) &&
    typeof route.provider === 'string' &&
    route.provider.trim().length > 0 &&
    isStoredRouteDebug(route.debug) &&
    isStoredRouteScore(route.score) &&
    typeof route.explanation === 'string' &&
    Array.isArray(route.scoreSummary) &&
    route.scoreSummary.every((item) => typeof item === 'string') &&
    isStoredExportLinks(route.exportLinks)
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isFiniteCoordinate(value: unknown): value is { lat: number; lng: number } {
  const coordinate = value as { lat?: unknown; lng?: unknown };

  return Boolean(
    coordinate &&
    typeof coordinate.lat === 'number' &&
    Number.isFinite(coordinate.lat) &&
    typeof coordinate.lng === 'number' &&
    Number.isFinite(coordinate.lng),
  );
}

function isStoredPOI(value: unknown) {
  const poi = value as {
    id?: unknown;
    cityId?: unknown;
    name?: unknown;
    category?: unknown;
    coordinate?: unknown;
    source?: unknown;
    moods?: unknown;
    interestTags?: unknown;
    computedRouteValue?: unknown;
    lastImportedAt?: unknown;
  };

  return Boolean(
    poi &&
    typeof poi.id === 'string' &&
    poi.cityId === 'montreal' &&
    typeof poi.name === 'string' &&
    typeof poi.category === 'string' &&
    supportedInterests.includes(poi.category as never) &&
    isFiniteCoordinate(poi.coordinate) &&
    typeof poi.source === 'string' &&
    Array.isArray(poi.moods) &&
    poi.moods.every((mood) => typeof mood === 'string' && supportedMoods.includes(mood as never)) &&
    Array.isArray(poi.interestTags) &&
    poi.interestTags.every((interest) => typeof interest === 'string' && supportedInterests.includes(interest as never)) &&
    typeof poi.computedRouteValue === 'number' &&
    Number.isFinite(poi.computedRouteValue) &&
    typeof poi.lastImportedAt === 'string',
  );
}

function isStoredRouteDebug(value: unknown) {
  const debug = value as {
    targetMeters?: unknown;
    waypointStrategy?: unknown;
    fallbackReason?: unknown;
    requestedWaypointCount?: unknown;
    skippedCandidateErrors?: unknown;
  };

  return Boolean(
    debug &&
    isFiniteNumber(debug.targetMeters) &&
    typeof debug.waypointStrategy === 'string' &&
    (debug.fallbackReason === undefined || typeof debug.fallbackReason === 'string') &&
    (debug.requestedWaypointCount === undefined || isFiniteNumber(debug.requestedWaypointCount)) &&
    (
      debug.skippedCandidateErrors === undefined ||
      (
        Array.isArray(debug.skippedCandidateErrors) &&
        debug.skippedCandidateErrors.every((error) => typeof error === 'string')
      )
    ),
  );
}

function isStoredRouteScore(value: unknown) {
  const score = value as {
    total?: unknown;
    breakdown?: Record<string, unknown>;
  };
  const breakdown = score?.breakdown;

  return Boolean(
    score &&
    isFiniteNumber(score.total) &&
    breakdown &&
    isFiniteNumber(breakdown.stepFit) &&
    isFiniteNumber(breakdown.timeFit) &&
    isFiniteNumber(breakdown.moodMatch) &&
    isFiniteNumber(breakdown.interestMatch) &&
    isFiniteNumber(breakdown.poiSpacing) &&
    isFiniteNumber(breakdown.detourPenalty) &&
    isFiniteNumber(breakdown.parkWaterfrontBonus) &&
    isFiniteNumber(breakdown.excessTurnPenalty),
  );
}

function isStoredExportLinks(value: unknown) {
  const exportLinks = value as { googleMaps?: unknown; gpx?: unknown };

  return Boolean(
    exportLinks &&
    typeof exportLinks.googleMaps === 'string' &&
    exportLinks.googleMaps.length > 0 &&
    typeof exportLinks.gpx === 'string' &&
    exportLinks.gpx.length > 0,
  );
}

function isRouteRequestRecord(value: unknown): value is RouteRequestRecord {
  const record = value as Partial<RouteRequestRecord>;

  return Boolean(
    record &&
    typeof record.id === 'string' &&
    typeof record.createdAt === 'string' &&
    Array.isArray(record.topRoutes) &&
    Array.isArray(record.remainingRoutes) &&
    record.topRoutes.every(isScoredRoute) &&
    record.remainingRoutes.every(isScoredRoute),
  );
}

function isFeedbackRecord(value: unknown): value is FeedbackRecord {
  const feedback = value as Partial<FeedbackRecord>;

  return Boolean(
    feedback &&
    typeof feedback.id === 'string' &&
    typeof feedback.routeId === 'string' &&
    Array.isArray(feedback.labels) &&
    typeof feedback.createdAt === 'string',
  );
}

function isSavedRouteRecord(value: unknown): value is SavedRouteRecord {
  const record = value as Partial<SavedRouteRecord>;

  return Boolean(
    record &&
    typeof record.id === 'string' &&
    record.profileId === 'local' &&
    typeof record.routeId === 'string' &&
    typeof record.createdAt === 'string' &&
    isScoredRoute(record.route),
  );
}

function isWalkSessionRecord(value: unknown): value is WalkSessionRecord {
  const record = value as Partial<WalkSessionRecord>;

  return Boolean(
    record &&
    typeof record.id === 'string' &&
    record.profileId === 'local' &&
    typeof record.routeId === 'string' &&
    isScoredRoute(record.route) &&
    ['active', 'paused', 'completed'].includes(record.status ?? '') &&
    typeof record.startedAt === 'string' &&
    typeof record.updatedAt === 'string' &&
    (record.completedAt === undefined || typeof record.completedAt === 'string') &&
    isFiniteNumber(record.elapsedSeconds) &&
    isFiniteNumber(record.estimatedSteps) &&
    Array.isArray(record.discoveredPoiIds) &&
    record.discoveredPoiIds.every((id) => typeof id === 'string'),
  );
}

function isPOIActionRecord(value: unknown): value is POIActionRecord {
  const record = value as Partial<POIActionRecord>;
  const poi = record?.poi as Partial<POIActionRecord['poi']> | undefined;

  return Boolean(
    record &&
    typeof record.id === 'string' &&
    record.profileId === 'local' &&
    typeof record.walkId === 'string' &&
    typeof record.routeId === 'string' &&
    typeof record.poiId === 'string' &&
    ['save', 'skip', 'discovered'].includes(record.action ?? '') &&
    typeof record.createdAt === 'string' &&
    poi &&
    typeof poi.poiId === 'string' &&
    typeof poi.routeId === 'string' &&
    typeof poi.name === 'string' &&
    typeof poi.category === 'string' &&
    supportedInterests.includes(poi.category as never) &&
    isFiniteCoordinate(poi.coordinate),
  );
}

export class JsonRouteRepository extends InMemoryRouteRepository {
  constructor(private readonly storePath: string) {
    super();
    this.load();
  }

  override saveRouteRequest(record: RouteRequestRecord) {
    super.saveRouteRequest(record);
    this.persist();
  }

  override saveFeedback(routeId: string, labels: string[], note?: string): FeedbackRecord {
    const feedback = super.saveFeedback(routeId, labels, note);

    this.persist();
    return feedback;
  }

  override saveRoute(routeId: string): SavedRouteRecord | undefined {
    const savedRoute = super.saveRoute(routeId);

    if (savedRoute) this.persist();
    return savedRoute;
  }

  override startWalk(routeId: string): WalkSessionRecord | undefined {
    const walk = super.startWalk(routeId);

    if (walk) this.persist();
    return walk;
  }

  override updateWalk(
    walkId: string,
    update: {
      status?: WalkSessionStatus;
      elapsedSeconds?: number;
      estimatedSteps?: number;
      discoveredPoiIds?: string[];
    },
  ): WalkSessionRecord | undefined {
    const walk = super.updateWalk(walkId, update);

    if (walk) this.persist();
    return walk;
  }

  override completeWalk(
    walkId: string,
    update: { elapsedSeconds?: number; estimatedSteps?: number; discoveredPoiIds?: string[] } = {},
  ): WalkSessionRecord | undefined {
    const walk = super.completeWalk(walkId, update);

    if (walk) this.persist();
    return walk;
  }

  override savePOIAction(walkId: string, poiId: string, action: POIAction): POIActionRecord | undefined {
    const record = super.savePOIAction(walkId, poiId, action);

    if (record) this.persist();
    return record;
  }

  private load() {
    if (!existsSync(this.storePath)) return;

    let parsed: Partial<JsonRouteStore>;

    try {
      parsed = JSON.parse(readFileSync(this.storePath, 'utf8')) as Partial<JsonRouteStore>;
    } catch {
      return;
    }

    const routeRequests = Array.isArray(parsed.routeRequests) ? parsed.routeRequests : [];
    const feedbackRecords = Array.isArray(parsed.feedback) ? parsed.feedback : [];
    const savedRouteRecords = Array.isArray(parsed.savedRoutes) ? parsed.savedRoutes : [];
    const walkSessionRecords = Array.isArray(parsed.walkSessions) ? parsed.walkSessions : [];
    const poiActionRecords = Array.isArray(parsed.poiActions) ? parsed.poiActions : [];

    for (const record of routeRequests) {
      if (!isRouteRequestRecord(record)) continue;
      super.saveRouteRequest(record);
    }

    for (const feedback of feedbackRecords) {
      if (!isFeedbackRecord(feedback)) continue;
      this.feedback.set(feedback.id, feedback);
    }

    for (const savedRoute of savedRouteRecords) {
      if (!isSavedRouteRecord(savedRoute)) continue;
      this.savedRoutes.set(savedRoute.routeId, savedRoute);
    }

    for (const walk of walkSessionRecords) {
      if (!isWalkSessionRecord(walk)) continue;
      this.walkSessions.set(walk.id, walk);
    }

    for (const action of poiActionRecords) {
      if (!isPOIActionRecord(action)) continue;
      this.poiActions.set(action.id, action);
    }
  }

  private persist() {
    mkdirSync(dirname(this.storePath), { recursive: true });
    writeFileSync(
      this.storePath,
      JSON.stringify({
        routeRequests: [...this.routeRequests.values()],
        feedback: [...this.feedback.values()],
        savedRoutes: [...this.savedRoutes.values()],
        walkSessions: [...this.walkSessions.values()],
        poiActions: [...this.poiActions.values()],
      } satisfies JsonRouteStore, null, 2),
    );
  }
}
