import { getAllRoutes } from "@/lib/data/index";

const writeRequested = process.argv.includes("--write");

console.log("Route geometry build dry run");
console.log("Provider: manual stored geometry");

for (const route of getAllRoutes()) {
  console.log(`${route.slug}: ${route.geometry.coordinates.length} geometry points from ${route.stops.length} stops`);
}

if (writeRequested) {
  console.error("Write mode is not implemented. Generated geometry must be reviewed before replacing curated geometry.");
  process.exit(1);
}
