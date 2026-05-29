import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type {
  CompletedWalkSummary,
  GeocodedPlace,
  POIAction,
  POIActionRecord,
  ProgressSummary,
  RouteSummary,
  SavedRouteRecord,
  ScoredRoute,
  WalkSessionRecord,
} from '@walking-app/shared';
import type { Interest } from '@walking-app/shared';
import { buildBailoutOptions, buildNextMove, buildTimeGuardrail } from '@walking-app/shared';
import type { BailoutOption, NextMoveSummary, TimeGuardrailSummary } from '@walking-app/shared';
import { createApiClient, resolveApiBaseUrl } from '../api/client';
import type { WalkingApiClient } from '../api/client';
import { createSettingsStorage } from '../platform/settingsStorage';
import type { LocalUserSettings } from '../platform/settingsStorage';
import { defaultSettings } from '../platform/settingsStorage';
import { createLocationTracker } from '../platform/locationTracking';
import type { LiveTrackingStatus } from '../platform/locationTracking';
import { defaultStart, goalPresets } from './goals';

interface LiveWalkState {
  status: LiveTrackingStatus | 'requesting';
  distanceMeters: number;
  estimatedSteps: number;
  error: string;
}

interface ActiveProgressSummary {
  elapsedSeconds: number;
  estimatedSteps: number;
  distanceMeters: number;
  progressPercent: number;
  source: 'gps' | 'time';
}

interface WalkAppContextValue {
  apiBaseUrlError: string;
  apiHealth: 'unknown' | 'ready' | 'unavailable';
  error: string;
  status: string;
  isBusy: boolean;
  startInput: string;
  setStartInput: (value: string) => void;
  startPlace: GeocodedPlace;
  startCandidates: GeocodedPlace[];
  setStartPlaceFromCandidate: (place: GeocodedPlace) => void;
  selectedGoalId: string;
  setSelectedGoalId: (id: string) => void;
  selectedGoal: typeof goalPresets[number];
  selectedInterests: Interest[];
  toggleInterest: (interest: Interest) => void;
  routeSummaries: RouteSummary[];
  routes: ScoredRoute[];
  selectedRoute: ScoredRoute | null;
  walk: WalkSessionRecord | null;
  progress: ProgressSummary | null;
  savedRoutes: SavedRouteRecord[];
  savedRouteIds: string[];
  savingRouteIds: string[];
  completedWalks: CompletedWalkSummary[];
  poiActions: POIActionRecord[];
  settings: LocalUserSettings;
  updateSettings: (settings: Partial<LocalUserSettings>) => void;
  exportDataLedger: () => void;
  deleteLocalData: () => void;
  liveWalk: LiveWalkState;
  activeProgress: ActiveProgressSummary | null;
  nextMove: NextMoveSummary | null;
  timeGuardrail: TimeGuardrailSummary | null;
  bailoutOptions: BailoutOption[];
  activeWalkGuidance: string;
  chooseBailout: (optionId: string) => void;
  nextPOIId: string | null;
  discoveredPoiIds: string[];
  needsLowProgressConfirmation: boolean;
  confirmLowProgressComplete: () => void;
  feedbackLabels: string[];
  feedbackNote: string;
  setFeedbackNote: (value: string) => void;
  toggleFeedbackLabel: (label: string) => void;
  loadRuntime: () => Promise<void>;
  lookupStart: () => Promise<void>;
  generateRoutes: () => Promise<boolean>;
  openRouteDetail: (routeId: string) => Promise<boolean>;
  saveRoute: (route: ScoredRoute) => Promise<boolean>;
  startWalk: (route: ScoredRoute) => Promise<boolean>;
  updateWalkStatus: (status: 'active' | 'paused') => Promise<void>;
  actOnPOI: (poiId: string, action: POIAction) => Promise<void>;
  enableLiveTracking: () => Promise<void>;
  stopLiveTracking: () => void;
  completeWalk: () => Promise<boolean>;
  submitFeedback: () => Promise<boolean>;
  reportError: (message: string) => void;
  clearError: () => void;
}

const WalkAppContext = createContext<WalkAppContextValue | null>(null);

const bailoutGuidanceById: Record<string, string> = {
  shortcut: 'Shortcut preview: follow the highlighted route back after the next stop.',
  return: 'Return guidance: head back toward the start point when the route feels familiar.',
  transit: 'Transit handoff: bus 80 is the closest low-effort exit.',
};

function distanceBetweenMeters(first: { lat: number; lng: number }, second: { lat: number; lng: number }) {
  const earthRadiusMeters = 6371000;
  const latDelta = (second.lat - first.lat) * Math.PI / 180;
  const lngDelta = (second.lng - first.lng) * Math.PI / 180;
  const firstLat = first.lat * Math.PI / 180;
  const secondLat = second.lat * Math.PI / 180;
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(lngDelta / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function activeElapsedSecondsFor(walk: WalkSessionRecord) {
  const storedElapsedSeconds = Math.max(0, walk.elapsedSeconds);
  if (walk.status !== 'active') return storedElapsedSeconds;

  const updatedAt = Date.parse(walk.updatedAt);
  if (!Number.isFinite(updatedAt)) return storedElapsedSeconds;

  return storedElapsedSeconds + Math.max(0, Math.round((Date.now() - updatedAt) / 1000));
}

function elapsedProgressFor(walk: WalkSessionRecord, elapsedSeconds: number) {
  return Math.min(
    walk.route.estimatedSteps,
    Math.max(1, Math.round((elapsedSeconds / Math.max(1, walk.route.durationSeconds)) * walk.route.estimatedSteps)),
  );
}

function countLabel(count: number, singular: string) {
  return `${count} ${singular}${count === 1 ? '' : 's'}`;
}

export function WalkAppProvider({ children }: PropsWithChildren) {
  const [apiBaseUrlError, setApiBaseUrlError] = useState('');
  const api = useMemo<WalkingApiClient | null>(() => {
    try {
      return createApiClient(resolveApiBaseUrl());
    } catch (error) {
      setApiBaseUrlError(error instanceof Error ? error.message : 'API base URL is not configured.');
      return null;
    }
  }, []);
  const storage = useMemo(() => createSettingsStorage(), []);
  const locationTracker = useMemo(() => createLocationTracker(), []);
  const trackingStopRef = useRef<(() => void) | null>(null);
  const lastCoordinateRef = useRef<{ lat: number; lng: number } | null>(null);

  const [apiHealth, setApiHealth] = useState<'unknown' | 'ready' | 'unavailable'>('unknown');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [startInput, setStartInput] = useState(defaultStart.label);
  const [startPlace, setStartPlace] = useState<GeocodedPlace>(defaultStart);
  const [startCandidates, setStartCandidates] = useState<GeocodedPlace[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState(goalPresets[0].id);
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>(goalPresets[0].interests);
  const [routeSummaries, setRouteSummaries] = useState<RouteSummary[]>([]);
  const [routes, setRoutes] = useState<ScoredRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [walk, setWalk] = useState<WalkSessionRecord | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<SavedRouteRecord[]>([]);
  const [savingRouteIds, setSavingRouteIds] = useState<string[]>([]);
  const [completedWalks, setCompletedWalks] = useState<CompletedWalkSummary[]>([]);
  const [poiActions, setPoiActions] = useState<POIActionRecord[]>([]);
  const [settings, setSettings] = useState<LocalUserSettings>(defaultSettings);
  const [liveWalk, setLiveWalk] = useState<LiveWalkState>({
    status: 'idle',
    distanceMeters: 0,
    estimatedSteps: 0,
    error: '',
  });
  const [feedbackLabels, setFeedbackLabels] = useState<string[]>([]);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [activeWalkGuidance, setActiveWalkGuidance] = useState('');
  const [lowProgressCompletionConfirmed, setLowProgressCompletionConfirmed] = useState(false);
  const [, setProgressTick] = useState(0);

  const selectedGoal = goalPresets.find((goal) => goal.id === selectedGoalId) ?? goalPresets[0];
  const selectedRoute = routes.find((route) => route.id === selectedRouteId) ?? routes[0] ?? walk?.route ?? null;
  const activeRoute = walk?.route ?? selectedRoute;
  const discoveredPoiIds = walk?.discoveredPoiIds ?? [];
  const savedRouteIds = savedRoutes.map((saved) => saved.routeId);
  const skippedPoiIds = poiActions
    .filter((action) => action.walkId === walk?.id && action.action === 'skip')
    .map((action) => action.poiId);
  const completedOrSkippedPoiIds = [...new Set([...discoveredPoiIds, ...skippedPoiIds])];
  const nextPOI = activeRoute?.pois.find((poi) => !completedOrSkippedPoiIds.includes(poi.id)) ?? activeRoute?.pois[0] ?? null;
  const activeProgress = walk ? {
    elapsedSeconds: activeElapsedSecondsFor(walk),
    estimatedSteps: liveWalk.estimatedSteps > 0 ? Math.min(walk.route.estimatedSteps, liveWalk.estimatedSteps) : elapsedProgressFor(walk, activeElapsedSecondsFor(walk)),
    distanceMeters: liveWalk.distanceMeters > 0 ? Math.min(walk.route.distanceMeters, liveWalk.distanceMeters) : Math.min(walk.route.distanceMeters, walk.route.distanceMeters * (activeElapsedSecondsFor(walk) / Math.max(1, walk.route.durationSeconds))),
    progressPercent: Math.min(100, Math.round(((liveWalk.estimatedSteps > 0 ? liveWalk.estimatedSteps : elapsedProgressFor(walk, activeElapsedSecondsFor(walk))) / Math.max(1, walk.route.estimatedSteps)) * 100)),
    source: liveWalk.estimatedSteps > 0 ? 'gps' as const : 'time' as const,
  } : null;
  const progressWalk = walk && activeProgress ? { ...walk, elapsedSeconds: activeProgress.elapsedSeconds, estimatedSteps: activeProgress.estimatedSteps } : walk;
  const nextMove = activeRoute ? buildNextMove(activeRoute, nextPOI) : null;
  const timeGuardrail = progressWalk ? buildTimeGuardrail(progressWalk, progressWalk.route) : null;
  const bailoutOptions = activeRoute ? buildBailoutOptions(activeRoute) : [];
  const needsLowProgressConfirmation = Boolean(
    activeProgress
    && activeProgress.progressPercent < 20
    && discoveredPoiIds.length === 0
    && !lowProgressCompletionConfirmed,
  );

  const loadRuntime = useCallback(async () => {
    if (!api) return;
    try {
      await api.health();
      setApiHealth('ready');
      setError('');
      const [settingsValue, progressResponse, savedResponse, walksResponse] = await Promise.all([
        storage.load(),
        api.progress().catch(() => ({ progress: null })),
        api.savedRoutes().catch(() => ({ savedRoutes: [] })),
        api.completedWalks().catch(() => ({ walks: [] })),
      ]);
      setSettings(settingsValue);
      if (progressResponse.progress) setProgress(progressResponse.progress);
      setSavedRoutes(savedResponse.savedRoutes);
      setCompletedWalks(walksResponse.walks);
    } catch (caught) {
      setApiHealth('unavailable');
      setError(caught instanceof Error ? caught.message : 'Walking service is unavailable.');
    }
  }, [api, storage]);

  useEffect(() => {
    void loadRuntime();
    return () => trackingStopRef.current?.();
  }, [loadRuntime]);

  useEffect(() => {
    const goal = goalPresets.find((item) => item.id === selectedGoalId);
    if (goal) setSelectedInterests(goal.interests);
  }, [selectedGoalId]);

  useEffect(() => {
    if (!walk || walk.status !== 'active' || liveWalk.status === 'tracking') return undefined;

    const interval = setInterval(() => setProgressTick((tick) => tick + 1), 15_000);
    return () => clearInterval(interval);
  }, [liveWalk.status, walk]);

  function updateSettings(next: Partial<LocalUserSettings>) {
    setSettings((current) => {
      const merged = { ...current, ...next, privacyMode: 'local-first' as const };
      void storage.save(merged);
      return merged;
    });
  }

  function exportDataLedger() {
    setStatus(`${countLabel(savedRoutes.length, 'saved route')}, ${countLabel(completedWalks.length, 'completed walk')}, ${settings.privacyMode} privacy mode.`);
  }

  function deleteLocalData() {
    trackingStopRef.current?.();
    trackingStopRef.current = null;
    lastCoordinateRef.current = null;
    setSavedRoutes([]);
    setCompletedWalks([]);
    setPoiActions([]);
    setProgress(null);
    setWalk(null);
    setFeedbackLabels([]);
    setFeedbackNote('');
    setLiveWalk({ status: 'idle', distanceMeters: 0, estimatedSteps: 0, error: '' });
    setStatus('Local walk data cleared on this device.');
    setError('');
  }

  function setStartPlaceFromCandidate(place: GeocodedPlace) {
    setStartPlace(place);
    setStartInput(place.label);
    setStartCandidates([]);
  }

  function toggleInterest(interest: Interest) {
    setSelectedInterests((current) => current.includes(interest)
      ? current.filter((item) => item !== interest)
      : [...current, interest]);
  }

  async function lookupStart() {
    if (!api) return;
    setStatus('Finding nearby starts...');
    setError('');
    try {
      const response = await api.geocode(startInput);
      setStartCandidates(response.places);
      if (response.places[0]) {
        setStartPlace(response.places[0]);
        setStatus(`Using ${response.places[0].label}`);
      } else {
        setStatus('No exact start found. Try a Montreal neighborhood or POI.');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not find that start.');
      setStatus('');
    }
  }

  async function generateRoutes() {
    if (!api) return false;
    setIsBusy(true);
    setError('');
    setStatus('Building discovery loops...');
    try {
      const response = await api.generateRoutes({
        cityId: 'montreal',
        start: startPlace,
        stepGoal: selectedGoal.stepGoal,
        timeGoalMinutes: selectedGoal.timeGoalMinutes,
        mood: selectedGoal.mood,
        interests: selectedInterests.length > 0 ? selectedInterests : selectedGoal.interests,
        routeType: 'loop',
      });
      const summaries = [...response.topRoutes, ...response.remainingRoutes];
      setRouteSummaries(summaries);
      setRoutes([]);
      setSelectedRouteId(summaries[0]?.id ?? null);
      setStatus(response.fallback ?? `Found ${summaries.length} loops near ${startPlace.label}.`);
      return true;
    } catch (caught) {
      setRouteSummaries([]);
      setRoutes([]);
      setError(caught instanceof Error ? caught.message : 'No matching routes found.');
      setStatus('');
      return false;
    } finally {
      setIsBusy(false);
    }
  }

  async function openRouteDetail(routeId: string) {
    if (!api) return false;
    setError('');
    setStatus('');
    try {
      const response = await api.route(routeId);
      setRoutes((current) => [response.route, ...current.filter((route) => route.id !== response.route.id)]);
      setSelectedRouteId(response.route.id);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load this route.');
      return false;
    }
  }

  async function saveRoute(route: ScoredRoute) {
    if (!api) return false;
    if (savedRouteIds.includes(route.id) || savingRouteIds.includes(route.id)) return false;
    setSavingRouteIds((current) => [...new Set([...current, route.id])]);
    try {
      const response = await api.saveRoute(route.id);
      setSavedRoutes((current) => [response.savedRoute, ...current.filter((item) => item.routeId !== route.id)]);
      setStatus('Route saved.');
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save this route.');
      return false;
    } finally {
      setSavingRouteIds((current) => current.filter((id) => id !== route.id));
    }
  }

  async function startWalk(route: ScoredRoute) {
    if (!api) return false;
    try {
      const response = await api.startWalk(route.id);
      setWalk(response.walk);
      setLiveWalk({ status: 'idle', distanceMeters: 0, estimatedSteps: 0, error: '' });
      setActiveWalkGuidance('');
      setLowProgressCompletionConfirmed(false);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not start this walk.');
      return false;
    }
  }

  async function updateWalkStatus(nextStatus: 'active' | 'paused') {
    if (!api || !walk) return;
    const elapsedSeconds = activeElapsedSecondsFor(walk);
    const estimatedSteps = liveWalk.estimatedSteps > 0
      ? Math.min(walk.route.estimatedSteps, liveWalk.estimatedSteps)
      : elapsedProgressFor(walk, elapsedSeconds);
    const response = await api.updateWalk(walk.id, { status: nextStatus, elapsedSeconds, estimatedSteps });
    setWalk(response.walk);
  }

  async function actOnPOI(poiId: string, action: POIAction) {
    if (!api || !walk) return;
    try {
      const response = await api.actOnPoi(walk.id, poiId, action);
      setPoiActions((current) => [response.poiAction, ...current]);
      setWalk(response.walk);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update this POI.');
    }
  }

  async function enableLiveTracking() {
    trackingStopRef.current?.();
    setLiveWalk((current) => ({ ...current, status: 'requesting', error: '' }));
    const result = await locationTracker.start((coordinate) => {
      setLiveWalk((current) => {
        const previous = lastCoordinateRef.current;
        lastCoordinateRef.current = coordinate;
        const delta = previous ? distanceBetweenMeters(previous, coordinate) : 0;
        const distanceMeters = current.distanceMeters + delta;
        return {
          ...current,
          status: 'tracking',
          distanceMeters,
          estimatedSteps: Math.round(distanceMeters / 0.75),
          error: '',
        };
      });
    });
    trackingStopRef.current = result.stop ?? null;
    setLiveWalk((current) => ({
      ...current,
      status: result.status,
      error: result.error ?? '',
    }));
  }

  function stopLiveTracking() {
    trackingStopRef.current?.();
    trackingStopRef.current = null;
    setLiveWalk((current) => ({ ...current, status: current.status === 'tracking' ? 'paused' : current.status }));
  }

  async function completeWalk() {
    if (!api || !walk) return false;
    stopLiveTracking();
    const elapsedSeconds = Math.max(1, activeElapsedSecondsFor(walk));
    const estimatedSteps = liveWalk.estimatedSteps > 0
      ? Math.min(walk.route.estimatedSteps, liveWalk.estimatedSteps)
      : elapsedProgressFor(walk, elapsedSeconds);
    const response = await api.completeWalk(walk.id, {
      elapsedSeconds,
      estimatedSteps,
      discoveredPoiIds,
    });
    setWalk(response.walk);
    setProgress(response.progress);
    setCompletedWalks((current) => [{
      id: response.walk.id,
      routeId: response.walk.routeId,
      routeLabel: response.walk.route.label,
      status: 'completed',
      startedAt: response.walk.startedAt,
      completedAt: response.walk.completedAt ?? response.walk.updatedAt,
      elapsedSeconds: response.walk.elapsedSeconds,
      estimatedSteps: response.walk.estimatedSteps,
      discoveredCount: response.walk.discoveredPoiIds.length,
    }, ...current.filter((item) => item.id !== response.walk.id)]);
    setLiveWalk({ status: 'idle', distanceMeters: 0, estimatedSteps: 0, error: '' });
    setActiveWalkGuidance('');
    setLowProgressCompletionConfirmed(false);
    return true;
  }

  function chooseBailout(optionId: string) {
    setActiveWalkGuidance(bailoutGuidanceById[optionId] ?? '');
  }

  function confirmLowProgressComplete() {
    setLowProgressCompletionConfirmed(true);
  }

  function toggleFeedbackLabel(label: string) {
    setFeedbackLabels((current) => current.includes(label)
      ? current.filter((item) => item !== label)
      : [...current, label]);
  }

  async function submitFeedback() {
    if (!api || !selectedRoute || feedbackLabels.length === 0) return false;
    try {
      await api.feedback(selectedRoute.id, feedbackLabels, feedbackNote.trim() || undefined);
      setFeedbackLabels([]);
      setFeedbackNote('');
      setStatus('Feedback saved.');
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save feedback.');
      return false;
    }
  }

  const value = useMemo<WalkAppContextValue>(() => ({
    apiBaseUrlError,
    apiHealth,
    error,
    status,
    isBusy,
    startInput,
    setStartInput,
    startPlace,
    startCandidates,
    setStartPlaceFromCandidate,
    selectedGoalId,
    setSelectedGoalId,
    selectedGoal,
    selectedInterests,
    toggleInterest,
    routeSummaries,
    routes,
    selectedRoute,
    walk,
    progress,
    savedRoutes,
    savedRouteIds,
    savingRouteIds,
    completedWalks,
    poiActions,
    settings,
    updateSettings,
    exportDataLedger,
    deleteLocalData,
    liveWalk,
    activeProgress,
    nextMove,
    timeGuardrail,
    bailoutOptions,
    activeWalkGuidance,
    chooseBailout,
    nextPOIId: nextPOI?.id ?? null,
    discoveredPoiIds,
    needsLowProgressConfirmation,
    confirmLowProgressComplete,
    feedbackLabels,
    feedbackNote,
    setFeedbackNote,
    toggleFeedbackLabel,
    loadRuntime,
    lookupStart,
    generateRoutes,
    openRouteDetail,
    saveRoute,
    startWalk,
    updateWalkStatus,
    actOnPOI,
    enableLiveTracking,
    stopLiveTracking,
    completeWalk,
    submitFeedback,
    reportError: (message: string) => setError(message),
    clearError: () => setError(''),
  }), [
    activeWalkGuidance,
    apiBaseUrlError,
    apiHealth,
    bailoutOptions,
    completedWalks,
    discoveredPoiIds,
    error,
    feedbackLabels,
    feedbackNote,
    isBusy,
    liveWalk,
    loadRuntime,
    nextMove,
    nextPOI?.id,
    needsLowProgressConfirmation,
    poiActions,
    progress,
    routeSummaries,
    routes,
    savedRoutes,
    savedRouteIds,
    savingRouteIds,
    selectedGoal,
    selectedGoalId,
    selectedInterests,
    selectedRoute,
    settings,
    startCandidates,
    startInput,
    startPlace,
    status,
    timeGuardrail,
    walk,
  ]);

  return <WalkAppContext.Provider value={value}>{children}</WalkAppContext.Provider>;
}

export function useWalkApp() {
  const value = useContext(WalkAppContext);
  if (!value) throw new Error('useWalkApp must be used inside WalkAppProvider.');
  return value;
}
