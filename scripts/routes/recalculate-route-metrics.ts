import { getRoutes } from "@/lib/data/index";

const writeRequested = process.argv.includes("--write");

console.log("Route metrics recalculation dry run");

for (const route of getRoutes()) {
  const estimatedDuration = Math.max(route.stops.length * 5, Math.round((route.distanceKm / 4) * 60));
  console.log(`${route.slug}: stored ${route.distanceKm.toFixed(1)} km / ${route.durationMin} min, estimate ${estimatedDuration} min`);
}

if (writeRequested) {
  console.error("Write mode is not implemented. Review metric changes before editing curated routes.");
  process.exit(1);
}
