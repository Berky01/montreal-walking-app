import { getAllPlaces, getAllRoutes } from "@/lib/data/index";
import { validateDataCatalog, validatePublicContentReadiness } from "@/lib/data/validators";

const routes = getAllRoutes();
const places = getAllPlaces();
const result = validateDataCatalog({
  routes,
  places
});
const publicResult = validatePublicContentReadiness({
  routes,
  places
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

if (!publicResult.ok) {
  console.error("Public content readiness validation failed:");
  for (const error of publicResult.errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Data validation passed: ${result.counts.routes} routes, ${result.counts.places} places.`);
console.log(`Public readiness passed: ${publicResult.counts.publicRoutes} public routes, ${publicResult.counts.publicPlaces} public places.`);
