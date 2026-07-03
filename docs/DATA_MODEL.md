# Data Model

These models define the TypeScript-facing shape for the Montreal MVP. The source of truth now lives in `lib/data/types.ts`; this document summarizes the route-first model.

Release 2 keeps the catalog local-first and typed: at least 28 Montreal-region routes, at least 140 Montreal-region places, valid place coordinates, route LineString geometry, stop-to-place references, and geometry that passes through each route stop coordinate. Public data access is filtered through `lib/data/public-content.ts`: `getRoutes()`, `getPlaces()`, public detail lookups, search, and public GeoJSON return only public-ready curated records, while admin and validation tooling use `getAllRoutes()` and `getAllPlaces()` for the full internal catalog. Browser-local state is versioned under `meaningful-routes:v1:*`; compare baskets normalize to four unique route slugs, and saved-item writes report storage failure instead of showing false saved state.

Expanded discovery places may include a `discovery` object with provider/source ID, rating, popularity, local-interest score, address, opening hours, website, image URL, cache timestamp, and ranking score. In Postgres mode this remains compatible with the existing flexible `places.body` JSON column until provider-backed persistence is wired.

The enriched POI trust UI derives its summaries from `Place.sources`, `Place.sourceQuality`, optional `Place.sourceQualityScore`, `Place.lastReviewedAt`, and `PlaceMedia` license/source metadata through `src/lib/content-trust.ts`. `lib/content-trust.ts` remains a compatibility re-export for existing app imports. Historical then-now comparison supports optional archival media when an approved media record is attached, but it renders an explicit missing-archival state instead of requiring or fabricating historical assets.

Source/trust records use explicit aliases so audit tools can inspect the data model without inferring from generic fields:

```ts
export type VerificationStatus = "placeholder" | "needs_review" | "verified";
export type SourceQualityScore = "draft" | "verified" | "field_tested";
export type MediaApprovalStatus = "approved" | "needs_review" | "rejected" | "fallback_only" | "placeholder" | "ready";
export type ThenNowMediaRole = "then" | "now" | "historical" | "archival";

export type Source = {
  status: VerificationStatus;
  verificationStatus?: VerificationStatus;
  attribution?: SourceAttribution;
  lastReviewedAt?: string;
};

export type PlaceSource = Source;

export type MediaAsset = {
  status: MediaApprovalStatus;
  approvalStatus?: MediaApprovalStatus;
  thenNowRole?: ThenNowMediaRole;
  historicalRole?: ThenNowMediaRole;
  historicalContext?: string;
  attribution?: SourceAttribution;
};

export type PlaceMedia = MediaAsset;
```

```ts
export type City = {
  id: string;
  slug: string;
  name: string;
  region: string;
  country: string;
  locale: string;
  timezone: string;
  center: Coordinates;
  isMvpCity: boolean;
  status: "draft" | "active" | "retired";
};

export type Coordinates = {
  lat: number;
  lng: number;
};

export type Place = {
  id: string;
  slug: string;
  cityId: string;
  name: string;
  category:
    | "monument"
    | "architecture"
    | "historic_building"
    | "heritage_building"
    | "church"
    | "museum"
    | "viewpoint"
    | "park"
    | "cafe"
    | "cafe_adjacent_stop"
    | "market"
    | "square"
    | "public_square"
    | "street"
    | "waterfront"
    | "public_art"
    | "campus"
    | "hidden_gem"
    | "attraction"
    | "restaurant"
    | "bar"
    | "nightlife"
    | "shopping"
    | "music_venue"
    | "art_culture"
    | "outdoor_activity"
    | "family_activity";
  area: string;
  coordinates: Coordinates;
  shortDescription: string;
  story: string;
  whyItMatters: string;
  whatToNotice: string[];
  practicalInfo: string[];
  periodOrStyle?: string;
  tags: string[];
  relatedRouteSlugs: string[];
  sourceQuality: SourceQualityScore;
  sourceQualityScore?: SourceQualityScore;
  sources: PlaceSource[];
  media: PlaceMedia[];
  discovery?: PlaceDiscoveryMeta;
  lastReviewedAt: string;
};

export type Route = {
  id: string;
  slug: string;
  cityId: string;
  title: string;
  description: string;
  story: string;
  area: string;
  distanceKm: number;
  durationMin: number;
  difficulty: "easy" | "moderate" | "hard";
  routeType: "loop" | "one_way" | "out_and_back";
  pace: "relaxed" | "balanced" | "brisk";
  tags: string[];
  interests: string[];
  moodTags: string[];
  bestTime: string;
  bestFor: string[];
  whyThisRoute: string[];
  startPlaceId: string;
  endPlaceId: string;
  stops: RouteStop[];
  metrics: RouteMetric[];
  accessibilityNotes: AccessibilityNote[];
  safetyNotes: SafetyNote[];
  coordinates: Coordinates;
  geometry: RouteGeometry;
  sources: Source[];
  media: MediaAsset[];
  contentStatus: ContentStatus;
  sourceQuality: "draft" | "verified" | "field_tested";
  qaStatus: RouteQaStatus;
  qaScore: number;
  lastReviewedAt: string;
};

export type RouteStop = {
  id: string;
  placeId: string;
  order: number;
  title: string;
  description: string;
  distanceFromStartKm: number;
  recommendedStopMin: number;
  coordinates: Coordinates;
};

export type RouteMetric = {
  label: string;
  value: string;
  helper?: string;
};

export type AccessibilityNote = {
  id: string;
  label: string;
  description: string;
  severity: "info" | "caution" | "barrier";
};

export type SafetyNote = {
  id: string;
  label: string;
  description: string;
  severity: "info" | "caution" | "important";
};

export type SearchIntent = {
  rawQuery: string;
  durationMaxMin?: number;
  interests: string[];
  moods: string[];
  areaHints: string[];
  needsAccessibleRoute: boolean;
  explanationChips: string[];
};

export type RouteSearchResult = {
  route: Route;
  score: number;
  matchReasons: string[];
  intent: SearchIntent;
};

export type UserSavedItem = {
  id: string;
  itemType: "route" | "place";
  itemId: string;
  savedAt: string;
  collectionName?: string;
  note?: string;
};

export type CompareBasket = string[];

export type WalkSession = {
  id: string;
  routeId: string;
  status: "active" | "paused" | "completed" | "abandoned";
  startedAt: string;
  endedAt?: string;
  elapsedMin: number;
  actualDistanceKm: number;
  progressPercent: number;
  visitedStopIds: string[];
  currentStopId?: string;
  nextStopId?: string;
};

export type IssueReport = {
  id: string;
  routeId?: string;
  placeId?: string;
  category:
    | "closed"
    | "construction"
    | "safety"
    | "accessibility"
    | "incorrect_information"
    | "other";
  description: string;
  createdAt: string;
  status: "new" | "reviewing" | "resolved" | "dismissed";
};

export type QaRouteStatus = {
  content: "draft" | "ready" | "needs_review";
  geometry: "missing" | "rough" | "ready";
  fieldCheck: "not_started" | "scheduled" | "complete";
  accessibility: "missing" | "partial" | "ready";
  overall: "draft" | "review" | "published";
};

export type UserPreferences = {
  units: "metric" | "imperial";
  preferredPace: "relaxed" | "balanced" | "brisk";
  preferredDurationMin?: number;
  interests: string[];
  preferQuietRoutes: boolean;
  preferCafes: boolean;
  avoidStairs: boolean;
  accessibilityNeeds: string[];
};
```

## MVP Data Requirements

- 1 active city: Montreal.
- 60 places/monuments.
- 12 complete routes.
- Each route has metrics, stop timeline, LineString geometry, safety notes, accessibility notes, source placeholders, content status, QA score, and transparent QA status.
- All first-pass content uses Montreal-specific names and context.
- Browser-local state includes saved items, compare basket route slugs, active route sessions, completed walk history, preferences, and feature flags. Public issue reports post to the mock provider's configured server-side review store and the client keeps a browser-local fallback copy when storage is available.

## Release 2 Functional State

- Active walk sessions store route slug/title, pause state, current stop index, current/next stop ids, visited/skipped stop ids, progress, elapsed minutes, and walked distance.
- Completed walks reuse the session shape with `status="completed"` and are persisted in localStorage history.
- Map marker models are derived from routes/places at render time and cover route markers, place markers, numbered stop markers, selected state, and live current/next/visited state.
- Preferences remain browser-local; units and pace affect visible metrics, while interests/accessibility preferences bias recommended route ordering.
