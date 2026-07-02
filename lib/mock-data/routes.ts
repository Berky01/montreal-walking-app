import { toRouteGeometry } from "@/lib/data/geojson";
import { clonePlaceMediaForRoute, createGeneratedFallbackMedia, getMediaAssetsForRoute } from "@/lib/media/media-manifest";
import { isApprovedProductionImageAsset } from "@/lib/media/licenses";
import { getPrimaryMediaAsset } from "@/lib/media/media-selection";
import type { AccessibilityNote, Coordinates, QaRouteStatus, Route, RouteMetric, SafetyNote, Source } from "@/lib/types";
import { getPlaceById } from "./places";

const reviewStatus: QaRouteStatus = {
  content: "ready",
  geometry: "ready",
  fieldCheck: "scheduled",
  accessibility: "partial",
  sources: "ready",
  overall: "review",
  score: 82
};

const routeSourceReview: Source = {
  id: "source-route-editorial-review",
  label: "Meaningful Routes editorial review",
  type: "editorial",
  notes: "Reviewed against route geometry, editorial notes, and public place references.",
  status: "verified"
};

const easyAccessibility: AccessibilityNote[] = [
  {
    id: "wide-sidewalks",
    label: "Mostly wide sidewalks",
    description: "The main walking segments use established sidewalks or park paths.",
    severity: "info"
  },
  {
    id: "uneven-stone",
    label: "Uneven surfaces possible",
    description: "Old Montreal streets can include cobblestones, curb cuts, and winter wear.",
    severity: "caution"
  }
];

const standardSafety: SafetyNote[] = [
  {
    id: "street-crossings",
    label: "Use marked crossings",
    description: "Several stops require crossing busier streets. Follow signals and avoid rushing the route.",
    severity: "caution"
  },
  {
    id: "weather",
    label: "Check weather before starting",
    description: "Wind, rain, or ice can change comfort on exposed or older surfaces.",
    severity: "info"
  }
];

export const routes: Route[] = [
  createRoute({
    id: "route-old-montreal-loop",
    slug: "old-montreal-monuments-loop",
    title: "Old Montreal Monuments Loop",
    description: "A compact loop through stone streets, civic landmarks, old squares, and the river-facing heart of Montreal.",
    story:
      "This route connects the places where Montreal most clearly shows its founding story: the square around Notre-Dame, archaeology near the river, civic buildings, and the old market that once pulled public life toward the port.",
    area: "Old Montreal",
    distanceKm: 3.2,
    durationMin: 55,
    difficulty: "easy",
    routeType: "loop",
    pace: "relaxed",
    tags: ["history", "architecture", "old streets", "waterfront", "photography"],
    interests: ["history", "architecture", "waterfront"],
    moodTags: ["historical", "scenic", "family-friendly"],
    bestTime: "Morning or early evening",
    bestFor: ["First-time visitors", "History lovers", "Photographers"],
    whyThisRoute: [
      "It covers the highest-density heritage area without feeling rushed.",
      "The stops are close together, so the route works well as a first Montreal walk.",
      "Every major landmark has a clear story and a useful visual anchor."
    ],
    placeIds: ["place-darmes", "notre-dame-basilica", "pointe-a-calliere", "place-jacques-cartier", "montreal-city-hall", "champ-de-mars", "bonsecours-market"],
    accessibilityNotes: easyAccessibility,
    safetyNotes: standardSafety
  }),
  createRoute({
    id: "route-churches-courtyards",
    slug: "churches-courtyards-walk",
    title: "Churches & Courtyards Walk",
    description: "A quiet heritage walk linking basilicas, tucked-away interiors, and calm stone courtyards.",
    story:
      "Montreal's religious and banking landmarks often hide their best moments behind heavier facades. This walk slows down for thresholds: church steps, banking halls, and small spaces where downtown quiet appears unexpectedly.",
    area: "Old Montreal and Downtown",
    distanceKm: 4.1,
    durationMin: 75,
    difficulty: "easy",
    routeType: "one_way",
    pace: "relaxed",
    tags: ["churches", "architecture", "hidden gems", "quiet", "rainy day", "cafes"],
    interests: ["churches", "architecture", "cafes", "hidden gems"],
    moodTags: ["quiet", "historical", "rainy day"],
    bestTime: "Late morning on weekdays",
    bestFor: ["Quiet discovery", "Architecture details", "Rainy-day backup"],
    whyThisRoute: [
      "It connects high-drama interiors with quieter downtown streets.",
      "Cafe and indoor stops make it resilient in imperfect weather.",
      "The route gives religious heritage context without becoming a church checklist."
    ],
    placeIds: ["place-darmes", "notre-dame-basilica", "crew-collective-cafe", "victoria-square", "st-patricks-basilica", "mary-queen-cathedral", "dorchester-square"],
    accessibilityNotes: [
      ...easyAccessibility,
      {
        id: "interior-access-varies",
        label: "Interior access varies",
        description: "Some church and cafe interiors may have steps, queues, ticketing, or restricted hours.",
        severity: "caution"
      }
    ],
    safetyNotes: standardSafety
  }),
  createRoute({
    id: "route-architecture-river",
    slug: "architecture-river-views",
    title: "Architecture & River Views",
    description: "A design-forward route from institutional architecture to the St. Lawrence River and Habitat 67 views.",
    story:
      "This walk reads Montreal as a city of layers: campus classicism, archaeology, river infrastructure, modern housing experiments, and skyline views across the water.",
    area: "Downtown to Old Port",
    distanceKm: 5.6,
    durationMin: 95,
    difficulty: "moderate",
    routeType: "one_way",
    pace: "balanced",
    tags: ["architecture", "scenic", "waterfront", "history", "museums"],
    interests: ["architecture", "waterfront", "scenic", "history"],
    moodTags: ["scenic", "historical"],
    bestTime: "Clear afternoon",
    bestFor: ["Architecture fans", "River views", "Longer city walks"],
    whyThisRoute: [
      "It balances old stone landmarks with modern riverfront architecture.",
      "Longer distances create bigger visual reveals without leaving central Montreal.",
      "It is a strong match for users searching architecture plus scenery."
    ],
    placeIds: ["mcgill-arts-building", "redpath-museum", "victoria-square", "pointe-a-calliere", "quays-of-old-port", "habitat-67-viewpoint", "bonsecours-market"],
    accessibilityNotes: [
      {
        id: "longer-distance",
        label: "Longer distance",
        description: "The route is moderate mainly because it covers more ground than the Old Montreal loops.",
        severity: "caution"
      }
    ],
    safetyNotes: [
      ...standardSafety,
      {
        id: "exposed-waterfront",
        label: "Exposed waterfront segments",
        description: "Wind can be stronger near river viewpoints.",
        severity: "info"
      }
    ]
  }),
  createRoute({
    id: "route-mount-royal-sunrise",
    slug: "mount-royal-sunrise-loop",
    title: "Mount Royal Sunrise Loop",
    description: "A scenic morning loop through Mount Royal paths with a skyline reveal from Kondiaronk Belvedere.",
    story:
      "The mountain is Montreal's orientation point. This route treats the climb as a gradual reveal, moving from tree cover to civic terrace to the city view that explains the island's shape.",
    area: "Mount Royal",
    distanceKm: 4.8,
    durationMin: 90,
    difficulty: "moderate",
    routeType: "loop",
    pace: "balanced",
    tags: ["nature", "scenic", "viewpoints", "quiet", "photography"],
    interests: ["nature", "scenic"],
    moodTags: ["quiet", "scenic", "romantic"],
    bestTime: "Sunrise or clear morning",
    bestFor: ["Views", "Morning walks", "Nature without leaving the city"],
    whyThisRoute: [
      "It provides the strongest nature and viewpoint payoff in the current Montreal set.",
      "The route feels distinct from the stone-and-waterfront Old Montreal set.",
      "It works for users searching quiet, scenic, or romantic walks."
    ],
    placeIds: ["smith-house-mount-royal", "mount-royal-chalet", "kondiaronk-belvedere", "beaver-lake"],
    accessibilityNotes: [
      {
        id: "elevation",
        label: "Elevation and slopes",
        description: "This route includes sustained uphill and downhill segments.",
        severity: "barrier"
      }
    ],
    safetyNotes: [
      ...standardSafety,
      {
        id: "early-light",
        label: "Low-light starts",
        description: "If walking near sunrise, use lit paths and bring reflective clothing in darker seasons.",
        severity: "important"
      }
    ]
  }),
  createRoute({
    id: "route-plateau-cafe",
    slug: "plateau-architecture-cafe-crawl",
    title: "Plateau Architecture & Cafe Crawl",
    description: "A neighborhood walk through colorful facades, exterior staircases, cafe stops, and Mile End food culture.",
    story:
      "The Plateau is best discovered at walking speed: painted homes, twisting staircases, small parks, local theaters, and food rituals that make the neighborhood feel lived-in rather than staged.",
    area: "Plateau and Mile End",
    distanceKm: 4.4,
    durationMin: 85,
    difficulty: "easy",
    routeType: "one_way",
    pace: "relaxed",
    tags: ["architecture", "cafes", "hidden gems", "quiet", "food", "parks"],
    interests: ["architecture", "cafes", "hidden gems", "nature"],
    moodTags: ["quiet", "hidden", "family-friendly"],
    bestTime: "Late morning or weekend afternoon",
    bestFor: ["Cafe stops", "Residential architecture", "Neighborhood discovery"],
    whyThisRoute: [
      "It expands the guide beyond the expected Old Montreal experience.",
      "Cafe stops are naturally integrated rather than bolted on.",
      "It answers searches for hidden gems, quiet streets, and architecture under two hours."
    ],
    placeIds: ["saint-louis-square", "la-fontaine-park", "rialto-theatre", "fairmount-bagel-area"],
    accessibilityNotes: [
      {
        id: "neighborhood-sidewalks",
        label: "Neighborhood sidewalks",
        description: "Most walking is on sidewalks, but winter conditions and construction can narrow paths.",
        severity: "info"
      }
    ],
    safetyNotes: standardSafety
  }),
  createRoute({
    id: "route-lachine-canal",
    slug: "lachine-canal-heritage-walk",
    title: "Lachine Canal Heritage Walk",
    description: "A waterfront heritage route along canal paths, market stops, locks, and industrial-era edges.",
    story:
      "The canal route shows Montreal's working infrastructure becoming public space. It is calmer than the old city, with long views, market life, and traces of industry along the water.",
    area: "Lachine Canal",
    distanceKm: 5.1,
    durationMin: 90,
    difficulty: "easy",
    routeType: "out_and_back",
    pace: "balanced",
    tags: ["waterfront", "history", "scenic", "cafes", "accessible"],
    interests: ["waterfront", "history", "cafes", "scenic", "accessible"],
    moodTags: ["scenic", "quiet", "family-friendly"],
    bestTime: "Weekend morning or golden hour",
    bestFor: ["Waterfront walking", "Market stop", "Accessible route preference"],
    whyThisRoute: [
      "It gives the Montreal guide a canal route with a different rhythm from Old Montreal.",
      "The route pairs heritage with practical food and rest stops.",
      "It is one of the better matches for accessible waterfront searches."
    ],
    placeIds: ["atwater-market", "lachine-canal", "saint-gabriel-locks", "maison-saint-gabriel"],
    accessibilityNotes: [
      {
        id: "shared-path",
        label: "Shared path",
        description: "Mostly flat path segments, but cyclists may pass quickly during busy periods.",
        severity: "caution"
      }
    ],
    safetyNotes: [
      ...standardSafety,
      {
        id: "bike-traffic",
        label: "Bike traffic",
        description: "Stay aware on shared canal paths, especially near market access points.",
        severity: "caution"
      }
    ]
  }),
  createRoute({
    id: "route-old-port-foundries",
    slug: "old-port-foundries-walk",
    title: "Old Port & Foundries Walk",
    description: "A river-edge walk connecting markets, old port public life, and modern waterfront views.",
    story:
      "This route keeps the river in view and moves through the spaces where Montreal's port, market buildings, and modern recreational waterfront overlap.",
    area: "Old Port",
    distanceKm: 4.6,
    durationMin: 80,
    difficulty: "easy",
    routeType: "loop",
    pace: "balanced",
    tags: ["waterfront", "history", "scenic", "architecture"],
    interests: ["waterfront", "history", "scenic", "architecture"],
    moodTags: ["scenic", "family-friendly"],
    bestTime: "Late afternoon",
    bestFor: ["River views", "Old Port orientation", "Family-friendly walking"],
    whyThisRoute: [
      "It is the simplest route for users who want Old Port without a dense monument list.",
      "Waterfront views make the route easy to follow visually.",
      "It uses familiar landmarks while preserving a discovery-first feel."
    ],
    placeIds: ["bonsecours-market", "place-jacques-cartier", "old-port-clock-tower", "quays-of-old-port", "habitat-67-viewpoint", "pointe-a-calliere"],
    accessibilityNotes: easyAccessibility,
    safetyNotes: standardSafety
  }),
  createRoute({
    id: "route-place-darmes-circuit",
    slug: "place-darmes-circuit",
    title: "Place d'Armes Circuit",
    description: "A short high-density circuit around Place d'Armes for architecture, banking halls, and one excellent cafe stop.",
    story:
      "This is the best short route when time is tight. It treats one square as a compact museum of Montreal's religious, financial, and civic architecture.",
    area: "Old Montreal",
    distanceKm: 1.6,
    durationMin: 35,
    difficulty: "easy",
    routeType: "loop",
    pace: "relaxed",
    tags: ["architecture", "history", "churches", "cafes", "rainy day"],
    interests: ["architecture", "history", "churches", "cafes"],
    moodTags: ["historical", "quiet", "rainy day"],
    bestTime: "Any clear morning or rainy afternoon",
    bestFor: ["Under 45 minutes", "Architecture details", "Rainy-day option"],
    whyThisRoute: [
      "It gives users a complete route when they only have a short window.",
      "It is dense enough to feel meaningful without covering much distance.",
      "It naturally matches searches for architecture under one hour."
    ],
    placeIds: ["place-darmes", "notre-dame-basilica", "crew-collective-cafe"],
    accessibilityNotes: easyAccessibility,
    safetyNotes: standardSafety
  }),
  createRoute({
    id: "route-public-art-downtown",
    slug: "public-art-downtown-walk",
    title: "Public Art Downtown Walk",
    description: "A downtown route linking plazas, public artworks, cultural buildings, and useful orientation points.",
    story:
      "This route treats downtown Montreal as an outdoor gallery. It moves from office-tower plazas to cultural squares and public-art stops that make the grid easier to read on foot.",
    area: "Downtown",
    distanceKm: 3.4,
    durationMin: 65,
    difficulty: "easy",
    routeType: "one_way",
    pace: "relaxed",
    tags: ["public art", "architecture", "downtown", "scenic", "rainy day"],
    interests: ["public art", "architecture", "scenic"],
    moodTags: ["scenic", "hidden", "family-friendly"],
    bestTime: "Late afternoon or early evening",
    bestFor: ["Public art", "Downtown orientation", "Short cultural walks"],
    whyThisRoute: [
      "It turns downtown plazas and artworks into a clear cultural discovery thread.",
      "Every stop gives users a concrete thing to notice, from public sculpture to festival infrastructure.",
      "It works well for visitors who want downtown orientation without committing to a long walk."
    ],
    placeIds: ["place-ville-marie-ring", "illuminated-crowd", "phillips-square", "belgo-building", "place-des-arts", "quartier-des-spectacles", "place-jean-riopelle"],
    accessibilityNotes: easyAccessibility,
    safetyNotes: standardSafety
  }),
  createRoute({
    id: "route-hidden-squares-quiet",
    slug: "hidden-squares-quiet-streets",
    title: "Hidden Squares & Quiet Streets",
    description: "A calmer central route through small squares, courtyards, Chinatown edges, and Old Montreal side streets.",
    story:
      "This route slows down in the spaces between the landmarks: small civic squares, tucked-away stone passages, and quieter streets that make the center feel less crowded.",
    area: "Old Montreal and Downtown",
    distanceKm: 3.1,
    durationMin: 60,
    difficulty: "easy",
    routeType: "one_way",
    pace: "relaxed",
    tags: ["hidden gems", "quiet", "public square", "old streets", "architecture"],
    interests: ["hidden gems", "architecture", "history"],
    moodTags: ["quiet", "hidden", "historical"],
    bestTime: "Morning or early weekday afternoon",
    bestFor: ["Quiet discovery", "Short side-street walks", "Repeat visitors"],
    whyThisRoute: [
      "It gives the Montreal guide a lower-noise central option.",
      "The stops are close enough to support a real walking geometry preview.",
      "It makes small public spaces feel intentional instead of incidental."
    ],
    placeIds: ["champ-de-mars", "place-de-la-dauversiere", "cours-le-royer", "place-darmes", "sun-yat-sen-park", "chinatown-paifang", "phillips-square"],
    accessibilityNotes: easyAccessibility,
    safetyNotes: standardSafety
  }),
  createRoute({
    id: "route-markets-neighborhood-food",
    slug: "markets-neighborhood-food-walk",
    title: "Markets and Neighborhood Food Walk",
    description: "A north-side neighborhood route around markets, parks, bakeries, churches, and food streets.",
    story:
      "This route keeps food tied to place. It connects market life, Little Italy landmarks, and Mile End food stops without becoming a ticketed food-tour product.",
    area: "Little Italy and Mile End",
    distanceKm: 4.7,
    durationMin: 95,
    difficulty: "easy",
    routeType: "one_way",
    pace: "relaxed",
    tags: ["food", "market", "cafes", "neighborhood", "family-friendly"],
    interests: ["cafes", "food", "markets", "hidden gems"],
    moodTags: ["family-friendly", "hidden", "quiet"],
    bestTime: "Weekend morning or weekday lunch",
    bestFor: ["Market visits", "Cafe stops", "Neighborhood discovery"],
    whyThisRoute: [
      "It keeps food tied to neighborhood context instead of becoming a generic restaurant list.",
      "Markets, parks, churches, and bakery streets give the area a stronger sense of place.",
      "It helps users discover Little Italy and Mile End through real public landmarks and local rituals."
    ],
    placeIds: ["jean-talon-market", "dante-park", "madonna-della-difesa", "little-italy-saint-laurent", "st-viateur-bagel-area", "fairmount-bagel-area", "plaza-st-hubert"],
    accessibilityNotes: [
      {
        id: "market-crowds",
        label: "Market crowds",
        description: "Market streets and bakery lines can narrow the walking path during busy periods.",
        severity: "caution"
      }
    ],
    safetyNotes: standardSafety
  }),
  createRoute({
    id: "route-museums-campus",
    slug: "museums-campus-walk",
    title: "Museums and Campus Walk",
    description: "A Sherbrooke Street route through campus gates, museums, gallery streets, and architecture stops.",
    story:
      "This walk connects the institutional side of downtown: campus entrances, museum facades, and architecture-focused stops that make Sherbrooke Street feel like a cultural spine.",
    area: "Downtown and Golden Square Mile",
    distanceKm: 4.2,
    durationMin: 85,
    difficulty: "easy",
    routeType: "one_way",
    pace: "balanced",
    tags: ["museums", "campus", "architecture", "rainy day", "history"],
    interests: ["museums", "architecture", "history", "hidden gems"],
    moodTags: ["quiet", "rainy day", "historical"],
    bestTime: "Late morning on weekdays",
    bestFor: ["Museum clusters", "Campus walks", "Rainy-day planning"],
    whyThisRoute: [
      "It links major cultural institutions without requiring a full museum day.",
      "It works well when users want indoor-adjacent places during uncertain weather.",
      "It shows how Sherbrooke Street works as a civic and academic spine."
    ],
    placeIds: ["roddick-gates", "mcgill-arts-building", "redpath-museum", "mccord-stewart-museum", "montreal-museum-fine-arts", "concordia-ev-building", "canadian-centre-architecture"],
    accessibilityNotes: [
      {
        id: "museum-access-varies",
        label: "Museum access varies",
        description: "Interior access, ramps, and hours differ by institution; verify before relying on indoor stops.",
        severity: "caution"
      }
    ],
    safetyNotes: standardSafety
  })
];

export function getRouteBySlug(slug: string): Route | undefined {
  return routes.find((route) => route.slug === slug);
}

export function getRoutesForPlace(placeId: string): Route[] {
  return routes.filter((route) => route.stops.some((stop) => stop.placeId === placeId));
}

function createRoute(input: Omit<Route, "cityId" | "stops" | "metrics" | "coordinates" | "geometry" | "sources" | "media" | "contentStatus" | "sourceQuality" | "qaStatus" | "qaScore" | "lastReviewedAt" | "startPlaceId" | "endPlaceId"> & { placeIds: string[] }): Route {
  const places = input.placeIds.map((placeId) => {
    const place = getPlaceById(placeId);
    if (!place) {
      throw new Error(`Missing place ${placeId}`);
    }
    return place;
  });
  const geometry = places.map((place) => place.coordinates);
  const routeMedia = getMediaAssetsForRoute(input.slug);
  const stopPhoto = places.map((place) => getPrimaryMediaAsset(place.media, "hero")).find(isApprovedProductionImageAsset);
  const realMedia = routeMedia.length ? routeMedia : stopPhoto ? [clonePlaceMediaForRoute(stopPhoto, input.slug, input.title)] : [];
  const routeStops = places.map((place, index) => ({
    id: `${input.slug}-stop-${index + 1}`,
    placeId: place.id,
    order: index + 1,
    title: place.name,
    description: place.shortDescription,
    distanceFromStartKm: Number(((input.distanceKm / Math.max(places.length - 1, 1)) * index).toFixed(1)),
    recommendedStopMin: index === 0 || index === places.length - 1 ? 5 : 8,
    coordinates: place.coordinates
  }));

  return {
    ...input,
    cityId: "montreal",
    startPlaceId: places[0].id,
    endPlaceId: places[places.length - 1].id,
    stops: routeStops,
    metrics: createMetrics(input.distanceKm, input.durationMin, routeStops.length, input.difficulty),
    coordinates: midpoint(geometry),
    geometry: toRouteGeometry(geometry),
    sources: [routeSourceReview],
    media: [
      ...realMedia,
      createGeneratedFallbackMedia({
        id: `${input.slug}-generated-fallback`,
        alt: `${input.title} generated route fallback visual.`,
        title: `${input.title} fallback visual`
      })
    ],
    contentStatus: "ready",
    sourceQuality: "verified",
    qaStatus: reviewStatus,
    qaScore: reviewStatus.score,
    lastReviewedAt: "2026-07-01"
  };
}

function createMetrics(distanceKm: number, durationMin: number, stops: number, difficulty: Route["difficulty"]): RouteMetric[] {
  return [
    { label: "Distance", value: `${distanceKm.toFixed(1)} km` },
    { label: "Time", value: `${durationMin} min` },
    { label: "Stops", value: String(stops) },
    { label: "Difficulty", value: difficulty[0].toUpperCase() + difficulty.slice(1) }
  ];
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
