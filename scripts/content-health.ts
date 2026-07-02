import { getAllPlaces, getAllPublicSlugsForCrawl, getAllRoutes, getPlaces, getRoutes } from "@/lib/data/index";
import { validateDataCatalog, validatePublicContentReadiness } from "@/lib/data/validators";

const routes = getAllRoutes();
const places = getAllPlaces();
const publicRoutes = getRoutes();
const publicPlaces = getPlaces();
const dataResult = validateDataCatalog({ routes, places });
const publicResult = validatePublicContentReadiness({ routes, places, publicRoutes, publicPlaces });
const crawl = getAllPublicSlugsForCrawl();
const errors = [...dataResult.errors, ...publicResult.errors];
const duplicatePaths = crawl.paths.filter((path, index) => crawl.paths.indexOf(path) !== index);

if (!publicRoutes.length) {
  errors.push("No public routes are available for crawl coverage.");
}

if (!publicPlaces.length) {
  errors.push("No public places are available for crawl coverage.");
}

if (duplicatePaths.length) {
  errors.push(`Duplicate public crawl paths: ${[...new Set(duplicatePaths)].join(", ")}`);
}

if (crawl.routes.length !== crawl.routeLive.length) {
  errors.push("Every public route must have a matching live-route crawl path.");
}

if (errors.length) {
  console.error("Content health failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

if (dataResult.warnings.length || publicResult.warnings.length) {
  console.warn("Content health warnings:");
  for (const warning of [...dataResult.warnings, ...publicResult.warnings]) {
    console.warn(`- ${warning}`);
  }
}

console.log(
  `Content health passed: ${publicRoutes.length} public routes, ${publicPlaces.length} public places, ${crawl.paths.length} crawl paths.`
);
