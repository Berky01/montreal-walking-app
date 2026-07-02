# Data Model

The app should be route-first, not place-first. Places enrich routes, but routes are the product.

## Core entities

### City

```ts
type City = {
  id: string;
  name: string;
  region?: string;
  country: string;
  locale: string;
  center: Coordinates;
  timezone: string;
  isMvpCity: boolean;
  status: 'draft' | 'active' | 'retired';
};
```

### Place

```ts
type Place = {
  id: string;
  cityId: string;
  name: string;
  category: PlaceCategory;
  coordinates: Coordinates;
  shortDescription: string;
  whyItMatters?: string;
  photoUrl?: string;
  officialUrl?: string;
  openingHoursNote?: string;
  accessibilityNote?: string;
  tags: string[];
  sourceQuality: 'draft' | 'verified' | 'field_tested';
  lastReviewedAt?: string;
};
```

### Route

```ts
type Route = {
  id: string;
  cityId: string;
  title: string;
  slug: string;
  summary: string;
  routeType: RouteType;
  mode: RouteMode;
  tags: string[];
  interests: InterestTag[];
  moodTags: MoodTag[];
  distanceMeters: number;
  estimatedDurationMinutes: number;
  difficulty: 'easy' | 'moderate' | 'hard';
  pace: 'relaxed' | 'balanced' | 'intense';
  loopType: 'loop' | 'one_way' | 'out_and_back';
  start: RouteEndpoint;
  end: RouteEndpoint;
  geometry: GeoJSONLineString;
  stops: RouteStop[];
  elevationGainMeters?: number;
  bestFor: string[];
  knowBeforeYouGo: string[];
  accessibilityNotes?: string[];
  safetyNotes?: string[];
  imageUrl?: string;
  sourceQuality: 'draft' | 'verified' | 'field_tested';
  status: 'draft' | 'published' | 'needs_update' | 'retired';
  lastReviewedAt?: string;
};
```

### RouteStop

```ts
type RouteStop = {
  placeId: string;
  order: number;
  distanceFromStartMeters?: number;
  recommendedStopMinutes?: number;
  note?: string;
};
```

### RouteSession

```ts
type RouteSession = {
  id: string;
  userId?: string;
  routeId: string;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  startedAt: string;
  endedAt?: string;
  elapsedSeconds: number;
  actualDistanceMeters: number;
  progressPercent: number;
  visitedStopIds: string[];
  lastKnownPosition?: Coordinates;
};
```

### SavedRoute

```ts
type SavedRoute = {
  id: string;
  userId?: string;
  routeId: string;
  savedAt: string;
  collectionId?: string;
  note?: string;
};
```

### UserPreferences

```ts
type UserPreferences = {
  units: 'metric' | 'imperial';
  preferredPace?: 'relaxed' | 'balanced' | 'intense';
  preferredDistanceMeters?: number;
  interests: InterestTag[];
  avoidHills?: boolean;
  preferQuietRoutes?: boolean;
  preferCafes?: boolean;
  accessibilityNeeds?: string[];
};
```

## Enumerations

### RouteType

- everyday_walk
- scenic_walk
- city_discovery
- cultural_route
- heritage_route
- food_cafe_route
- architecture_route
- nature_route
- weekend_route
- road_trip
- pilgrimage_stage

### PlaceCategory

- monument
- historic_building
- church
- museum
- viewpoint
- park
- cafe
- restaurant
- mural
- street
- square
- bridge
- village
- castle
- ruins
- unesco_site
- pilgrimage_stop
- hidden_gem

### InterestTag

- history
- architecture
- nature
- churches
- villages
- viewpoints
- food
- cafes
- museums
- murals
- old_streets
- rivers_canals
- parks
- ruins
- castles
- unesco
- pilgrimage
- photography

## Quality rule

Every published route must have:

- valid geometry
- start and end points
- at least 2 stops unless it is a pure scenic loop
- distance and duration
- tags/interests
- route type
- source quality
- last reviewed date
- at least one practical note or “know before you go” item
