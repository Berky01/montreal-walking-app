import { getPlaces, getRoutes } from "@/lib/data/index";
import { validateDataCatalog } from "@/lib/data/validators";

const result = validateDataCatalog({
  routes: getRoutes(),
  places: getPlaces()
});

if (result.warnings.length) {
  console.warn("Data validation warnings:");
  for (const warning of result.warnings) {
    console.warn(`- ${warning}`);
  }
}

if (!result.ok) {
  console.error("Data validation failed:");
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Data validation passed: ${result.counts.routes} routes, ${result.counts.places} places.`);
