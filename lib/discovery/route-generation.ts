import { toRouteGeometry } from "@/lib/data/geojson";
import type { AccessibilityNote, Coordinates, Place, QaRouteStatus, Route, RouteMetric, SafetyNote, Source } from "@/lib/data/types";
import { createGeneratedFallbackMedia } from "@/lib/media/media-manifest";
import { distanceKm } from "@/lib/discovery/poi-ranking";
import type { DiscoveryConfig } from "@/lib/discovery/types";

type GeneratedRoutePlan = {
  id: string;
  title: string;
  description: string;
  story: string;
  area: string;
  categories?: Place["category"][];
  tagsAny?: string[];
  preferredAreas?: string[];
  difficulty: Route["difficulty"];
  routeType: Route["routeType"];
  pace: Route["pace"];
  tags: string[];
  interests: string[];
  moodTags: string[];
  bestTime: string;
  bestFor: string[];
  whyThisRoute: string[];
};

const generatedSource: Source = {
  id: "source-generated-discovery-routes",
  label: "Meaningful Routes generated discovery routes",
  type: "placeholder",
  accessedAt: "2026-07-01",
  notes: "Generated from expanded Montreal-region POI clusters. Review geometry and field conditions before publishing as field-tested.",
  status: "needs_review"
};

const generatedQaStatus: QaRouteStatus = {
  content: "ready",
  geometry: "rough",
  fieldCheck: "not_started",
  accessibility: "partial",
  sources: "partial",
  overall: "review",
  score: 72
};

const defaultAccessibilityNotes: AccessibilityNote[] = [
  {
    id: "generated-route-access-review",
    label: "Generated accessibility review needed",
    description: "This route is generated from POI clusters; verify step-free paths, surfaces, and transit access before field-ready publication.",
    severity: "caution"
  }
];

const defaultSafetyNotes: SafetyNote[] = [
  {
    id: "generated-route-safety-review",
    label: "Review current conditions",
    description: "Generated routes should be checked for construction, closures, crossings, and seasonal access before field use.",
    severity: "caution"
  }
];

const themedPlans: GeneratedRoutePlan[] = [
  {
    id: "classic-montreal-highlights",
    title: "Classic Montreal Regional Highlights",
    description: "A broad first-pass route that connects high-interest Montreal-region landmarks and cultural anchors.",
    story: "This generated route broadens classic discovery beyond the original central MVP cluster while keeping the stops close enough to compare and refine later.",
    area: "Montreal Island",
    preferredAreas: ["Montreal Island", "Old Montreal", "Plateau and Mile End"],
    categories: ["attraction", "historic_building", "heritage_building", "museum", "park", "viewpoint"],
    difficulty: "easy",
    routeType: "one_way",
    pace: "balanced",
    tags: ["classic highlights", "history", "architecture", "regional discovery"],
    interests: ["history", "architecture", "museums", "parks"],
    moodTags: ["historical", "scenic"],
    bestTime: "Late morning",
    bestFor: ["First-time visitors", "Regional overview"],
    whyThisRoute: ["It gives the expanded catalog a classic starting point.", "It mixes cultural, historic, and outdoor anchors."]
  },
  {
    id: "rainy-day-indoor-route",
    title: "Rainy-Day Indoor Discovery Route",
    description: "A generated route built from museums, cafes, markets, shopping, and culture stops.",
    story: "Rain can make an outdoor-first app feel thin. This route keeps discovery useful with indoor-adjacent places and shorter transitions.",
    area: "Montreal Island",
    preferredAreas: ["Montreal Island", "Old Montreal", "Plateau and Mile End"],
    categories: ["museum", "cafe", "shopping", "art_culture", "restaurant"],
    tagsAny: ["rainy day", "museums", "cafes", "shopping"],
    difficulty: "easy",
    routeType: "one_way",
    pace: "relaxed",
    tags: ["rainy day", "museums", "cafes", "shopping"],
    interests: ["museums", "cafes", "shopping"],
    moodTags: ["rainy day", "quiet"],
    bestTime: "Any wet afternoon",
    bestFor: ["Rainy-day planning", "Indoor-adjacent discovery"],
    whyThisRoute: ["It keeps routes useful in bad weather.", "It mixes cultural stops with practical breaks."]
  },
  {
    id: "nightlife-music-route",
    title: "Nightlife and Music Route",
    description: "A generated evening route through music, nightlife, bars, restaurants, and culture stops.",
    story: "The expanded POI catalog includes after-dark categories so Montreal discovery does not end with daytime landmarks.",
    area: "Plateau and Mile End",
    preferredAreas: ["Plateau and Mile End", "Montreal Island", "Old Montreal"],
    categories: ["music_venue", "nightlife", "bar", "restaurant", "art_culture"],
    tagsAny: ["nightlife", "music venues", "bars", "date-night"],
    difficulty: "easy",
    routeType: "one_way",
    pace: "relaxed",
    tags: ["nightlife", "music venues", "bars", "date-night"],
    interests: ["nightlife", "music venues", "restaurants"],
    moodTags: ["date-night", "scenic"],
    bestTime: "Early evening",
    bestFor: ["Evening discovery", "Music and food"],
    whyThisRoute: ["It uses nightlife and music POIs instead of forcing every route into daytime sightseeing.", "It stays review-ready without adding ticketing or marketplace features."]
  },
  {
    id: "family-parks-route",
    title: "Family-Friendly Parks Route",
    description: "A generated route around parks, family activity stops, outdoor places, and easy public-space anchors.",
    story: "Families need routes that are flexible, forgiving, and not overly long. This route is generated from lower-friction outdoor stops.",
    area: "Laval",
    preferredAreas: ["Laval", "South Shore", "Longueuil"],
    categories: ["family_activity", "park", "outdoor_activity", "market"],
    tagsAny: ["family-friendly", "parks", "outdoor activities"],
    difficulty: "easy",
    routeType: "loop",
    pace: "relaxed",
    tags: ["family-friendly", "parks", "outdoor activities", "budget/free"],
    interests: ["nature", "parks", "family-friendly"],
    moodTags: ["family-friendly", "quiet"],
    bestTime: "Weekend morning",
    bestFor: ["Families", "Low-pressure outdoor discovery"],
    whyThisRoute: ["It increases family coverage outside downtown.", "The selected stops are flexible and easy to shorten."]
  },
  {
    id: "bike-friendly-waterfront-route",
    title: "Bike-Friendly Waterfront Route",
    description: "A generated route for waterfront, park, and outdoor activity POIs with bike-friendly intent.",
    story: "Where the existing app supports route objects but not a dedicated bike mode, this route carries bike-friendly metadata for future routing integration.",
    area: "Boucherville",
    preferredAreas: ["Boucherville", "Longueuil", "South Shore"],
    categories: ["outdoor_activity", "park", "waterfront", "viewpoint"],
    tagsAny: ["bike-friendly", "waterfront", "parks"],
    difficulty: "moderate",
    routeType: "out_and_back",
    pace: "balanced",
    tags: ["bike-friendly", "waterfront", "parks", "scenic"],
    interests: ["waterfront", "nature", "scenic"],
    moodTags: ["scenic", "family-friendly"],
    bestTime: "Clear afternoon",
    bestFor: ["Bike-friendly planning", "Waterfront views"],
    whyThisRoute: ["It marks bike-friendly discovery without introducing a new route mode.", "It prioritizes parks and waterfront POIs."]
  },
  {
    id: "date-night-culture-route",
    title: "Date-Night Culture Route",
    description: "A generated route for cafes, restaurants, views, and cultural stops.",
    story: "This route combines food, atmosphere, and cultural anchors so date-night searches have more than one central demo answer.",
    area: "Old Montreal",
    preferredAreas: ["Old Montreal", "Plateau and Mile End", "Montreal Island"],
    categories: ["cafe", "restaurant", "bar", "viewpoint", "art_culture", "music_venue"],
    tagsAny: ["date-night", "cafes", "restaurants", "music venues"],
    difficulty: "easy",
    routeType: "one_way",
    pace: "relaxed",
    tags: ["date-night", "cafes", "restaurants", "scenic"],
    interests: ["cafes", "restaurants", "music venues"],
    moodTags: ["date-night", "romantic", "scenic"],
    bestTime: "Golden hour into evening",
    bestFor: ["Date night", "Food and culture"],
    whyThisRoute: ["It adds a specific date-night option to the route catalog.", "It mixes practical food stops with scenery and culture."]
  },
  {
    id: "day-trip-route",
    title: "Montreal Region Day-Trip Route",
    description: "A generated day-trip route built from nearby suburb and regional discovery stops.",
    story: "Day-trip coverage helps the catalog represent the region around Montreal without turning the app into a road-trip product.",
    area: "North Shore",
    preferredAreas: ["North Shore", "Oka", "Terrebonne"],
    categories: ["attraction", "park", "outdoor_activity", "heritage_building", "market"],
    tagsAny: ["day-trip", "parks", "history", "outdoor activities"],
    difficulty: "moderate",
    routeType: "one_way",
    pace: "balanced",
    tags: ["day-trip", "parks", "history", "regional discovery"],
    interests: ["history", "nature", "parks"],
    moodTags: ["scenic", "family-friendly"],
    bestTime: "Late morning to afternoon",
    bestFor: ["Regional day trips", "Suburban discovery"],
    whyThisRoute: ["It expands discovery beyond the island.", "It remains a route object with clear integration points for real driving or transit routing later."]
  }
];

export function generateDiscoveryRoutes({
  places,
  config,
  existingRouteSlugs = new Set<string>()
}: {
  places: Place[];
  config: DiscoveryConfig;
  existingRouteSlugs?: Set<string>;
}): Route[] {
  if (!config.routeGenerationEnabled) {
    return [];
  }

  const generated: Route[] = [];

  for (const area of config.coverageAreas) {
    const areaPlaces = selectRoutePlaces({
      places,
      config,
      plan: createAreaPlan(area.label, area.regionType === "day_trip"),
      areaLabel: area.label
    });
    const route = createGeneratedRoute(createAreaPlan(area.label, area.regionType === "day_trip"), areaPlaces, config);
    if (route && !existingRouteSlugs.has(route.slug)) {
      generated.push(route);
      existingRouteSlugs.add(route.slug);
    }
  }

  for (const plan of themedPlans) {
    const route = createGeneratedRoute(plan, selectRoutePlaces({ places, config, plan }), config);
    if (route && !existingRouteSlugs.has(route.slug)) {
      generated.push(route);
      existingRouteSlugs.add(route.slug);
    }
  }

  return generated.slice(0, config.routesShownInDiscovery);
}

function createAreaPlan(areaLabel: string, isDayTrip: boolean): GeneratedRoutePlan {
  return {
    id: `regional-${slugify(areaLabel)}-highlights`,
    title: `${areaLabel} Discovery Highlights`,
    description: `A generated cluster route that gives ${areaLabel} visible POI and route coverage in the Montreal app.`,
    story: `${areaLabel} is included in the default discovery radius, so this generated route keeps the app from feeling like a downtown-only demo.`,
    area: areaLabel,
    preferredAreas: [areaLabel],
    difficulty: isDayTrip ? "moderate" : "easy",
    routeType: isDayTrip ? "one_way" : "loop",
    pace: "balanced",
    tags: ["regional discovery", "local spots", ...(isDayTrip ? ["day-trip"] : [])],
    interests: ["history", "cafes", "parks", "local spots"],
    moodTags: ["scenic", "family-friendly"],
    bestTime: isDayTrip ? "Late morning to afternoon" : "Morning or late afternoon",
    bestFor: [isDayTrip ? "Day-trip planning" : "Neighborhood discovery", "Regional coverage"],
    whyThisRoute: [`It gives ${areaLabel} first-class route coverage.`, "Stops are generated from the expanded POI catalog and remain easy to refine later."]
  };
}

function selectRoutePlaces({
  places,
  config,
  plan,
  areaLabel
}: {
  places: Place[];
  config: DiscoveryConfig;
  plan: GeneratedRoutePlan;
  areaLabel?: string;
}): Place[] {
  const preferredAreas = areaLabel ? [areaLabel] : plan.preferredAreas ?? [];
  const pool = places.filter((place) => {
    const matchesArea = preferredAreas.length === 0 || preferredAreas.includes(place.area);
    const matchesCategory = !plan.categories?.length || plan.categories.includes(place.category);
    const matchesTag = !plan.tagsAny?.length || plan.tagsAny.some((tag) => place.tags.includes(tag));
    return matchesArea && (matchesCategory || matchesTag || (!plan.categories?.length && !plan.tagsAny?.length));
  });

  const ranked = interleaveByArea(
    pool.sort((a, b) => scorePlaceForRoute(b, plan) - scorePlaceForRoute(a, plan) || a.name.localeCompare(b.name))
  );

  return ranked.slice(0, config.maxPoisPerRoute);
}

function createGeneratedRoute(plan: GeneratedRoutePlan, places: Place[], config: DiscoveryConfig): Route | undefined {
  const routePlaces = uniqueById(places).slice(0, config.maxPoisPerRoute);
  if (routePlaces.length < config.minPoisPerRoute) {
    return undefined;
  }

  const slug = slugify(plan.id);
  const geometryPoints = routePlaces.map((place) => place.coordinates);
  const distance = Number(Math.max(pathDistanceKm(geometryPoints), routePlaces.length * 0.55).toFixed(1));
  const duration = Math.min(config.maxRouteDurationMin, Math.max(35, Math.round((distance / 4.5) * 60 + routePlaces.length * 7)));
  const stops = routePlaces.map((place, index) => ({
    id: `${slug}-stop-${index + 1}`,
    placeId: place.id,
    order: index + 1,
    title: place.name,
    description: place.shortDescription,
    distanceFromStartKm: Number(pathDistanceKm(geometryPoints.slice(0, index + 1)).toFixed(1)),
    recommendedStopMin: index === 0 || index === routePlaces.length - 1 ? 5 : 8,
    coordinates: place.coordinates
  }));

  return {
    id: `route-${slug}`,
    slug,
    cityId: "montreal",
    title: plan.title,
    description: plan.description,
    story: plan.story,
    area: plan.area,
    distanceKm: distance,
    durationMin: duration,
    difficulty: plan.difficulty,
    routeType: plan.routeType,
    pace: plan.pace,
    tags: unique(plan.tags),
    interests: unique(plan.interests),
    moodTags: unique(plan.moodTags),
    bestTime: plan.bestTime,
    bestFor: plan.bestFor,
    whyThisRoute: plan.whyThisRoute,
    startPlaceId: routePlaces[0].id,
    endPlaceId: routePlaces[routePlaces.length - 1].id,
    stops,
    metrics: createMetrics(distance, duration, stops.length, plan.difficulty),
    accessibilityNotes: defaultAccessibilityNotes,
    safetyNotes: defaultSafetyNotes,
    coordinates: midpoint(geometryPoints),
    geometry: toRouteGeometry(geometryPoints),
    sources: [generatedSource],
    media: [
      createGeneratedFallbackMedia({
        id: `${slug}-generated-fallback`,
        alt: `${plan.title} generated route fallback visual.`,
        title: `${plan.title} fallback visual`
      })
    ],
    contentStatus: "ready",
    sourceQuality: "draft",
    qaStatus: generatedQaStatus,
    qaScore: generatedQaStatus.score,
    lastReviewedAt: "2026-07-01"
  };
}

function scorePlaceForRoute(place: Place, plan: GeneratedRoutePlan): number {
  const tagScore = plan.tagsAny?.reduce((score, tag) => score + (place.tags.includes(tag) ? 12 : 0), 0) ?? 0;
  const categoryScore = plan.categories?.includes(place.category) ? 18 : 0;
  const discoveryScore = place.discovery?.score ?? 0;
  const popularity = place.discovery?.popularity ?? 45;
  const localInterest = place.discovery?.localInterestScore ?? 45;

  return categoryScore + tagScore + discoveryScore + popularity / 5 + localInterest / 4;
}

function interleaveByArea(places: Place[]): Place[] {
  const byArea = new Map<string, Place[]>();
  for (const place of places) {
    const current = byArea.get(place.area) ?? [];
    current.push(place);
    byArea.set(place.area, current);
  }

  const areas = [...byArea.keys()];
  const result: Place[] = [];
  while (result.length < places.length) {
    let added = false;
    for (const area of areas) {
      const next = byArea.get(area)?.shift();
      if (next) {
        result.push(next);
        added = true;
      }
    }

    if (!added) {
      break;
    }
  }

  return result;
}

function createMetrics(distanceKm: number, durationMin: number, stops: number, difficulty: Route["difficulty"]): RouteMetric[] {
  return [
    { label: "Distance", value: `${distanceKm.toFixed(1)} km` },
    { label: "Time", value: `${durationMin} min` },
    { label: "Stops", value: String(stops) },
    { label: "Difficulty", value: difficulty[0].toUpperCase() + difficulty.slice(1) }
  ];
}

function pathDistanceKm(points: Coordinates[]): number {
  return points.slice(1).reduce((total, point, index) => total + distanceKm(points[index], point), 0);
}

function midpoint(points: Coordinates[]): Coordinates {
  const total = points.reduce(
    (acc, point) => ({
      lat: acc.lat + point.lat,
      lng: acc.lng + point.lng
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: Number((total.lat / points.length).toFixed(5)),
    lng: Number((total.lng / points.length).toFixed(5))
  };
}

function uniqueById(places: Place[]): Place[] {
  const seen = new Set<string>();
  return places.filter((place) => {
    if (seen.has(place.id)) {
      return false;
    }

    seen.add(place.id);
    return true;
  });
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
