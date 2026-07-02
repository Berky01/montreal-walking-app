import { getAllRoutes } from "@/lib/data/index";

const errors: string[] = [];

const routes = getAllRoutes();

for (const route of routes) {
  if (route.geometry.type !== "LineString") {
    errors.push(`${route.slug} geometry must be LineString.`);
  }

  if (route.geometry.coordinates.length < 2) {
    errors.push(`${route.slug} must have at least two geometry coordinates.`);
  }

  if (route.stops.length >= 2) {
    const firstStop = route.stops[0].coordinates;
    const firstPoint = route.geometry.coordinates[0];
    const lastStop = route.stops[route.stops.length - 1].coordinates;
    const lastPoint = route.geometry.coordinates[route.geometry.coordinates.length - 1];

    if (firstStop.lat !== firstPoint.lat || firstStop.lng !== firstPoint.lng) {
      errors.push(`${route.slug} geometry must start at the first stop.`);
    }

    if (lastStop.lat !== lastPoint.lat || lastStop.lng !== lastPoint.lng) {
      errors.push(`${route.slug} geometry must end at the last stop.`);
    }
  }
}

if (errors.length) {
  console.error("Route geometry validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Route geometry validation passed: ${routes.length} routes.`);
