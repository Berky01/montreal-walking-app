import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Bus,
  Check,
  Coffee,
  Compass,
  Download,
  Flag,
  Footprints,
  Leaf,
  Map as MapIcon,
  MapPin,
  Navigation,
  Pause,
  Play,
  RotateCcw,
  Route,
  Search,
  Share2,
  Sparkles,
  Timer,
  X,
  User,
} from 'lucide-react';
import { RouteMap } from './components/RouteMap';
import { AdminRouteQaPage, LiveRouteTrustPage, PlaceTrustPage } from './components/PlaceTrustPage';
import { feedbackOptions } from './domain/feedback';
import { getActiveStitchReviewScreen, StitchReviewApp } from './stitchReview';
import { buildBailoutOptions, buildNextMove, buildTimeGuardrail } from './domain/walkCompanion';
import type { BailoutOption, NextMoveSummary, TimeGuardrailSummary } from './domain/walkCompanion';
import type {
  GeocodedPlace,
  POIAction,
  POIActionRecord,
  ProgressSummary,
  RouteSummary,
  SavedRouteRecord,
  ScoredRoute,
  WalkSessionRecord,
  CompletedWalkSummary,
} from './domain/mvpTypes';
import type { Interest, Mood } from './domain/types';
import { interestOptions } from './domain/walkOptions';
import './styles.css';

type AppScreen = 'home' | 'compare' | 'detail' | 'active' | 'complete' | 'saved' | 'history' | 'settings';

interface RouteGenerateResponse {
  requestId: string;
  topRoutes: RouteSummary[];
  remainingRoutes: RouteSummary[];
  fallback?: string | null;
}

interface ProviderHealth {
  liveReady?: boolean;
  missingLiveProviders?: string[];
}

interface ClientConfig {
  map?: { mapTilerKey?: string };
  ops?: { enabled?: boolean };
}

interface LocalUserSettings {
  onboardingComplete: boolean;
  weeklyStepGoal: number;
  remindersEnabled: boolean;
  reminderTime: string;
  distanceUnit: 'km' | 'mi';
  reducedMotion: boolean;
  privacyMode: 'local-first';
}

type LiveTrackingStatus = 'idle' | 'tracking' | 'paused' | 'denied' | 'unavailable' | 'error';

interface LiveWalkState {
  status: LiveTrackingStatus;
  distanceMeters: number;
  estimatedSteps: number;
  error: string;
}

const defaultStart: GeocodedPlace = {
  id: 'default-mile-end',
  label: 'Mile End',
  coordinate: { lat: 45.5234, lng: -73.5996 },
};

const goalPresets = [
  {
    id: 'thirty',
    label: '30 min',
    title: 'After-work 30',
    stepGoal: 3200,
    timeGoalMinutes: 30,
    mood: 'calm' as Mood,
    interests: ['parks', 'cafes'] as Interest[],
  },
  {
    id: 'hour',
    label: '1 hour',
    title: 'One-hour discovery',
    stepGoal: 6500,
    timeGoalMinutes: 60,
    mood: 'scenic' as Mood,
    interests: ['architecture', 'viewpoints', 'cafes'] as Interest[],
  },
  {
    id: 'steps',
    label: '10k steps',
    title: 'Big loop',
    stepGoal: 10000,
    timeGoalMinutes: 92,
    mood: 'energetic' as Mood,
    interests: ['waterfront', 'parks', 'transit'] as Interest[],
  },
  {
    id: 'easy',
    label: 'Easy loop',
    title: 'Low-effort nearby',
    stepGoal: 3000,
    timeGoalMinutes: 28,
    mood: 'green' as Mood,
    interests: ['parks', 'public-toilets', 'transit'] as Interest[],
  },
];

const categoryIcons: Partial<Record<Interest, typeof Coffee>> = {
  cafes: Coffee,
  parks: Leaf,
  waterfront: Compass,
  viewpoints: Sparkles,
  architecture: MapPin,
  churches: MapPin,
  'public-toilets': MapPin,
  transit: Navigation,
};

const settingsStorageKey = 'walking-app:settings:v1';
const defaultSettings: LocalUserSettings = {
  onboardingComplete: false,
  weeklyStepGoal: 30000,
  remindersEnabled: false,
  reminderTime: '08:00',
  distanceUnit: 'km',
  reducedMotion: false,
  privacyMode: 'local-first',
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-CA').format(Math.round(value));
}

function humanDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function categoryLabel(category: Interest) {
  return interestOptions.find((option) => option.id === category)?.label ?? category;
}

function routeFitLabel(category: RouteSummary['fitCategory']) {
  if (category === 'best-fit') return 'Best match';
  if (category === 'shorter') return 'Shorter';
  if (category === 'scenic') return 'Scenic';
  if (category === 'fewer-stops') return 'Simpler';
  return 'Route';
}

function distanceBetweenMeters(
  first: { lat: number; lng: number },
  second: { lat: number; lng: number },
) {
  const earthRadiusMeters = 6_371_000;
  const latDelta = (second.lat - first.lat) * Math.PI / 180;
  const lngDelta = (second.lng - first.lng) * Math.PI / 180;
  const firstLat = first.lat * Math.PI / 180;
  const secondLat = second.lat * Math.PI / 180;
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(lngDelta / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function routeLinkFor(routeId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('route', routeId);
  return url.toString();
}

function downloadGPX(route: ScoredRoute) {
  const blob = new Blob([route.exportLinks.gpx], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${route.id}.gpx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let body: unknown = {};

  if (text.trim().length > 0) {
    try {
      body = JSON.parse(text);
    } catch {
      if (!response.ok) {
        throw new Error(response.status >= 500
          ? 'Walking service is unavailable. Restart the API or check provider health.'
          : text);
      }

      throw new Error('The walking service returned an unreadable response.');
    }
  }

  if (!response.ok) {
    const errorBody = body as { error?: string; action?: string; fallback?: string; message?: string };
    const message = [errorBody.error ?? errorBody.message, errorBody.action, errorBody.fallback]
      .filter(Boolean)
      .join(' ');
    throw new Error(message || (response.status >= 500
      ? 'Walking service is unavailable. Restart the API or check provider health.'
      : 'Request failed.'));
  }

  return body as T;
}

function loadSettings(): LocalUserSettings {
  try {
    const raw = window.localStorage.getItem(settingsStorageKey);
    if (!raw) return defaultSettings;

    const parsed = JSON.parse(raw) as Partial<LocalUserSettings>;

    return {
      ...defaultSettings,
      ...parsed,
      weeklyStepGoal: Number.isFinite(parsed.weeklyStepGoal) && parsed.weeklyStepGoal! > 0
        ? Math.round(parsed.weeklyStepGoal!)
        : defaultSettings.weeklyStepGoal,
      distanceUnit: parsed.distanceUnit === 'mi' ? 'mi' : 'km',
      privacyMode: 'local-first',
    };
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings: LocalUserSettings) {
  window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
}

function selectedGoalCopy(goal: typeof goalPresets[number]) {
  return `${formatNumber(goal.stepGoal)} steps · about ${goal.timeGoalMinutes} min`;
}

function routeSummaryFor(route: ScoredRoute): RouteSummary {
  return {
    id: route.id,
    label: route.label,
    explanation: route.explanation,
    estimatedSteps: route.estimatedSteps,
    durationSeconds: route.durationSeconds,
    distanceMeters: route.distanceMeters,
    poiCount: route.pois.length,
  };
}

function activeElapsedSecondsFor(walk: WalkSessionRecord) {
  const storedElapsedSeconds = Math.max(0, walk.elapsedSeconds);
  if (walk.status !== 'active') return storedElapsedSeconds;

  const startedAt = Date.parse(walk.startedAt);
  const updatedAt = Date.parse(walk.updatedAt);
  const wallClockElapsedSeconds = Number.isFinite(startedAt)
    ? Math.max(0, Math.round((Date.now() - startedAt) / 1000))
    : storedElapsedSeconds;

  if (storedElapsedSeconds > 0 && Number.isFinite(updatedAt) && updatedAt > startedAt) {
    return storedElapsedSeconds + Math.max(0, Math.round((Date.now() - updatedAt) / 1000));
  }

  return Math.max(storedElapsedSeconds, wallClockElapsedSeconds);
}

function estimatedStepsForElapsed(walk: WalkSessionRecord, elapsedSeconds: number) {
  return Math.min(
    walk.route.estimatedSteps,
    Math.round((elapsedSeconds / walk.route.durationSeconds) * walk.route.estimatedSteps),
  );
}

function poiStopTime(category: Interest) {
  if (category === 'cafes') return '8 min';
  if (category === 'viewpoints' || category === 'waterfront') return '5 min';
  return '3 min';
}

function reasonForPOI(category: Interest) {
  if (category === 'cafes') return 'Good pause point without turning the walk into an errand.';
  if (category === 'parks') return 'Adds a softer block and a place to reset your pace.';
  if (category === 'architecture') return 'A visible street-level detail worth slowing down for.';
  if (category === 'waterfront') return 'Gives the loop a clear scenic anchor.';
  if (category === 'transit') return 'Keeps the walk easy to exit if plans change.';
  return 'A practical nearby discovery that fits this route.';
}

export default function App() {
  if (getActiveStitchReviewScreen()) return <StitchReviewApp />;

  const trustRoute = parseTrustRoute(window.location.pathname, window.location.search);
  if (trustRoute?.type === 'place') return <PlaceTrustPage slug={trustRoute.slug} />;
  if (trustRoute?.type === 'live-route') return <LiveRouteTrustPage slug={trustRoute.slug} />;
  if (trustRoute?.type === 'admin-route-qa') return <AdminRouteQaPage enabled={trustRoute.enabled} />;

  const [screen, setScreen] = useState<AppScreen>('home');
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
  const [completedWalks, setCompletedWalks] = useState<CompletedWalkSummary[]>([]);
  const [poiActions, setPoiActions] = useState<POIActionRecord[]>([]);
  const [feedbackLabels, setFeedbackLabels] = useState<string[]>([]);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [settings, setSettings] = useState<LocalUserSettings>(() => loadSettings());
  const [liveWalk, setLiveWalk] = useState<LiveWalkState>({
    status: 'idle',
    distanceMeters: 0,
    estimatedSteps: 0,
    error: '',
  });
  const [mapTilerKey, setMapTilerKey] = useState(import.meta.env.VITE_MAPTILER_API_KEY ?? '');
  const [opsEnabled, setOpsEnabled] = useState(false);
  const [providerHealth, setProviderHealth] = useState<ProviderHealth | null>(null);
  const [apiHealth, setApiHealth] = useState<'unknown' | 'ready' | 'unavailable'>('unknown');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [bailoutGuidance, setBailoutGuidance] = useState('');
  const watchIdRef = useRef<number | null>(null);
  const lastCoordinateRef = useRef<{ lat: number; lng: number } | null>(null);

  const selectedGoal = goalPresets.find((goal) => goal.id === selectedGoalId) ?? goalPresets[0];
  const selectedRoute = routes.find((route) => route.id === selectedRouteId) ?? routes[0] ?? walk?.route ?? null;
  const discoveredPoiIds = walk?.discoveredPoiIds ?? [];
  const skippedPoiIds = poiActions
    .filter((action) => action.walkId === walk?.id && action.action === 'skip')
    .map((action) => action.poiId);
  const completedOrSkippedPoiIds = [...new Set([...discoveredPoiIds, ...skippedPoiIds])];
  const companionRoute = screen === 'active' ? walk?.route ?? selectedRoute : selectedRoute;
  const nextPOI = companionRoute?.pois?.find((poi) => !completedOrSkippedPoiIds.includes(poi.id)) ?? null;
  const nextMove = companionRoute ? buildNextMove(companionRoute, nextPOI) : null;
  const timeGuardrail = walk ? buildTimeGuardrail(walk, walk.route) : null;
  const bailoutOptions = companionRoute ? buildBailoutOptions(companionRoute) : [];
  const isOpsRoute = new URLSearchParams(window.location.search).get('ops') === '1';

  const recommendedRoutes = useMemo(() => routeSummaries.slice(0, 5), [routeSummaries]);

  useEffect(() => {
    void loadRuntime();
  }, []);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => () => stopLiveTracking(), []);

  useEffect(() => {
    const goal = goalPresets.find((item) => item.id === selectedGoalId);
    if (goal) setSelectedInterests(goal.interests);
  }, [selectedGoalId]);

  async function loadRuntime() {
    try {
      const configResponse = await fetch('/api/client-config');
      const config = await parseJsonResponse<ClientConfig>(configResponse);
      setMapTilerKey(config.map?.mapTilerKey ?? '');
      setOpsEnabled(Boolean(config.ops?.enabled));
      setApiHealth('ready');
      setError('');

      const progressResponse = await fetch('/api/progress?city=montreal');
      if (progressResponse.ok) {
        const body = await parseJsonResponse<{ progress: ProgressSummary | null }>(progressResponse);
        if (body.progress) setProgress(body.progress);
      }

      const savedResponse = await fetch('/api/routes/saved');
      if (savedResponse.ok) {
        const body = await parseJsonResponse<{ savedRoutes: SavedRouteRecord[] }>(savedResponse);
        setSavedRoutes(body.savedRoutes);
      }

      const walksResponse = await fetch('/api/walks?city=montreal&status=completed');
      if (walksResponse.ok) {
        const body = await parseJsonResponse<{ walks: CompletedWalkSummary[] }>(walksResponse);
        setCompletedWalks(body.walks);
      }

      const linkedRouteId = new URLSearchParams(window.location.search).get('route');
      if (linkedRouteId) {
        const linkedRouteResponse = await fetch(`/api/routes/${encodeURIComponent(linkedRouteId)}`);
        if (linkedRouteResponse.ok) {
          const body = await parseJsonResponse<{ route: ScoredRoute }>(linkedRouteResponse);
          setRoutes([body.route]);
          setRouteSummaries([routeSummaryFor(body.route)]);
          setSelectedRouteId(body.route.id);
          setScreen('detail');
        }
      }

      if (isOpsRoute && config.ops?.enabled) {
        const health = await parseJsonResponse<ProviderHealth>(await fetch('/api/health/providers'));
        setProviderHealth(health);
      }
    } catch {
      setApiHealth('unavailable');
      setError('Walking service is unavailable. Restart the API or check provider health.');
      setOpsEnabled(import.meta.env.DEV);
    }
  }

  async function lookupStart() {
    setError('');
    setStatus('Finding nearby starts...');
    try {
      const response = await fetch(`/api/geocode?city=montreal&query=${encodeURIComponent(startInput)}`);
      const body = await parseJsonResponse<{ places: GeocodedPlace[]; provider: string }>(response);
      setStartCandidates(body.places);
      if (body.places[0]) {
        setStartPlace(body.places[0]);
        setStatus(`Using ${body.places[0].label}`);
      } else {
        setStatus('No exact start found. Try a Montreal neighborhood or POI.');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not find that start.');
      setStatus('');
    }
  }

  async function generateRoutes() {
    setIsBusy(true);
    setError('');
    setStatus('Building discovery loops...');

    try {
      const response = await fetch('/api/routes/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          cityId: 'montreal',
          start: startPlace,
          stepGoal: selectedGoal.stepGoal,
          timeGoalMinutes: selectedGoal.timeGoalMinutes,
          mood: selectedGoal.mood,
          interests: selectedInterests.length > 0 ? selectedInterests : selectedGoal.interests,
          routeType: 'loop',
        }),
      });
      const body = await parseJsonResponse<RouteGenerateResponse>(response);
      const nextRoutes = [...body.topRoutes, ...body.remainingRoutes];

      if (nextRoutes.length === 0) {
        setRouteSummaries([]);
        setRoutes([]);
        setScreen('compare');
        setError(body.fallback ?? 'No matching routes found.');
        setStatus('');
        return;
      }

      setRouteSummaries(nextRoutes);
      setRoutes([]);
      setSelectedRouteId(nextRoutes[0].id);
      setStatus(body.fallback ?? `Found ${nextRoutes.length} loops near ${startPlace.label}.`);
      setScreen('compare');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'No matching routes found.';
      setRouteSummaries([]);
      setRoutes([]);
      setError(message.includes('Walking service is unavailable')
        ? 'Route service is unavailable. Restart the API or check provider health.'
        : message);
      setStatus('');
      setScreen('compare');
    } finally {
      setIsBusy(false);
    }
  }

  async function openRouteDetail(routeId: string) {
    setError('');
    setStatus('');
    try {
      const body = await parseJsonResponse<{ route: ScoredRoute }>(
        await fetch(`/api/routes/${encodeURIComponent(routeId)}`),
      );
      setRoutes((current) => [body.route, ...current.filter((route) => route.id !== body.route.id)]);
      setSelectedRouteId(body.route.id);
      setScreen('detail');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load this route.');
    }
  }

  async function saveRoute(route: ScoredRoute) {
    setStatus('');
    try {
      const body = await parseJsonResponse<{ savedRoute: SavedRouteRecord }>(
        await fetch(`/api/routes/${route.id}/save`, { method: 'POST' }),
      );
      setSavedRoutes((current) => [body.savedRoute, ...current.filter((item) => item.routeId !== route.id)]);
      setStatus('Route saved.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save this route.');
    }
  }

  async function startWalk(route: ScoredRoute) {
    setError('');
    setStatus('');
    try {
      const body = await parseJsonResponse<{ walk: WalkSessionRecord }>(
        await fetch(`/api/walks/${route.id}/start`, { method: 'POST' }),
      );
      setWalk(body.walk);
      setBailoutGuidance('');
      setLiveWalk({ status: 'idle', distanceMeters: 0, estimatedSteps: 0, error: '' });
      setScreen('active');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not start this walk.');
    }
  }

  async function updateWalkStatus(nextStatus: 'active' | 'paused') {
    if (!walk) return;

    const elapsedSeconds = Math.max(60, activeElapsedSecondsFor(walk));
    const estimatedSteps = Math.max(walk.estimatedSteps, estimatedStepsForElapsed(walk, elapsedSeconds), liveWalk.estimatedSteps || 0);
    const body = await parseJsonResponse<{ walk: WalkSessionRecord }>(
      await fetch(`/api/walks/${walk.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, elapsedSeconds, estimatedSteps }),
      }),
    );
    setWalk(body.walk);
  }

  async function actOnPOI(poiId: string, action: POIAction) {
    if (!walk) return;

    try {
      const body = await parseJsonResponse<{ poiAction: POIActionRecord; walk: WalkSessionRecord }>(
        await fetch(`/api/walks/${walk.id}/pois/${poiId}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action }),
        }),
      );
      setPoiActions((current) => [body.poiAction, ...current]);
      setWalk(body.walk);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update this POI.');
    }
  }

  async function completeWalk() {
    if (!walk) return;

    stopLiveTracking();
    const elapsedSeconds = Math.max(60, activeElapsedSecondsFor(walk));
    const estimatedSteps = liveWalk.estimatedSteps > 0
      ? liveWalk.estimatedSteps
      : Math.max(walk.estimatedSteps, estimatedStepsForElapsed(walk, elapsedSeconds));
    const body = await parseJsonResponse<{ walk: WalkSessionRecord; progress: ProgressSummary }>(
      await fetch(`/api/walks/${walk.id}/complete`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          elapsedSeconds,
          estimatedSteps,
          discoveredPoiIds,
        }),
      }),
    );
    setWalk(body.walk);
    setProgress(body.progress);
    setCompletedWalks((current) => [{
      id: body.walk.id,
      routeId: body.walk.routeId,
      routeLabel: body.walk.route.label,
      status: 'completed',
      startedAt: body.walk.startedAt,
      completedAt: body.walk.completedAt ?? body.walk.updatedAt,
      elapsedSeconds: body.walk.elapsedSeconds,
      estimatedSteps: body.walk.estimatedSteps,
      discoveredCount: body.walk.discoveredPoiIds.length,
    }, ...current.filter((item) => item.id !== body.walk.id)]);
    setBailoutGuidance('');
    setLiveWalk({ status: 'idle', distanceMeters: 0, estimatedSteps: 0, error: '' });
    setScreen('complete');
  }

  async function submitFeedback() {
    if (!selectedRoute || feedbackLabels.length === 0) return;

    try {
      await parseJsonResponse<{ saved: boolean }>(await fetch(`/api/routes/${selectedRoute.id}/feedback`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ labels: feedbackLabels, note: feedbackNote || undefined }),
      }));
      setStatus('Feedback saved.');
      setFeedbackLabels([]);
      setFeedbackNote('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save feedback.');
    }
  }

  function toggleInterest(interest: Interest) {
    setSelectedInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  }

  function updateSettings(update: Partial<LocalUserSettings>) {
    setSettings((current) => ({ ...current, ...update, privacyMode: 'local-first' }));
  }

  function completeOnboarding() {
    updateSettings({ onboardingComplete: true });
  }

  function chooseBailout(optionId: 'shortcut' | 'return' | 'transit') {
    if (optionId === 'shortcut') {
      setBailoutGuidance('Shortcut preview: follow the highlighted route back after the next stop.');
      return;
    }

    if (optionId === 'return') {
      setBailoutGuidance('Return guidance: turn back toward the start point when the route feels familiar.');
      return;
    }

    setBailoutGuidance('Transit nearby: bus 80 is the closest low-effort exit.');
  }

  function stopLiveTracking() {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLiveWalk((current) => current.status === 'tracking' ? { ...current, status: 'paused' } : current);
  }

  function enableLiveTracking() {
    if (!navigator.geolocation) {
      setLiveWalk((current) => ({
        ...current,
        status: 'unavailable',
        error: 'Live tracking is unavailable in this browser.',
      }));
      return;
    }

    stopLiveTracking();
    lastCoordinateRef.current = null;
    setLiveWalk({ status: 'tracking', distanceMeters: 0, estimatedSteps: 0, error: '' });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coordinate = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const previous = lastCoordinateRef.current;
        lastCoordinateRef.current = coordinate;

        if (!previous) return;

        const addedMeters = distanceBetweenMeters(previous, coordinate);
        setLiveWalk((current) => {
          const distanceMeters = current.distanceMeters + addedMeters;

          return {
            ...current,
            status: 'tracking',
            distanceMeters,
            estimatedSteps: Math.round(distanceMeters / 0.75),
            error: '',
          };
        });
      },
      (geoError) => {
        setLiveWalk((current) => ({
          ...current,
          status: geoError.code === geoError.PERMISSION_DENIED ? 'denied' : 'error',
          error: geoError.code === geoError.PERMISSION_DENIED
            ? 'Location permission is off. You can still complete the walk manually.'
            : 'Live tracking stopped. You can still complete the walk manually.',
        }));
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );
  }

  return (
    <main className="walk-app-shell">
      <section className="mobile-frame" aria-label="Montreal Loop Scout">
        <header className={screen === 'home' ? 'app-header neighborhood-header' : 'app-header'}>
          <button className="icon-button soft" type="button" onClick={() => setScreen(screen === 'home' ? 'saved' : 'home')} aria-label={screen === 'home' ? 'Open saved discoveries' : 'Back home'}>
            {screen === 'home' ? <Bookmark /> : <ArrowLeft />}
          </button>
          <div>
            <strong>{screen === 'home' ? 'Plateau Mont-Royal' : 'Montreal Loop Scout'}</strong>
            <span>{startPlace.label}</span>
          </div>
          <button className="icon-button soft" type="button" onClick={() => void loadRuntime()} aria-label="Refresh">
            <RotateCcw />
          </button>
        </header>

        {error && (
          <div className="message error" role="alert">
            <X />
            <span>{error}</span>
          </div>
        )}
        {status && (
          <div className="message success" role="status">
            <Check />
            <span>{status}</span>
          </div>
        )}
        {apiHealth === 'unavailable' && (
          <div className="message warning" role="status">
            <Timer />
            <span>API unavailable. The planner is showing local defaults until the walking service is healthy.</span>
          </div>
        )}

        {isOpsRoute && opsEnabled && (
          <section className="ops-strip">
            <strong>{providerHealth?.liveReady ? 'Live ready' : 'Live setup incomplete'}</strong>
            <span>{providerHealth?.missingLiveProviders?.join(', ') || 'Ops panel enabled'}</span>
          </section>
        )}

        {screen === 'home' && (
          <section className="screen-stack">
            {!settings.onboardingComplete && (
              <section className="onboarding-panel">
                <div>
                  <span className="eyebrow">Local-first</span>
                  <h2>Walk privately</h2>
                  <p>Location tracking only runs during an active walk. Raw GPS trails stay off the server.</p>
                </div>
                <button className="primary-button" type="button" onClick={completeOnboarding}>Start planning</button>
              </section>
            )}
            <div className="hero-block">
              <span className="eyebrow">Plateau Mont-Royal</span>
              <h1>Find a loop that fits today</h1>
              <p>Choose a walking goal, start near Mile End, and compare practical discovery loops.</p>
            </div>

            <div className="start-search">
              <label htmlFor="start">Start near</label>
              <div className="input-row">
                <input id="start" value={startInput} onChange={(event) => setStartInput(event.target.value)} />
                <button className="icon-button primary" type="button" onClick={() => void lookupStart()} aria-label="Search start">
                  <Search />
                </button>
              </div>
              {startCandidates.length > 0 && (
                <div className="candidate-row">
                  {startCandidates.slice(0, 3).map((place) => (
                    <button key={place.id ?? place.label} type="button" onClick={() => {
                      setStartPlace(place);
                      setStartInput(place.label);
                      setStartCandidates([]);
                    }}>
                      {place.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <section className="goal-section">
              <div className="section-heading">
                <h2>Choose a goal</h2>
                <span>{selectedGoalCopy(selectedGoal)}</span>
              </div>
              <div className="goal-grid" role="list" aria-label="Walk goals">
                {goalPresets.map((goal) => (
                  <button
                    key={goal.id}
                    className={goal.id === selectedGoalId ? 'goal-card selected' : 'goal-card'}
                    type="button"
                    aria-pressed={goal.id === selectedGoalId}
                    onClick={() => setSelectedGoalId(goal.id)}
                  >
                    <span>{goal.label}</span>
                    <strong>{goal.title}</strong>
                    <small>{selectedGoalCopy(goal)}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="chip-section">
              <h2>Nearby loops</h2>
              <div className="chip-row">
                {interestOptions.map((option) => {
                  const Icon = categoryIcons[option.id] ?? MapPin;
                  const selected = selectedInterests.includes(option.id);

                  return (
                    <button key={option.id} className={selected ? 'interest-chip selected' : 'interest-chip'} type="button" aria-pressed={selected} onClick={() => toggleInterest(option.id)}>
                      <Icon />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="quiet-progress">
              <div>
                <strong>{progress?.placesDiscovered ?? 0}</strong>
                <span>places discovered</span>
              </div>
              <div>
                <strong>{progress?.estimatedNeighborhoodCoverage ?? 0}%</strong>
                <span>estimated local coverage</span>
              </div>
            </section>

            <button className="primary-button full home-cta" type="button" disabled={isBusy} onClick={() => void generateRoutes()}>
              <Footprints />
              {isBusy ? 'Finding loops' : `Find loops for ${selectedGoal.label}`}
            </button>

            <PrimaryNav screen={screen} onNavigate={setScreen} />
          </section>
        )}

        {screen === 'compare' && (
          <section className="screen-stack">
            <ScreenTitle title="Nearby loops" detail={`${selectedGoalCopy(selectedGoal)} from ${startPlace.label}`} />
            {recommendedRoutes.length === 0 ? (
              <RecoveryState onReset={() => setScreen('home')} />
            ) : (
              <>
                <div className="route-list">
                  {recommendedRoutes.map((route) => (
                    <button key={route.id} className="route-card" type="button" onClick={() => void openRouteDetail(route.id)}>
                      <div className="route-card-top">
                        <span>{route.label}</span>
                        <strong>{routeFitLabel(route.fitCategory)}</strong>
                      </div>
                      <h2>{route.label}</h2>
                      <p>{route.fitReason ?? route.explanation}</p>
                      <div className="route-facts">
                        <span>{formatNumber(route.estimatedSteps)} steps</span>
                        <span>{Math.round(route.durationSeconds / 60)} min</span>
                        <span>{humanDistance(route.distanceMeters)}</span>
                        <span>{route.poiCount} discoveries</span>
                      </div>
                    </button>
                  ))}
                </div>
                <button className="secondary-button full" type="button" onClick={() => setScreen('home')}>Adjust goal</button>
              </>
            )}
          </section>
        )}

        {screen === 'detail' && selectedRoute && (
          <section className="screen-stack">
            <ScreenTitle title={selectedRoute.label} detail={`For your ${selectedGoal.label} walk`} />
            <RouteMap route={selectedRoute} mapTilerKey={mapTilerKey} activePoiId={nextPOI?.id} completedPoiIds={completedOrSkippedPoiIds} />
            <section className="trust-panel">
              <h2>Why this route</h2>
              <p>{selectedRoute.fitReason ?? selectedRoute.explanation}</p>
              <div className="route-facts">
                <span>{humanDistance(selectedRoute.distanceMeters)}</span>
                <span>{formatNumber(selectedRoute.estimatedSteps)} steps</span>
                <span>{selectedRoute.pois.length} stops</span>
              </div>
            </section>
            <POISequence route={selectedRoute} />
            <div className="action-grid">
              <button className="primary-button" type="button" onClick={() => void startWalk(selectedRoute)}>
                <Play /> Start
              </button>
              <button className="secondary-button" type="button" onClick={() => void saveRoute(selectedRoute)}>
                <Bookmark /> Save
              </button>
              <a className="secondary-button" href={selectedRoute.exportLinks.googleMaps} target="_blank" rel="noreferrer">
                <Navigation /> Maps
              </a>
              <button className="secondary-button" type="button" onClick={() => downloadGPX(selectedRoute)}>
                <Download /> GPX
              </button>
              <a className="secondary-button" href={routeLinkFor(selectedRoute.id)}>
                <Share2 /> Link
              </a>
            </div>
          </section>
        )}

        {screen === 'active' && walk && (
          <section className="screen-stack companion-screen">
            <CompanionHeader route={walk.route} gpsActive={liveWalk.status === 'tracking'} />
            <RouteMap route={walk.route} mapTilerKey={mapTilerKey} activePoiId={nextPOI?.id} completedPoiIds={completedOrSkippedPoiIds} compact companionStrip />
            {nextMove ? <NextMoveCard nextMove={nextMove} /> : null}
            {timeGuardrail ? <TimeGuardrailCard guardrail={timeGuardrail} /> : null}
            <BailoutActions options={bailoutOptions} onChoose={chooseBailout} />
            {bailoutGuidance && (
              <div className="bailout-guidance" role="status">{bailoutGuidance}</div>
            )}
            <section className="tracking-panel compact-tracking">
              <div>
                <span>Live tracking</span>
                <strong>{liveWalk.status === 'tracking' ? 'Live tracking on' : 'Local tracking optional'}</strong>
                <small>{liveWalk.status === 'tracking'
                  ? `${humanDistance(liveWalk.distanceMeters)} tracked locally`
                  : liveWalk.error || 'Enable browser location only while this walk is active.'}</small>
              </div>
              {liveWalk.status === 'tracking' ? (
                <button className="secondary-button" type="button" onClick={stopLiveTracking}>Pause tracking</button>
              ) : (
                <button className="secondary-button" type="button" onClick={enableLiveTracking}>Enable live tracking</button>
              )}
            </section>
            {nextPOI && (
              <POIActionCard
                route={walk.route}
                poiId={nextPOI.id}
                isDiscovered={discoveredPoiIds.includes(nextPOI.id)}
                onAction={(action) => void actOnPOI(nextPOI.id, action)}
                companion
              />
            )}
            <div className="action-grid two companion-bottom-actions">
              <button className="secondary-button" type="button" onClick={() => void updateWalkStatus(walk.status === 'paused' ? 'active' : 'paused')}>
                {walk.status === 'paused' ? <Play /> : <Pause />}
                {walk.status === 'paused' ? 'Resume' : 'Pause'}
              </button>
              <button className="primary-button" type="button" onClick={() => void completeWalk()}>
                <Flag /> Complete
              </button>
            </div>
          </section>
        )}

        {screen === 'complete' && walk && (
          <section className="screen-stack">
            <ScreenTitle title="Walk complete" detail={`${formatNumber(walk.route.estimatedSteps)} estimated steps · ${walk.discoveredPoiIds.length} discoveries`} />
            <section className="complete-panel">
              <Check />
              <strong>{progress?.placesDiscovered ?? walk.discoveredPoiIds.length} places discovered</strong>
              <span>{progress?.loopsCompleted ?? 1} loops completed</span>
            </section>
            <FeedbackPanel
              feedbackLabels={feedbackLabels}
              feedbackNote={feedbackNote}
              onToggle={(label) => setFeedbackLabels((current) => current.includes(label) ? current.filter((item) => item !== label) : [...current, label])}
              onNote={setFeedbackNote}
              onSubmit={() => void submitFeedback()}
            />
            <button className="primary-button full" type="button" onClick={() => setScreen('home')}>Plan another walk</button>
          </section>
        )}

        {screen === 'saved' && (
          <section className="screen-stack">
            <ScreenTitle title="Saved discoveries" detail="Quiet progress, not a game" />
            <section className="quiet-progress tall">
              <div><strong>{progress?.placesDiscovered ?? 0}</strong><span>places discovered</span></div>
              <div><strong>{progress?.loopsCompleted ?? 0}</strong><span>loops completed</span></div>
              <div><strong>{progress?.savedRoutes ?? savedRoutes.length}</strong><span>routes saved</span></div>
            </section>
            <div className="route-list">
              {savedRoutes.length === 0 ? (
                <p className="empty-copy">Saved routes will appear here after you bookmark a loop.</p>
              ) : savedRoutes.map((saved) => (
                <button key={saved.id} className="route-card" type="button" onClick={() => {
                  setRoutes([saved.route]);
                  setSelectedRouteId(saved.routeId);
                  setScreen('detail');
                }}>
                  <h2>{saved.route.label}</h2>
                  <div className="route-facts">
                    <span>{formatNumber(saved.route.estimatedSteps)} steps</span>
                    <span>{saved.route.pois.length} discoveries</span>
                  </div>
                </button>
              ))}
            </div>
            {poiActions.length > 0 && (
              <section className="trust-panel">
                <h2>Recent POI actions</h2>
                {poiActions.slice(0, 3).map((action) => (
                  <p key={action.id}>{action.action}: {action.poi.name}</p>
                ))}
              </section>
            )}
            <PrimaryNav screen={screen} onNavigate={setScreen} />
          </section>
        )}

        {screen === 'history' && (
          <section className="screen-stack">
            <ScreenTitle title="Walk history" detail="Completed loops and saved progress" />
            <section className="quiet-progress tall">
              <div><strong>{progress?.loopsCompleted ?? completedWalks.length}</strong><span>loops completed</span></div>
              <div><strong>{formatNumber(progress?.placesDiscovered ?? 0)}</strong><span>places discovered</span></div>
              <div><strong>{formatNumber(settings.weeklyStepGoal)}</strong><span>weekly step goal</span></div>
            </section>
            <div className="route-list">
              {completedWalks.length === 0 ? (
                <p className="empty-copy">Completed walks will appear here after you finish a loop.</p>
              ) : completedWalks.map((item) => (
                <article key={item.id} className="route-card">
                  <h2>{item.routeLabel}</h2>
                  <div className="route-facts">
                    <span>{formatNumber(item.estimatedSteps)} steps</span>
                    <span>{Math.round(item.elapsedSeconds / 60)} min</span>
                    <span>{item.discoveredCount} discoveries</span>
                  </div>
                </article>
              ))}
            </div>
            <PrimaryNav screen={screen} onNavigate={setScreen} />
          </section>
        )}

        {screen === 'settings' && (
          <section className="screen-stack">
            <ScreenTitle title="Settings" detail="Local-first preferences" />
            <section className="settings-panel">
              <label htmlFor="weekly-step-goal">
                Weekly step goal
                <input
                  id="weekly-step-goal"
                  type="number"
                  min="1000"
                  step="1000"
                  value={settings.weeklyStepGoal || ''}
                  onChange={(event) => updateSettings({ weeklyStepGoal: Number(event.target.value) || 0 })}
                  onBlur={() => {
                    if (settings.weeklyStepGoal < 1000) updateSettings({ weeklyStepGoal: defaultSettings.weeklyStepGoal });
                  }}
                />
              </label>
              <label className="toggle-row" htmlFor="distance-km">
                <input
                  id="distance-km"
                  type="checkbox"
                  checked={settings.distanceUnit === 'km'}
                  onChange={(event) => updateSettings({ distanceUnit: event.target.checked ? 'km' : 'mi' })}
                />
                Use kilometers
              </label>
              <label className="toggle-row" htmlFor="reminders-enabled">
                <input
                  id="reminders-enabled"
                  type="checkbox"
                  checked={settings.remindersEnabled}
                  onChange={(event) => updateSettings({ remindersEnabled: event.target.checked })}
                />
                Daily walk reminder
              </label>
              <label htmlFor="reminder-time">
                Reminder time
                <input
                  id="reminder-time"
                  type="time"
                  value={settings.reminderTime}
                  onChange={(event) => updateSettings({ reminderTime: event.target.value || defaultSettings.reminderTime })}
                />
              </label>
              <label className="toggle-row" htmlFor="reduced-motion">
                <input
                  id="reduced-motion"
                  type="checkbox"
                  checked={settings.reducedMotion}
                  onChange={(event) => updateSettings({ reducedMotion: event.target.checked })}
                />
                Reduce motion
              </label>
              <section className="trust-panel">
                <h2>Privacy</h2>
                <p>Location tracking is local-first. Raw GPS coordinates are not sent when a walk is completed.</p>
              </section>
              <button className="secondary-button full" type="button" onClick={() => updateSettings({ onboardingComplete: false })}>Show onboarding again</button>
            </section>
            <PrimaryNav screen={screen} onNavigate={setScreen} />
          </section>
        )}
      </section>
    </main>
  );
}

function parseTrustRoute(pathname: string, search: string): { type: 'place' | 'live-route'; slug: string } | { type: 'admin-route-qa'; enabled: boolean } | null {
  const placeMatch = pathname.match(/^\/places\/([^/]+)$/);
  if (placeMatch?.[1]) return { type: 'place', slug: decodeURIComponent(placeMatch[1]) };

  const liveRouteMatch = pathname.match(/^\/routes\/([^/]+)\/live$/);
  if (liveRouteMatch?.[1]) return { type: 'live-route', slug: decodeURIComponent(liveRouteMatch[1]) };

  if (pathname === '/admin/route-qa') {
    const enabled = new URLSearchParams(search).get('admin') === '1' || import.meta.env.VITE_ENABLE_ADMIN_QA === 'true';
    return { type: 'admin-route-qa', enabled };
  }

  return null;
}

function ScreenTitle({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="screen-title">
      <h1>{title}</h1>
      <p>{detail}</p>
    </div>
  );
}

function CompanionHeader({ route, gpsActive }: { route: ScoredRoute; gpsActive: boolean }) {
  return (
    <section className="companion-header" aria-labelledby="companion-title">
      <div>
        <h1 id="companion-title">Walk Companion</h1>
        <p>{route.label}</p>
      </div>
      <span className={gpsActive ? 'status-chip active' : 'status-chip'}>
        <MapIcon />
        GPS local
      </span>
    </section>
  );
}

function NextMoveCard({ nextMove }: { nextMove: NextMoveSummary }) {
  return (
    <section className="next-move-card">
      <div className="route-card-top">
        <span>Next move</span>
        <Route />
      </div>
      <h2>{nextMove.title}</h2>
      <p>{nextMove.cue}</p>
      <div className="next-move-facts">
        <span>{nextMove.distanceLabel}</span>
        <span>{nextMove.etaLabel}</span>
      </div>
    </section>
  );
}

function TimeGuardrailCard({ guardrail }: { guardrail: TimeGuardrailSummary }) {
  return (
    <section className="time-guardrail-card">
      <div className="route-card-top">
        <span>Time guardrail</span>
        <Timer />
      </div>
      <h2>{guardrail.title}</h2>
      <div
        className="progress-bar"
        role="progressbar"
        aria-label="Route progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={guardrail.progressPercent}
      >
        <span style={{ width: `${guardrail.progressPercent}%` }} />
      </div>
      <div className="guardrail-facts">
        <span>{guardrail.elapsedLabel}</span>
        <span>{guardrail.remainingTimeLabel}</span>
        <span>{guardrail.remainingDistanceLabel}</span>
      </div>
      <p className="shortcut-warning">{guardrail.warningLabel}</p>
    </section>
  );
}

function BailoutActions({
  options,
  onChoose,
}: {
  options: BailoutOption[];
  onChoose: (optionId: BailoutOption['id']) => void;
}) {
  const icons: Record<BailoutOption['id'], typeof Route> = {
    shortcut: Route,
    return: MapIcon,
    transit: Bus,
  };

  return (
    <section className="bailout-actions" aria-label="Bailout options">
      {options.map((option) => {
        const Icon = icons[option.id];

        return (
          <button
            key={option.id}
            className="bailout-button"
            type="button"
            aria-label={`${option.label} ${option.detail}`}
            onClick={() => onChoose(option.id)}
          >
            <Icon />
            <span>{option.label}</span>
            <small>{option.detail}</small>
          </button>
        );
      })}
    </section>
  );
}

function RecoveryState({ onReset }: { onReset: () => void }) {
  return (
    <section className="recovery-state">
      <Compass />
      <h2>No matching loops yet</h2>
      <p>Try a shorter goal, fewer interests, or a broader Montreal start point.</p>
      <button className="primary-button full" type="button" onClick={onReset}>Adjust walk</button>
    </section>
  );
}

function PrimaryNav({ screen, onNavigate }: { screen: AppScreen; onNavigate: (screen: AppScreen) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <button className={screen === 'home' ? 'active' : ''} type="button" aria-current={screen === 'home' ? 'page' : undefined} onClick={() => onNavigate('home')}><Compass /><span>Explore</span></button>
      <button className={screen === 'history' ? 'active' : ''} type="button" aria-current={screen === 'history' ? 'page' : undefined} onClick={() => onNavigate('history')}><Footprints /><span>History</span></button>
      <button className={screen === 'saved' ? 'active' : ''} type="button" aria-current={screen === 'saved' ? 'page' : undefined} onClick={() => onNavigate('saved')}><Bookmark /><span>Saved</span></button>
      <button className={screen === 'settings' ? 'active' : ''} type="button" aria-current={screen === 'settings' ? 'page' : undefined} onClick={() => onNavigate('settings')}><User /><span>Settings</span></button>
    </nav>
  );
}

function POISequence({ route }: { route: ScoredRoute }) {
  const start = route.geometry[0];

  return (
    <section className="poi-sequence">
      <h2>{route.pois.length} discoveries on this loop</h2>
      {route.pois.slice(0, 5).map((poi, index) => {
        const Icon = categoryIcons[poi.category] ?? MapPin;
        const distanceFromStart = start ? humanDistance(distanceBetweenMeters(start, poi.coordinate)) : 'nearby';

        return (
          <article key={poi.id} className="poi-row">
            <span className="poi-index">{index + 1}</span>
            <Icon />
            <div>
              <strong>{poi.name}</strong>
              <small>{categoryLabel(poi.category)} · {distanceFromStart} · {poiStopTime(poi.category)} stop</small>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function POIActionCard({
  route,
  poiId,
  isDiscovered,
  onAction,
  companion = false,
}: {
  route: ScoredRoute;
  poiId: string;
  isDiscovered: boolean;
  onAction: (action: POIAction) => void;
  companion?: boolean;
}) {
  const poi = route.pois.find((item) => item.id === poiId);
  if (!poi) return null;

  const Icon = categoryIcons[poi.category] ?? MapPin;
  const start = route.geometry[0];
  const distanceFromStart = start ? humanDistance(distanceBetweenMeters(start, poi.coordinate)) : 'nearby';

  return (
    <section className="poi-action-card">
      <div className="route-card-top">
        <span>Next discovery</span>
        <strong>{poiStopTime(poi.category)} stop</strong>
      </div>
      <div className="poi-action-title">
        <Icon />
        <div>
          <h2>{poi.name}</h2>
          <p>{reasonForPOI(poi.category)}</p>
        </div>
      </div>
      <div className="route-facts">
        <span>{categoryLabel(poi.category)}</span>
        <span>{distanceFromStart} from start</span>
      </div>
      <div className={companion ? 'poi-action-buttons companion' : 'action-grid three'}>
        {companion ? (
          <button className="icon-button" type="button" aria-label={`Save ${poi.name}`} onClick={() => onAction('save')}>
            <Bookmark />
          </button>
        ) : (
          <button className="secondary-button" type="button" onClick={() => onAction('save')}>
            <Bookmark /> Save
          </button>
        )}
        <button className="secondary-button" type="button" onClick={() => onAction('skip')}>
          <X /> Skip
        </button>
        <button className="primary-button" type="button" disabled={isDiscovered} onClick={() => onAction('discovered')}>
          <Check /> {isDiscovered ? 'Done' : companion ? 'Worth it' : 'Discovered'}
        </button>
      </div>
    </section>
  );
}

function FeedbackPanel({
  feedbackLabels,
  feedbackNote,
  onToggle,
  onNote,
  onSubmit,
}: {
  feedbackLabels: string[];
  feedbackNote: string;
  onToggle: (label: string) => void;
  onNote: (note: string) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="feedback-panel">
      <h2>Route feedback</h2>
      <div className="chip-row">
        {feedbackOptions.map((option) => (
          <button
            key={option.id}
            className={feedbackLabels.includes(option.id) ? 'interest-chip selected' : 'interest-chip'}
            type="button"
            onClick={() => onToggle(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <label className="feedback-note" htmlFor="feedback-note">
        Note
        <textarea id="feedback-note" value={feedbackNote} onChange={(event) => onNote(event.target.value)} />
      </label>
      <button className="primary-button full" type="button" disabled={feedbackLabels.length === 0} onClick={onSubmit}>
        Save feedback
      </button>
    </section>
  );
}
