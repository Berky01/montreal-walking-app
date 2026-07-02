import { getAllPlaces, getAllRoutes } from "@/lib/data/index";
import { buildMediaCoverageReport } from "@/lib/media/media-selection";
import { validateMediaCatalog } from "@/lib/media/validation";

const routes = getAllRoutes();
const places = getAllPlaces();
const validation = validateMediaCatalog({ routes, places });
const coverage = buildMediaCoverageReport({ routes, places });

if (!validation.ok) {
  console.error("Media validation failed:");
  for (const error of validation.errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Media validation passed: ${coverage.totalMediaAssets} assets, ${coverage.approvedRealPhotos} approved real photos, ${coverage.generatedFallbacks} generated fallbacks.`);
console.log(`Route photo coverage: ${coverage.routePhotoCoverage.covered}/${coverage.routePhotoCoverage.total}.`);
console.log(`Place photo coverage: ${coverage.placePhotoCoverage.covered}/${coverage.placePhotoCoverage.total}.`);
