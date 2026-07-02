import { getRoutes } from "@/lib/data/index";

const requiredRouteSlugs = [
  "old-montreal-monuments-loop",
  "churches-courtyards-walk",
  "architecture-river-views",
  "mount-royal-sunrise-loop",
  "plateau-architecture-cafe-crawl",
  "lachine-canal-heritage-walk",
  "old-port-foundries-walk",
  "place-darmes-circuit",
  "public-art-downtown-walk",
  "hidden-squares-quiet-streets",
  "markets-neighborhood-food-walk",
  "museums-campus-walk"
];

const requiredGeneratedTags = ["nightlife", "family-friendly", "rainy day", "day-trip", "bike-friendly", "date-night"];

const routes = getRoutes();
const errors: string[] = [];

if (routes.length < 28) {
  errors.push(`Expected at least 28 routes, found ${routes.length}.`);
}

const readyRoutes = routes.filter((route) => route.contentStatus === "ready");
if (readyRoutes.length < 8) {
  errors.push(`Expected at least 8 ready routes, found ${readyRoutes.length}.`);
}

for (const slug of requiredRouteSlugs) {
  if (!routes.some((route) => route.slug === slug)) {
    errors.push(`Missing required route theme: ${slug}.`);
  }
}

const routeSignals = routes.flatMap((route) => [...route.tags, ...route.interests, ...route.moodTags]);
for (const tag of requiredGeneratedTags) {
  if (!routeSignals.includes(tag)) {
    errors.push(`Missing generated route signal: ${tag}.`);
  }
}

for (const route of routes) {
  if (route.stops.length < 3) {
    errors.push(`Route ${route.slug} must have at least three stops.`);
  }

  if (route.geometry.type !== "LineString" || route.geometry.coordinates.length < 2) {
    errors.push(`Route ${route.slug} is missing LineString geometry.`);
  }

  if (route.distanceKm <= 0 || route.durationMin <= 0) {
    errors.push(`Route ${route.slug} has invalid distance or duration.`);
  }

  if (!route.safetyNotes.length || !route.accessibilityNotes.length) {
    errors.push(`Route ${route.slug} is missing safety or accessibility notes.`);
  }
}

if (errors.length) {
  console.error("Route validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Route validation passed: ${routes.length} routes, ${readyRoutes.length} ready.`);
