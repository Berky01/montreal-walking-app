import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { getAllPlaces, getAllRoutes } from "@/lib/data/index";
import { readDiscoveryConfig } from "@/lib/discovery/config";

const args = process.argv.slice(2);
const write = args.includes("--write");
const city = readArg("--city") ?? "montreal";
const outputPath = readArg("--out") ?? "data/generated/montreal-routes.cache.json";
const config = readDiscoveryConfig();

if (city !== config.defaultCity) {
  console.error(`Unsupported city "${city}". Current discovery default is "${config.defaultCity}".`);
  process.exit(1);
}

const places = getAllPlaces();
const routes = getAllRoutes();
const generatedRoutes = routes.filter((route) => route.sources.some((source) => source.id === "source-generated-discovery-routes"));

console.log(`Route sync ${write ? "write" : "dry-run"} for ${city}`);
console.log(`Places available: ${places.length}`);
console.log(`Total routes: ${routes.length}`);
console.log(`Generated routes: ${generatedRoutes.length}`);
console.log(`Route areas: ${formatCounts(generatedRoutes.map((route) => route.area))}`);
console.log(`Route signals: ${formatCounts(generatedRoutes.flatMap((route) => [...route.tags, ...route.interests, ...route.moodTags]))}`);

if (write) {
  writeJson(outputPath, {
    city,
    config: {
      maxRoutesPerTheme: config.maxRoutesPerTheme,
      minPoisPerRoute: config.minPoisPerRoute,
      maxPoisPerRoute: config.maxPoisPerRoute,
      maxRouteDurationMin: config.maxRouteDurationMin,
      routeRadiusKm: config.routeRadiusKm,
      routesShownInDiscovery: config.routesShownInDiscovery
    },
    routes: generatedRoutes
  });
  console.log(`Wrote ${outputPath}`);
} else {
  console.log("Dry run only. Re-run with --write to write a deterministic review cache.");
}

function readArg(name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function formatCounts(values: string[]): string {
  return Object.entries(
    values.reduce<Record<string, number>>((acc, value) => {
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 16)
    .map(([label, count]) => `${label}=${count}`)
    .join(", ");
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
