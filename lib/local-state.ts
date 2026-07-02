import { featureFlagDefaults, normalizeFeatureFlags, type FeatureFlags } from "@/lib/feature-flags";
import { validateIssueReportInput } from "@/lib/issue-reports";
import { readStorageValue, storageKeys, writeStorageValue, type StorageKey } from "@/lib/storage";
import type { IssueReport, IssueReportInput, Route, RouteSession, SavedItem, UserPreferences, WalkSession } from "@/lib/types";

const legacyStorageKeys = {
  savedItems: "meaningful-routes-saved",
  completedWalks: "meaningful-routes-history",
  walkSessions: "meaningful-routes-active-sessions",
  compareBasket: "meaningful-routes-compare-basket",
  issueReports: "meaningful-routes-issue-reports",
  preferences: "meaningful-routes-preferences"
};

const defaultAlertPreferences: NonNullable<UserPreferences["alertPreferences"]> = {
  routeChanges: true,
  accessibility: true,
  weather: false
};

const defaultPreferences: UserPreferences = {
  units: "metric",
  preferredPace: "relaxed",
  interests: ["history", "architecture"],
  preferQuietRoutes: false,
  preferCafes: false,
  preferIndoorRainyDay: false,
  avoidStairs: false,
  accessibilityNeeds: [],
  locationPermissionStatus: "unknown",
  alertPreferences: defaultAlertPreferences
};

export function getSavedItems(): SavedItem[] {
  return readStorageValue<SavedItem[]>(storageKeys.savedItems, [], { legacyKeys: [legacyStorageKeys.savedItems] });
}

export function isSavedItem(itemType: SavedItem["itemType"], itemSlug: string): boolean {
  return getSavedItems().some((item) => item.itemType === itemType && item.itemSlug === itemSlug);
}

export function toggleSavedItem(input: Omit<SavedItem, "id" | "savedAt">): { ok: boolean; saved: boolean; items: SavedItem[] } {
  const current = getSavedItems();
  const existing = current.find((item) => item.itemType === input.itemType && item.itemSlug === input.itemSlug);
  const next = existing
    ? current.filter((item) => item.id !== existing.id)
    : [
        {
          ...input,
          id: `${input.itemType}-${input.itemSlug}`,
          savedAt: new Date().toISOString()
        },
        ...current
      ];

  writeLocalState(storageKeys.savedItems, next);
  const persistedSaved = isSavedItem(input.itemType, input.itemSlug);
  const intendedSaved = !existing;
  const ok = persistedSaved === intendedSaved;

  return {
    ok,
    saved: ok ? intendedSaved : persistedSaved,
    items: ok ? next : current
  };
}

export function getCompareRouteSlugs(): string[] {
  return unique(readStorageValue<string[]>(storageKeys.compareBasket, [], { legacyKeys: [legacyStorageKeys.compareBasket] }).filter(Boolean)).slice(0, 4);
}

export function isRouteInCompareBasket(routeSlug: string): boolean {
  return getCompareRouteSlugs().includes(routeSlug);
}

export function toggleCompareRoute(route: Pick<Route, "slug">): { selected: boolean; routeSlugs: string[] } {
  const current = getCompareRouteSlugs();
  const exists = current.includes(route.slug);
  const next = (exists ? current.filter((slug) => slug !== route.slug) : [route.slug, ...current.filter((slug) => slug !== route.slug)]).slice(0, 4);

  writeLocalState(storageKeys.compareBasket, next);
  return {
    selected: !exists,
    routeSlugs: next
  };
}

export function setCompareRouteSelected(route: Pick<Route, "slug">, selected: boolean): { selected: boolean; routeSlugs: string[] } {
  const current = getCompareRouteSlugs().filter((slug) => slug !== route.slug);
  const next = (selected ? [route.slug, ...current] : current).slice(0, 4);

  writeLocalState(storageKeys.compareBasket, next);
  return {
    selected,
    routeSlugs: next
  };
}

export function removeCompareRoute(routeSlug: string): string[] {
  const next = getCompareRouteSlugs().filter((slug) => slug !== routeSlug);
  writeLocalState(storageKeys.compareBasket, next);
  return next;
}

export function clearCompareBasket(): string[] {
  writeLocalState(storageKeys.compareBasket, []);
  return [];
}

export function getWalkHistoryItems(): WalkSession[] {
  return readStorageValue<WalkSession[]>(storageKeys.completedWalks, [], { legacyKeys: [legacyStorageKeys.completedWalks] });
}

export function deleteWalkHistoryItem(sessionId: string): WalkSession[] {
  const next = getWalkHistoryItems().filter((session) => session.id !== sessionId);
  writeLocalState(storageKeys.completedWalks, next);
  return next;
}

export function addWalkHistoryItem(input: Omit<WalkSession, "id" | "status" | "startedAt" | "endedAt" | "pausedAt" | "totalPausedMs" | "currentStopIndex" | "visitedStopIds" | "skippedStopIds" | "progressPercent">): WalkSession[] {
  const current = getWalkHistoryItems();
  const now = new Date().toISOString();
  const next: WalkSession[] = [
    {
      ...input,
      id: `walk-${input.routeSlug}-${Date.now()}`,
      status: "completed",
      startedAt: now,
      endedAt: now,
      pausedAt: null,
      totalPausedMs: 0,
      currentStopIndex: 0,
      visitedStopIds: [],
      skippedStopIds: [],
      progressPercent: 100
    },
    ...current
  ];

  writeLocalState(storageKeys.completedWalks, next);
  return next;
}

export function getActiveRouteSessions(): RouteSession[] {
  return readStorageValue<RouteSession[]>(storageKeys.walkSessions, [], { legacyKeys: [legacyStorageKeys.walkSessions] });
}

export function getActiveRouteSession(routeSlug: string): RouteSession | undefined {
  return getActiveRouteSessions().find((session) => session.routeSlug === routeSlug && (session.status === "active" || session.status === "paused"));
}

export function startRouteSession(route: Route): RouteSession {
  const existing = getActiveRouteSession(route.slug);

  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const session: RouteSession = withStopPointers(route, {
    id: `active-${route.slug}-${Date.now()}`,
    routeId: route.id,
    routeSlug: route.slug,
    routeTitle: route.title,
    status: "active",
    startedAt: now,
    endedAt: null,
    pausedAt: null,
    totalPausedMs: 0,
    currentStopIndex: 0,
    visitedStopIds: [],
    skippedStopIds: [],
    progressPercent: 0,
    elapsedMin: 0,
    actualDistanceKm: 0
  });

  return saveRouteSession(session);
}

export function pauseRouteSession(routeSlug: string): RouteSession | undefined {
  const session = getActiveRouteSession(routeSlug);

  if (!session || session.status === "paused") {
    return session;
  }

  return saveRouteSession({
    ...session,
    pausedAt: new Date().toISOString(),
    status: "paused"
  });
}

export function resumeRouteSession(routeSlug: string): RouteSession | undefined {
  const session = getActiveRouteSession(routeSlug);

  if (!session || session.status === "active") {
    return session;
  }

  const pausedMs = session.pausedAt ? Date.now() - new Date(session.pausedAt).getTime() : 0;
  return saveRouteSession({
    ...session,
    pausedAt: null,
    totalPausedMs: session.totalPausedMs + Math.max(0, pausedMs),
    status: "active"
  });
}

export function moveRouteSession(route: Route, direction: 1 | -1): RouteSession {
  const session = getActiveRouteSession(route.slug) ?? startRouteSession(route);
  const currentStopIndex = clamp(session.currentStopIndex + direction, 0, Math.max(route.stops.length - 1, 0));

  return saveRouteSession(
    withStopPointers(route, {
      ...session,
      currentStopIndex
    })
  );
}

export function visitRouteStop(route: Route, stopId: string): RouteSession {
  const session = getActiveRouteSession(route.slug) ?? startRouteSession(route);
  const stopIndex = route.stops.findIndex((stop) => stop.id === stopId);
  const visitedStopIds = unique([...session.visitedStopIds, stopId]);
  const skippedStopIds = session.skippedStopIds.filter((id) => id !== stopId);
  const progressPercent = calculateProgress(route, visitedStopIds);
  const currentStopIndex =
    stopIndex >= 0
      ? stopIndex === session.currentStopIndex
        ? clamp(stopIndex + 1, 0, Math.max(route.stops.length - 1, 0))
        : stopIndex
      : session.currentStopIndex;

  return saveRouteSession(
    withStopPointers(route, {
      ...session,
      actualDistanceKm: calculateDistanceFromProgress(route, progressPercent),
      currentStopIndex,
      visitedStopIds,
      skippedStopIds,
      progressPercent
    })
  );
}

export function skipRouteStop(route: Route, stopId: string): RouteSession {
  const session = getActiveRouteSession(route.slug) ?? startRouteSession(route);
  const stopIndex = route.stops.findIndex((stop) => stop.id === stopId);
  const skippedStopIds = unique([...session.skippedStopIds, stopId]);
  const visitedStopIds = session.visitedStopIds.filter((id) => id !== stopId);
  const progressPercent = calculateProgress(route, [...visitedStopIds, ...skippedStopIds]);
  const currentStopIndex =
    stopIndex >= 0
      ? stopIndex === session.currentStopIndex
        ? clamp(stopIndex + 1, 0, Math.max(route.stops.length - 1, 0))
        : stopIndex
      : session.currentStopIndex;

  return saveRouteSession(
    withStopPointers(route, {
      ...session,
      actualDistanceKm: calculateDistanceFromProgress(route, progressPercent),
      currentStopIndex,
      visitedStopIds,
      skippedStopIds,
      progressPercent
    })
  );
}

export function completeRouteSession(route: Route): WalkSession {
  const session = getActiveRouteSession(route.slug) ?? startRouteSession(route);
  const now = new Date().toISOString();
  const visitedStopIds = session.visitedStopIds.length ? session.visitedStopIds : route.stops.map((stop) => stop.id);
  const completed: WalkSession = withStopPointers(route, {
    ...session,
    status: "completed",
    endedAt: now,
    pausedAt: null,
    elapsedMin: calculateElapsedMin(session, now),
    actualDistanceKm: route.distanceKm,
    currentStopIndex: route.stops.length ? Math.max(0, route.stops.length - 1) : session.currentStopIndex,
    visitedStopIds,
    progressPercent: calculateProgress(route, visitedStopIds)
  });
  const history = [completed, ...getWalkHistoryItems().filter((item) => item.id !== completed.id)];

  writeLocalState(storageKeys.completedWalks, history);
  writeLocalState(storageKeys.walkSessions, getActiveRouteSessions().filter((item) => item.id !== session.id));
  return completed;
}

export function abandonRouteSession(routeSlug: string): RouteSession | undefined {
  const session = getActiveRouteSession(routeSlug);
  if (!session) {
    return undefined;
  }

  const abandoned: RouteSession = {
    ...session,
    status: "abandoned",
    endedAt: new Date().toISOString(),
    pausedAt: null,
    elapsedMin: calculateElapsedMin(session)
  };

  writeLocalState(storageKeys.walkSessions, getActiveRouteSessions().filter((item) => item.id !== session.id));
  return abandoned;
}

export function getLocalIssueReports(): IssueReport[] {
  return readStorageValue<IssueReport[]>(storageKeys.issueReports, [], { legacyKeys: [legacyStorageKeys.issueReports] });
}

export function saveLocalIssueReport(input: IssueReportInput): IssueReport {
  const validation = validateIssueReportInput(input);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const report: IssueReport = {
    id: `issue-local-${Date.now()}`,
    routeSlug: validation.data.routeSlug,
    placeSlug: validation.data.placeSlug,
    stopId: validation.data.stopId,
    category: validation.data.category,
    severity: validation.data.severity,
    description: validation.data.description,
    createdAt: new Date().toISOString(),
    status: "new"
  };
  const next = [report, ...getLocalIssueReports()];

  writeLocalState(storageKeys.issueReports, next);
  return report;
}

export function getUserPreferences(): UserPreferences {
  return normalizeUserPreferences(readStorageValue<Partial<UserPreferences>>(storageKeys.preferences, defaultPreferences, { legacyKeys: [legacyStorageKeys.preferences] }));
}

export function saveUserPreferences(preferences: UserPreferences): UserPreferences {
  const normalized = normalizeUserPreferences(preferences);
  writeLocalState(storageKeys.preferences, normalized);
  return normalized;
}

export function getFeatureFlags(): FeatureFlags {
  return normalizeFeatureFlags(readStorageValue<Partial<FeatureFlags>>(storageKeys.featureFlags, featureFlagDefaults));
}

export function saveFeatureFlags(flags: Partial<FeatureFlags>): FeatureFlags {
  const next = normalizeFeatureFlags({ ...getFeatureFlags(), ...flags });
  writeLocalState(storageKeys.featureFlags, next);
  return next;
}

function saveRouteSession(session: RouteSession): RouteSession {
  const current = getActiveRouteSessions().filter((item) => item.id !== session.id && item.routeSlug !== session.routeSlug);
  writeLocalState(storageKeys.walkSessions, [session, ...current]);
  return session;
}

function withStopPointers(route: Route, session: RouteSession): RouteSession {
  const currentStop = route.stops[session.currentStopIndex];
  const nextStop = route.stops[Math.min(session.currentStopIndex + 1, route.stops.length - 1)];

  return {
    ...session,
    currentStopId: currentStop?.id,
    nextStopId: nextStop?.id
  };
}

function calculateElapsedMin(session: RouteSession, endedAt = new Date().toISOString()): number {
  const pausedMs =
    session.status === "paused" && session.pausedAt
      ? session.totalPausedMs + Math.max(0, new Date(endedAt).getTime() - new Date(session.pausedAt).getTime())
      : session.totalPausedMs;
  const elapsedMs = new Date(endedAt).getTime() - new Date(session.startedAt).getTime() - pausedMs;
  return Math.max(1, Math.round(elapsedMs / 60000));
}

function calculateProgress(route: Route, visitedStopIds: string[]): number {
  if (!route.stops.length) {
    return 0;
  }

  return Math.min(100, Math.round((new Set(visitedStopIds).size / route.stops.length) * 100));
}

function calculateDistanceFromProgress(route: Route, progressPercent: number): number {
  return Number((route.distanceKm * (progressPercent / 100)).toFixed(2));
}

function normalizeUserPreferences(preferences: Partial<UserPreferences>): UserPreferences {
  const alertPreferences = preferences.alertPreferences as Partial<NonNullable<UserPreferences["alertPreferences"]>> | undefined;

  return {
    ...defaultPreferences,
    ...preferences,
    interests: preferences.interests ?? defaultPreferences.interests,
    accessibilityNeeds: preferences.accessibilityNeeds ?? defaultPreferences.accessibilityNeeds,
    alertPreferences: {
      routeChanges: alertPreferences?.routeChanges ?? defaultAlertPreferences.routeChanges,
      accessibility: alertPreferences?.accessibility ?? defaultAlertPreferences.accessibility,
      weather: alertPreferences?.weather ?? defaultAlertPreferences.weather
    }
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function writeLocalState<T>(key: StorageKey, value: T): boolean {
  const ok = writeStorageValue(key, value);
  if (!ok) {
    return false;
  }

  dispatchLocalStateEvent();
  return true;
}

function dispatchLocalStateEvent(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.dispatchEvent(new CustomEvent("meaningful-routes-local-state"));
  } catch {
    // Older or mocked browser environments may not support CustomEvent.
  }
}
