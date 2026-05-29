import type {
  CompletedWalkSummary,
  FeedbackRecord,
  GeocodedPlace,
  POIAction,
  POIActionRecord,
  ProgressSummary,
  RouteSummary,
  SavedRouteRecord,
  ScoredRoute,
  WalkSessionRecord,
} from '@walking-app/shared';
import type { Interest, Mood } from '@walking-app/shared';
import { Platform } from 'react-native';

export interface ProviderHealth {
  ok?: boolean;
  liveReady?: boolean;
  missingLiveProviders?: string[];
}

export interface ClientConfig {
  city?: string;
  map?: { provider?: string; mapTilerKey?: string };
  ops?: { enabled?: boolean };
}

export interface RouteGenerateRequest {
  cityId: 'montreal';
  start: GeocodedPlace;
  stepGoal: number;
  timeGoalMinutes: number;
  mood: Mood;
  interests: Interest[];
  routeType: 'loop';
}

export interface RouteGenerateResponse {
  requestId: string;
  topRoutes: RouteSummary[];
  remainingRoutes: RouteSummary[];
  fallback?: string | null;
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

function defaultDevApiBaseUrl(platform: typeof Platform.OS) {
  if (platform === 'android') return 'http://10.0.2.2:5174';
  return 'http://127.0.0.1:5174';
}

export function resolveApiBaseUrl(
  value = process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
  platform = Platform.OS,
) {
  const trimmed = value.trim().replace(/\/$/, '');
  if (trimmed) return trimmed;

  if (__DEV__) return defaultDevApiBaseUrl(platform);

  throw new Error('Set EXPO_PUBLIC_API_BASE_URL to your reachable API URL, for example http://192.168.1.8:5174.');
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let body: unknown = {};

  if (text.trim()) {
    try {
      body = JSON.parse(text);
    } catch {
      if (!response.ok) throw new Error(text);
      throw new Error('The walking service returned an unreadable response.');
    }
  }

  if (!response.ok) {
    const errorBody = body as { error?: string; action?: string; fallback?: string; message?: string };
    const message = [errorBody.error ?? errorBody.message, errorBody.action, errorBody.fallback]
      .filter(Boolean)
      .join(' ');
    throw new Error(message || `Request failed with status ${response.status}.`);
  }

  return body as T;
}

export function createApiClient(baseUrl = resolveApiBaseUrl()) {
  async function request<T>(path: string, options?: RequestOptions) {
    const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const init: RequestInit | undefined = options
      ? {
          ...options,
          headers: options.body
            ? { 'content-type': 'application/json', ...(options.headers ?? {}) }
            : options.headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
        }
      : undefined;

    return parseJsonResponse<T>(await fetch(url, init));
  }

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
    patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
    health: () => request<ProviderHealth>('/api/health/providers'),
    clientConfig: () => request<ClientConfig>('/api/client-config'),
    progress: () => request<{ progress: ProgressSummary | null }>('/api/progress?city=montreal'),
    savedRoutes: () => request<{ savedRoutes: SavedRouteRecord[] }>('/api/routes/saved'),
    completedWalks: () => request<{ walks: CompletedWalkSummary[] }>('/api/walks?city=montreal&status=completed'),
    geocode: (query: string) => request<{ places: GeocodedPlace[]; provider: string }>(
      `/api/geocode?city=montreal&query=${encodeURIComponent(query)}`,
    ),
    generateRoutes: (body: RouteGenerateRequest) => request<RouteGenerateResponse>('/api/routes/generate', {
      method: 'POST',
      body,
    }),
    route: (routeId: string) => request<{ route: ScoredRoute }>(`/api/routes/${encodeURIComponent(routeId)}`),
    saveRoute: (routeId: string) => request<{ savedRoute: SavedRouteRecord }>(
      `/api/routes/${encodeURIComponent(routeId)}/save`,
      { method: 'POST' },
    ),
    startWalk: (routeId: string) => request<{ walk: WalkSessionRecord }>(
      `/api/walks/${encodeURIComponent(routeId)}/start`,
      { method: 'POST' },
    ),
    updateWalk: (walkId: string, body: Partial<Pick<WalkSessionRecord, 'status' | 'elapsedSeconds' | 'estimatedSteps' | 'discoveredPoiIds'>>) =>
      request<{ walk: WalkSessionRecord }>(`/api/walks/${encodeURIComponent(walkId)}`, { method: 'PATCH', body }),
    completeWalk: (walkId: string, body: { elapsedSeconds: number; estimatedSteps: number; discoveredPoiIds: string[] }) =>
      request<{ walk: WalkSessionRecord; progress: ProgressSummary }>(
        `/api/walks/${encodeURIComponent(walkId)}/complete`,
        { method: 'POST', body },
      ),
    actOnPoi: (walkId: string, poiId: string, action: POIAction) =>
      request<{ poiAction: POIActionRecord; walk: WalkSessionRecord }>(
        `/api/walks/${encodeURIComponent(walkId)}/pois/${encodeURIComponent(poiId)}`,
        { method: 'POST', body: { action } },
      ),
    feedback: (routeId: string, labels: string[], note?: string) =>
      request<{ saved: boolean; feedback: FeedbackRecord }>(
        `/api/routes/${encodeURIComponent(routeId)}/feedback`,
        { method: 'POST', body: { labels, note } },
      ),
  };
}

export type WalkingApiClient = ReturnType<typeof createApiClient>;
