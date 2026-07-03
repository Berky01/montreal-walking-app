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

export type Tag = {
  id: string;
  label: string;
  category: "interest" | "mood" | "place_type" | "practical" | "area";
};

export type VerificationStatus = "placeholder" | "needs_review" | "verified";

export type SourceQualityScore = "draft" | "verified" | "field_tested";

export type MediaApprovalStatus = "approved" | "needs_review" | "rejected" | "fallback_only" | "placeholder" | "ready";

export type ThenNowMediaRole = "then" | "now" | "historical" | "archival";

export type SourceAttribution = {
  sourceUrl?: string;
  creator?: string;
  title?: string;
  attributionText?: string;
  licenseName?: string;
  licenseUrl?: string;
  accessedAt?: string;
};

export type Source = {
  id: string;
  label: string;
  type: "official" | "open_data" | "editorial" | "field_note" | "placeholder";
  url?: string;
  accessedAt?: string;
  notes?: string;
  status: VerificationStatus;
  verificationStatus?: VerificationStatus;
  attribution?: SourceAttribution;
  lastReviewedAt?: string;
};

export type PlaceSource = Source;

export type ContentSource =
  | "owned_internal"
  | "openstreetmap"
  | "wikimedia_commons"
  | "wikidata"
  | "openverse"
  | "public_domain_archive"
  | "montreal_open_data"
  | "quebec_heritage"
  | "official_reference"
  | "generated_local";

export type MediaLicense = {
  name: string;
  url?: string;
  allowsCommercialUse: boolean;
  requiresAttribution: boolean;
  requiresShareAlike: boolean;
};

export type MediaAsset = {
  id: string;
  alt: string;
  type: "image" | "video" | "audio" | "generated";
  role?: "hero" | "card" | "gallery" | "map" | "thumbnail" | "fallback";
  localPath?: string;
  url?: string;
  originalUrl?: string;
  sourceUrl?: string;
  sourceType?: ContentSource;
  provider?: string;
  creator?: string;
  title?: string;
  attributionText?: string;
  licenseName?: string;
  licenseUrl?: string;
  licenseAllowsCommercialUse?: boolean;
  licenseRequiresAttribution?: boolean;
  licenseRequiresShareAlike?: boolean;
  width?: number;
  height?: number;
  dominantColor?: string;
  placeId?: string;
  routeId?: string;
  neighborhoodId?: string;
  importedAt?: string;
  lastCheckedAt?: string;
  confidence?: "verified" | "likely" | "needs_review";
  credit?: string;
  source?: string;
  status: MediaApprovalStatus;
  approvalStatus?: MediaApprovalStatus;
  thenNowRole?: ThenNowMediaRole;
  historicalRole?: ThenNowMediaRole;
  historicalContext?: string;
  attribution?: SourceAttribution;
};

export type PlaceMedia = MediaAsset;

export type ContentStatus = "draft" | "needs_review" | "ready" | "published" | "archived";

export type GeoJsonLineString = {
  type: "LineString";
  coordinates: Array<[number, number]>;
};

export type GeoJsonPoint = {
  type: "Point";
  coordinates: [number, number];
};

export type GeoJsonGeometry = GeoJsonLineString | GeoJsonPoint;

export type GeoJsonProperty = string | number | boolean | null | string[];

export type GeoJsonFeature<Geometry extends GeoJsonGeometry = GeoJsonLineString> = {
  type: "Feature";
  geometry: Geometry;
  properties: Record<string, GeoJsonProperty>;
};

export type GeoJsonFeatureCollection<Geometry extends GeoJsonGeometry = GeoJsonGeometry> = {
  type: "FeatureCollection";
  features: Array<GeoJsonFeature<Geometry>>;
};

export type RouteGeometry = {
  type: "LineString";
  coordinates: Coordinates[];
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
  externalRefs?: PlaceExternalRefs;
  discovery?: PlaceDiscoveryMeta;
  media: PlaceMedia[];
  contentStatus: ContentStatus;
  accessibilityNotes: AccessibilityNote[];
  safetyNotes: SafetyNote[];
  lastReviewedAt: string;
};

export type PlaceDiscoveryMeta = {
  source: ContentSource | "openstreetmap";
  sourceId: string;
  rating?: number;
  popularity?: number;
  localInterestScore?: number;
  address?: string;
  openingHours?: string;
  website?: string;
  imageUrl?: string;
  score?: number;
  cachedAt?: string;
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
  externalRefs?: RouteExternalRefs;
  media: MediaAsset[];
  contentStatus: ContentStatus;
  sourceQuality: SourceQualityScore;
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
  difficulty?: Route["difficulty"];
  routeShape?: Route["routeType"];
  needsAccessibleRoute: boolean;
  weatherIntent?: "rainy_day";
  wantsCafeOrFood: boolean;
  wantsScenicViewpoints: boolean;
  explanationChips: string[];
};

export type RouteSearchResult = {
  route: Route;
  score: number;
  matchReasons: string[];
  intent: SearchIntent;
};

export type SavedItem = {
  id: string;
  itemType: "route" | "place";
  itemId: string;
  itemSlug: string;
  itemTitle: string;
  savedAt: string;
  collectionName?: string;
  note?: string;
};

export type UserSavedItem = SavedItem;

export type WalkSession = {
  id: string;
  routeId: string;
  routeSlug: string;
  routeTitle: string;
  status: "active" | "paused" | "completed" | "abandoned";
  startedAt: string;
  endedAt: string | null;
  pausedAt: string | null;
  totalPausedMs: number;
  currentStopIndex: number;
  visitedStopIds: string[];
  skippedStopIds: string[];
  progressPercent: number;
  elapsedMin: number;
  actualDistanceKm: number;
  currentStopId?: string;
  nextStopId?: string;
};

export type RouteSession = WalkSession;

export type CompletedWalk = WalkSession;

export type Neighborhood = {
  id: string;
  slug: string;
  cityId: string;
  name: string;
  summary: string;
  tags: string[];
  center: Coordinates;
  routeSlugs: string[];
  placeSlugs: string[];
  contentStatus: ContentStatus;
};

export type DataImportSource = {
  id: string;
  provider: ContentSource;
  mode: "manual" | "batch" | "runtime";
  sourceUrl?: string;
  licenseRisk: "low" | "medium" | "high";
  notes?: string;
};

export type DataImportRun = {
  id: string;
  sourceId: string;
  provider: ContentSource;
  startedAt: string;
  finishedAt?: string;
  status: "success" | "partial" | "failed";
  importedCount: number;
  rejectedCount: number;
  notes?: string[];
};

export type ExternalProviderConfig = {
  provider: ContentSource | "maplibre" | "stadia" | "maptiler" | "google_places" | "supabase" | "posthog" | "sentry" | "resend" | "stripe" | "paddle" | "ai";
  mode: "manual" | "batch" | "runtime" | "deferred";
  priority: "now" | "next" | "later" | "deferred";
  requiresApiKey: boolean;
  noKeyFallback: string;
};

export type PlaceExternalRefs = {
  wikidataQid?: string;
  wikimediaCommonsFile?: string;
  commonsCategory?: string;
  osmType?: "node" | "way" | "relation";
  osmId?: string;
  googlePlaceId?: string;
  montrealDatasetId?: string;
  montrealResourceId?: string;
  officialWebsiteUrl?: string;
};

export type RouteExternalRefs = {
  wikidataQid?: string;
  wikimediaCommonsFile?: string;
  commonsCategory?: string;
  osmType?: "node" | "way" | "relation";
  osmId?: string;
  googlePlaceId?: string;
  montrealDatasetId?: string;
  montrealResourceId?: string;
  officialWebsiteUrl?: string;
};

export type MediaCoverageReport = {
  totalMediaAssets: number;
  approvedRealPhotos: number;
  generatedFallbacks: number;
  rejectedOrNeedsReview: number;
  missingRouteHeroPhotos: string[];
  missingRouteCardPhotos: string[];
  missingPlaceHeroPhotos: string[];
  missingPlaceCardPhotos: string[];
  routePhotoCoverage: {
    total: number;
    covered: number;
    percent: number;
  };
  placePhotoCoverage: {
    total: number;
    covered: number;
    percent: number;
  };
};

export type CityPack = {
  id: string;
  slug: string;
  cityId: string;
  title: string;
  summary: string;
  routeSlugs: string[];
  placeSlugs: string[];
  status: "flagged" | "draft" | "ready";
};

export type PartnerKit = {
  id: string;
  slug: string;
  cityId: string;
  partnerName: string;
  title: string;
  summary: string;
  routeSlugs: string[];
  status: "flagged" | "draft" | "ready";
};

export type IssueReport = {
  id: string;
  routeId?: string;
  routeSlug?: string;
  placeId?: string;
  placeSlug?: string;
  stopId?: string;
  category:
    | "closed"
    | "construction"
    | "safety"
    | "accessibility"
    | "incorrect_information"
    | "place_info_wrong"
    | "photo_source_issue"
    | "opening_access_changed"
    | "accessibility_detail_wrong"
    | "construction_nearby"
    | "duplicate_place"
    | "suggest_place_nearby"
    | "other";
  severity?: "low" | "medium" | "high";
  description: string;
  createdAt: string;
  updatedAt?: string;
  status: "new" | "reviewing" | "resolved" | "dismissed";
  reviewer?: string;
  resolutionNotes?: string;
};

export type RouteQaStatus = {
  content: "draft" | "ready" | "needs_review";
  geometry: "missing" | "rough" | "ready";
  fieldCheck: "not_started" | "scheduled" | "complete";
  accessibility: "missing" | "partial" | "ready";
  sources: "missing" | "partial" | "ready";
  overall: "draft" | "review" | "published";
  score: number;
};

export type QaRouteStatus = RouteQaStatus;

export type UserPreferences = {
  units: "metric" | "imperial";
  preferredPace: "relaxed" | "balanced" | "brisk";
  preferredDurationMin?: number;
  interests: string[];
  preferQuietRoutes: boolean;
  preferCafes: boolean;
  preferIndoorRainyDay: boolean;
  avoidStairs: boolean;
  accessibilityNeeds: string[];
  locationPermissionStatus?: "unknown" | "granted" | "denied" | "manual";
  alertPreferences?: {
    routeChanges: boolean;
    accessibility: boolean;
    weather: boolean;
  };
};

export type RouteFilters = {
  cityId?: string;
  durationMaxMin?: number;
  interest?: string;
  area?: string;
  difficulty?: Route["difficulty"];
  contentStatus?: ContentStatus;
};

export type PlaceFilters = {
  cityId?: string;
  category?: Place["category"] | "all";
  area?: string;
  tag?: string;
  contentStatus?: ContentStatus;
};

export type NearbyPlacesInput = {
  coordinates: Coordinates;
  radiusKm?: number;
  limit?: number;
};

export type IssueReportInput = {
  routeSlug?: string;
  placeSlug?: string;
  stopId?: string;
  category: IssueReport["category"];
  severity?: IssueReport["severity"];
  description: string;
};

export type IssueReportTriageInput = {
  id: string;
  status: IssueReport["status"];
  severity?: IssueReport["severity"];
  reviewer?: string;
  resolutionNotes?: string;
};

export type DataProvider = {
  getCities(): City[];
  getNeighborhoods(): Neighborhood[];
  getCityPacks(): CityPack[];
  getPartnerKits(): PartnerKit[];
  getFeaturedRoutes(): Route[];
  getRoutes(filters?: RouteFilters): Route[];
  getRouteBySlug(slug: string): Route | undefined;
  getRouteGeoJson(slug: string): GeoJsonFeature | undefined;
  getPlaces(filters?: PlaceFilters): Place[];
  getPlaceBySlug(slug: string): Place | undefined;
  getNearbyPlaces(input: NearbyPlacesInput): Place[];
  searchRoutes(intent: string): RouteSearchResult[];
  createIssueReport(input: IssueReportInput): IssueReport;
  updateIssueReport(input: IssueReportTriageInput): IssueReport | undefined;
  getIssueReports(): IssueReport[];
  getSavedLibrary(): SavedItem[];
  getWalkHistory(): WalkSession[];
};
