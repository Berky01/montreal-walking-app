import type { Route, RouteSearchResult, SearchIntent } from "@/lib/types";

type KeywordRule = {
  tokens: string[];
  value: string;
  chip: string;
};

const interestRules: KeywordRule[] = [
  { tokens: ["history", "historic", "historical", "heritage"], value: "history", chip: "History theme" },
  { tokens: ["architecture", "architectural", "buildings"], value: "architecture", chip: "Architecture theme" },
  { tokens: ["church", "churches", "basilica", "cathedral"], value: "churches", chip: "Churches included" },
  { tokens: ["cafe", "cafes", "café", "cafés", "coffee"], value: "cafes", chip: "Cafe stops included" },
  { tokens: ["scenic", "view", "views", "viewpoint", "viewpoints", "photography", "sunset"], value: "scenic", chip: "Scenic route" },
  { tokens: ["nature", "park", "parks", "green"], value: "nature", chip: "Nature nearby" },
  { tokens: ["waterfront", "river", "canal", "port"], value: "waterfront", chip: "Waterfront route" },
  { tokens: ["hidden", "gems", "gem", "courtyard", "courtyards"], value: "hidden gems", chip: "Hidden gems" },
  { tokens: ["museum", "museums", "gallery", "galleries"], value: "museums", chip: "Museums included" },
  { tokens: ["market", "markets", "food", "restaurants", "bakeries", "bagel", "little italy"], value: "markets", chip: "Market or food stops" },
  { tokens: ["restaurant", "restaurants", "dinner", "date night", "date-night"], value: "restaurants", chip: "Restaurant stops" },
  { tokens: ["bar", "bars", "pub", "pubs", "nightlife", "night club", "nightclub"], value: "nightlife", chip: "Nightlife stops" },
  { tokens: ["music", "venue", "venues", "concert", "shows"], value: "music venues", chip: "Music venues" },
  { tokens: ["shopping", "shops", "mall", "markets"], value: "shopping", chip: "Shopping stops" },
  { tokens: ["outdoor", "bike", "cycling", "biking"], value: "bike-friendly", chip: "Bike-friendly" },
  { tokens: ["day trip", "day-trip", "suburbs", "regional"], value: "day-trip", chip: "Day-trip route" },
  { tokens: ["public art", "sculpture", "sculptures", "installation"], value: "public art", chip: "Public art included" },
  { tokens: ["campus", "university", "mcgill", "concordia"], value: "campus", chip: "Campus area" },
  { tokens: ["accessible", "accessibility", "step-free", "wheelchair", "without stairs", "no stairs", "avoid stairs"], value: "accessible", chip: "Accessible preference" }
];

const moodRules: KeywordRule[] = [
  { tokens: ["quiet", "calm", "peaceful"], value: "quiet", chip: "Quiet mood" },
  { tokens: ["scenic", "beautiful", "views", "sunset", "sunrise", "golden hour"], value: "scenic", chip: "Scenic mood" },
  { tokens: ["hidden", "secret"], value: "hidden", chip: "Hidden mood" },
  { tokens: ["historical", "historic"], value: "historical", chip: "Historical mood" },
  { tokens: ["family", "family-friendly", "kids"], value: "family-friendly", chip: "Family-friendly" },
  { tokens: ["romantic", "date"], value: "romantic", chip: "Romantic mood" },
  { tokens: ["date night", "date-night"], value: "date-night", chip: "Date-night mood" },
  { tokens: ["rain", "rainy"], value: "rainy day", chip: "Rainy day" }
];

const areaRules: KeywordRule[] = [
  { tokens: ["old montreal", "vieux-montreal", "place d'armes", "old port"], value: "Old Montreal", chip: "Old Montreal" },
  { tokens: ["plateau", "mile end"], value: "Plateau", chip: "Plateau area" },
  { tokens: ["little italy", "petite italie", "jean-talon"], value: "Little Italy", chip: "Little Italy" },
  { tokens: ["mount royal", "mont royal"], value: "Mount Royal", chip: "Mount Royal" },
  { tokens: ["lachine", "canal"], value: "Lachine Canal", chip: "Lachine Canal" },
  { tokens: ["downtown", "ville-marie"], value: "Downtown", chip: "Downtown" },
  { tokens: ["laval"], value: "Laval", chip: "Laval" },
  { tokens: ["longueuil"], value: "Longueuil", chip: "Longueuil" },
  { tokens: ["south shore", "rive-sud", "brossard", "chambly"], value: "South Shore", chip: "South Shore" },
  { tokens: ["north shore", "rive-nord", "terrebonne", "oka"], value: "North Shore", chip: "North Shore" },
  { tokens: ["west island", "pointe-claire", "sainte-anne-de-bellevue"], value: "West Island", chip: "West Island" }
];

export function parseSearchIntent(rawQuery: string): SearchIntent {
  const normalized = normalize(rawQuery);
  const durationMaxMin = parseDurationMax(normalized);
  const interests = collectRuleValues(normalized, interestRules);
  const moods = collectRuleValues(normalized, moodRules);
  const areaHints = collectRuleValues(normalized, areaRules);
  const difficulty = parseDifficulty(normalized);
  const routeShape = parseRouteShape(normalized);
  const weatherIntent = moods.includes("rainy day") ? "rainy_day" : undefined;
  const wantsCafeOrFood = interests.some((interest) => ["cafes", "markets", "restaurants", "shopping"].includes(interest));
  const wantsScenicViewpoints = interests.includes("scenic") || moods.includes("scenic");
  const explanationChips = [
    ...collectRuleChips(normalized, moodRules),
    ...collectRuleChips(normalized, interestRules),
    ...collectRuleChips(normalized, areaRules)
  ];

  if (durationMaxMin) {
    explanationChips.push(`Under ${durationMaxMin} min`);
  }

  if (difficulty) {
    explanationChips.push(`${titleCase(difficulty)} difficulty`);
  }

  if (routeShape) {
    explanationChips.push(routeShape === "loop" ? "Loop route" : routeShape === "one_way" ? "One-way route" : "Out-and-back route");
  }

  return {
    rawQuery,
    durationMaxMin,
    interests,
    moods,
    areaHints,
    difficulty,
    routeShape,
    needsAccessibleRoute: interests.includes("accessible"),
    weatherIntent,
    wantsCafeOrFood,
    wantsScenicViewpoints,
    explanationChips: unique(explanationChips)
  };
}

export function rankRoutes(rawQuery: string, routes: Route[]): RouteSearchResult[] {
  const intent = parseSearchIntent(rawQuery);

  return routes
    .map((route) => scoreRoute(route, intent))
    .sort((a, b) => b.score - a.score || a.route.durationMin - b.route.durationMin);
}

function scoreRoute(route: Route, intent: SearchIntent): RouteSearchResult {
  const routeTokens = unique([
    ...route.tags.map(normalize),
    ...route.interests.map(normalize),
    ...route.moodTags.map(normalize),
    normalize(route.area),
    normalize(route.title),
    normalize(route.description),
    normalize(route.story),
    ...route.bestFor.map(normalize),
    ...route.whyThisRoute.map(normalize),
    ...route.stops.flatMap((stop) => [normalize(stop.title), normalize(stop.description)])
  ]);
  const matchReasons: string[] = [];
  let score = 10;

  for (const mood of intent.moods) {
    if (routeTokens.some((token) => tokenMatchesValue(token, mood))) {
      score += 18;
      matchReasons.push(`Matches ${mood} mood`);
    }
  }

  for (const interest of intent.interests) {
    if (routeTokens.some((token) => tokenMatchesValue(token, interest))) {
      score += 16;
      matchReasons.push(`Includes ${interest}`);
    }
  }

  for (const area of intent.areaHints) {
    if (normalize(route.area).includes(normalize(area)) || normalize(route.title).includes(normalize(area))) {
      score += 12;
      matchReasons.push(`Starts in ${area}`);
    }
  }

  if (intent.difficulty) {
    if (route.difficulty === intent.difficulty) {
      score += 10;
      matchReasons.push(`${titleCase(intent.difficulty)} difficulty`);
    } else {
      score -= 4;
    }
  }

  if (intent.routeShape) {
    if (route.routeType === intent.routeShape) {
      score += 8;
      matchReasons.push(intent.routeShape === "loop" ? "Loop route" : "Requested route shape");
    } else {
      score -= 3;
    }
  }

  if (intent.durationMaxMin) {
    if (route.durationMin <= intent.durationMaxMin) {
      score += 20;
      matchReasons.push(`Fits under ${intent.durationMaxMin} min`);
    } else {
      const overBy = route.durationMin - intent.durationMaxMin;
      score -= Math.min(24, Math.ceil(overBy / 10) * 4);
    }
  }

  if (intent.needsAccessibleRoute) {
    const hasBarrier = route.accessibilityNotes.some((note) => note.severity === "barrier");
    score += hasBarrier ? -15 : 10;
    if (!hasBarrier) {
      matchReasons.push("No major accessibility barrier noted");
    }
  }

  if (intent.weatherIntent === "rainy_day" && isRainyDayCandidate(route)) {
    score += 8;
    matchReasons.push("Rainy-day friendly stops");
  }

  if (matchReasons.length === 0) {
    matchReasons.push("Good general Montreal match");
  }

  return {
    route,
    score,
    matchReasons: unique(matchReasons),
    intent
  };
}

function parseDurationMax(query: string): number | undefined {
  const underHourMatch = query.match(/\b(?:under|less than|within)\s+(?:an?\s+)?(\d+)\s*(hour|hr|hours|hrs|minute|min|minutes|mins)\b/);
  if (underHourMatch) {
    return toMinutes(Number(underHourMatch[1]), underHourMatch[2]);
  }

  const explicitMatch = query.match(/\b(\d+)\s*(minute|min|minutes|mins|hour|hr|hours|hrs)\b/);
  if (explicitMatch) {
    return toMinutes(Number(explicitMatch[1]), explicitMatch[2]);
  }

  if (query.includes("half day") || query.includes("half-day")) {
    return 240;
  }

  if (query.includes("short") || query.includes("quick")) {
    return 45;
  }

  return undefined;
}

function parseDifficulty(query: string): Route["difficulty"] | undefined {
  if (query.includes("easy") || query.includes("family-friendly") || query.includes("without stairs") || query.includes("no stairs")) {
    return "easy";
  }

  if (query.includes("moderate")) {
    return "moderate";
  }

  if (query.includes("hard") || query.includes("challenging") || query.includes("steep")) {
    return "hard";
  }

  return undefined;
}

function parseRouteShape(query: string): Route["routeType"] | undefined {
  if (query.includes("loop") || query.includes("circuit")) {
    return "loop";
  }

  if (query.includes("one way") || query.includes("one-way")) {
    return "one_way";
  }

  if (query.includes("out and back") || query.includes("out-and-back")) {
    return "out_and_back";
  }

  return undefined;
}

function toMinutes(value: number, unit: string): number {
  return unit.startsWith("hour") || unit === "hr" || unit === "hrs" ? value * 60 : value;
}

function collectRuleValues(query: string, rules: KeywordRule[]): string[] {
  return unique(rules.filter((rule) => hasAnyToken(query, rule.tokens)).map((rule) => rule.value));
}

function collectRuleChips(query: string, rules: KeywordRule[]): string[] {
  return unique(rules.filter((rule) => hasAnyToken(query, rule.tokens)).map((rule) => rule.chip));
}

function hasAnyToken(query: string, tokens: string[]): boolean {
  return tokens.some((token) => query.includes(normalize(token)));
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenMatchesValue(token: string, value: string): boolean {
  const normalizedValue = normalize(value);
  return token.includes(normalizedValue) || (normalizedValue.endsWith("s") && token.includes(normalizedValue.slice(0, -1)));
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function isRainyDayCandidate(route: Route): boolean {
  return [...route.tags, ...route.interests, ...route.moodTags].some((tag) => ["museums", "cafes", "markets", "restaurants", "shopping", "rainy day"].includes(tag));
}

function titleCase(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
