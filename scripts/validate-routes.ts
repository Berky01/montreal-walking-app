import { placeTrustRecords, trustedLiveRoutes } from '../src/data/placeTrustData';
import { buildLiveRouteTrustMetrics } from '../src/lib/content-trust';

const errors: string[] = [];

for (const [key, route] of Object.entries(trustedLiveRoutes)) {
  const routePrefix = `route ${key}`;

  if (key !== route.slug) {
    errors.push(`${routePrefix} key must match slug`);
  }

  if (!route.title.trim()) {
    errors.push(`${routePrefix} title is required`);
  }

  if (!Number.isFinite(route.distanceKm) || route.distanceKm <= 0) {
    errors.push(`${routePrefix} distanceKm must be positive`);
  }

  if (!Number.isFinite(route.durationMin) || route.durationMin <= 0) {
    errors.push(`${routePrefix} durationMin must be positive`);
  }

  if (!placeTrustRecords[route.currentStopSlug]) {
    errors.push(`${routePrefix} currentStopSlug must reference a place trust record`);
  }

  const metrics = buildLiveRouteTrustMetrics(route, placeTrustRecords);
  if (!/^\d/.test(metrics.steps.value)) {
    errors.push(`${routePrefix} must produce estimated steps`);
  }

  if (metrics.steps.sourceLabel !== 'Estimated from planned walking distance') {
    errors.push(`${routePrefix} must disclose the step estimate source`);
  }

  if (!/min\/km$/.test(metrics.pace)) {
    errors.push(`${routePrefix} must produce pace in min/km`);
  }

  if (!metrics.currentStop.name.trim()) {
    errors.push(`${routePrefix} must produce current stop context`);
  }
}

if (errors.length) {
  console.error(`Route trust validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${Object.keys(trustedLiveRoutes).length} trusted live route records.`);
}
