import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { readDiscoveryConfig } from "@/lib/discovery/config";
import { fetchOverpassPoiCandidates } from "@/lib/discovery/osm-overpass-provider";
import { dedupePoiCandidates, rankPoiCandidates } from "@/lib/discovery/poi-ranking";
import { createPlaceFromPoiCandidate, buildRegionalPoiCandidates } from "@/lib/discovery/regional-pois";
import type { PoiCandidate } from "@/lib/discovery/types";

const args = process.argv.slice(2);
const write = args.includes("--write");
const city = readArg("--city") ?? "montreal";
const outputPath = readArg("--out") ?? "data/imports/review/montreal-pois.cache.json";
const config = readDiscoveryConfig();

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

async function main(): Promise<void> {
  if (city !== config.defaultCity) {
    console.error(`Unsupported city "${city}". Current discovery default is "${config.defaultCity}".`);
    process.exit(1);
  }

  const provider = process.env.DISCOVERY_POI_PROVIDER ?? "regional_generated";
  const candidates = await loadCandidates(provider);
  const ranked = rankPoiCandidates(dedupePoiCandidates(candidates), config);
  const places = ranked.map(createPlaceFromPoiCandidate);

  console.log(`POI sync ${write ? "write" : "dry-run"} for ${city}`);
  console.log(`Provider: ${provider}`);
  console.log(`Coverage areas: ${config.coverageAreas.length}`);
  console.log(`Candidates: ${candidates.length}`);
  console.log(`Deduped/ranked POIs: ${ranked.length}`);
  console.log(`Place records: ${places.length}`);
  console.log(`Areas: ${formatCounts(places.map((place) => place.area))}`);
  console.log(`Categories: ${formatCounts(places.map((place) => place.category))}`);

  if (write) {
    writeJson(outputPath, {
      city,
      provider,
      config: {
        defaultRadiusKm: config.defaultRadiusKm,
        maxPoisPerArea: config.maxPoisPerArea,
        poiBatchSize: config.poiBatchSize,
        cacheTtlSeconds: config.cacheTtlSeconds,
        coverageAreas: config.coverageAreas
      },
      places
    });
    console.log(`Wrote ${outputPath}`);
  } else {
    console.log("Dry run only. Re-run with --write to write a deterministic review cache.");
  }
}

async function loadCandidates(providerName: string): Promise<PoiCandidate[]> {
  if (providerName === "osm_overpass") {
    if (process.env.ENABLE_EXTERNAL_IMPORTS !== "true") {
      console.error("DISCOVERY_POI_PROVIDER=osm_overpass requires ENABLE_EXTERNAL_IMPORTS=true.");
      process.exit(1);
    }

    return fetchOverpassPoiCandidates({ config });
  }

  return buildRegionalPoiCandidates(config);
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
    .slice(0, 12)
    .map(([label, count]) => `${label}=${count}`)
    .join(", ");
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
