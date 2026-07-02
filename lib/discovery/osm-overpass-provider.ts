import type { DiscoveryConfig, PoiCandidate } from "@/lib/discovery/types";

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

const defaultEndpoint = process.env.OVERPASS_ENDPOINT || "https://overpass-api.de/api/interpreter";

export function buildOverpassPoiQuery(config: DiscoveryConfig): string {
  const radiusMeters = Math.round(config.defaultRadiusKm * 1000);
  const around = `(around:${radiusMeters},${config.defaultCenter.lat},${config.defaultCenter.lng})`;
  const limit = Math.max(10, config.poiBatchSize);

  return `
[out:json][timeout:40];
(
  node${around}["tourism"~"attraction|museum|viewpoint|artwork"];
  way${around}["tourism"~"attraction|museum|viewpoint|artwork"];
  relation${around}["tourism"~"attraction|museum|viewpoint|artwork"];
  node${around}["amenity"~"cafe|restaurant|bar|pub|nightclub|theatre|arts_centre|marketplace"];
  way${around}["amenity"~"cafe|restaurant|bar|pub|nightclub|theatre|arts_centre|marketplace"];
  relation${around}["amenity"~"cafe|restaurant|bar|pub|nightclub|theatre|arts_centre|marketplace"];
  node${around}["leisure"~"park|garden|nature_reserve"];
  way${around}["leisure"~"park|garden|nature_reserve"];
  relation${around}["leisure"~"park|garden|nature_reserve"];
  node${around}["shop"~"mall|department_store|books|bakery|chocolate|confectionery"];
  way${around}["shop"~"mall|department_store|books|bakery|chocolate|confectionery"];
  relation${around}["shop"~"mall|department_store|books|bakery|chocolate|confectionery"];
);
out center tags ${limit};
`.trim();
}

export async function fetchOverpassPoiCandidates({
  config,
  endpoint = defaultEndpoint,
  fetcher = fetch
}: {
  config: DiscoveryConfig;
  endpoint?: string;
  fetcher?: typeof fetch;
}): Promise<PoiCandidate[]> {
  const response = await fetcher(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": "MeaningfulRoutes/0.1 discovery sync"
    },
    body: new URLSearchParams({ data: buildOverpassPoiQuery(config) })
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed with status ${response.status}`);
  }

  const data = (await response.json()) as OverpassResponse;
  return (data.elements ?? []).map(toPoiCandidate).filter(Boolean) as PoiCandidate[];
}

function toPoiCandidate(element: OverpassElement): PoiCandidate | undefined {
  const tags = element.tags ?? {};
  const name = tags.name || tags["name:en"] || tags["name:fr"];
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;

  if (!name || lat === undefined || lng === undefined) {
    return undefined;
  }

  const category = mapCategory(tags);

  return {
    source: "openstreetmap",
    sourceId: `${element.type}/${element.id}`,
    name,
    category,
    area: tags["addr:city"] || tags["is_in:city"] || "Montreal Region",
    coordinates: { lat, lng },
    tags: mapTags(tags, category),
    shortDescription: tags.description || `${name} imported as an OpenStreetMap candidate for Montreal-region discovery review.`,
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    address: formatAddress(tags),
    openingHours: tags.opening_hours,
    website: tags.website || tags["contact:website"],
    popularity: Number(tags.stars) || undefined,
    localInterestScore: tags.wikidata || tags.wikipedia ? 78 : 58
  };
}

function mapCategory(tags: Record<string, string>): PoiCandidate["category"] {
  if (tags.tourism === "museum") return "museum";
  if (tags.tourism === "viewpoint") return "viewpoint";
  if (tags.tourism === "artwork" || tags.amenity === "arts_centre") return "art_culture";
  if (tags.leisure === "park" || tags.leisure === "garden" || tags.leisure === "nature_reserve") return "park";
  if (tags.amenity === "cafe") return "cafe";
  if (tags.amenity === "restaurant") return "restaurant";
  if (tags.amenity === "bar" || tags.amenity === "pub") return "bar";
  if (tags.amenity === "nightclub") return "nightlife";
  if (tags.amenity === "theatre") return "music_venue";
  if (tags.amenity === "marketplace") return "market";
  if (tags.shop) return "shopping";
  return "attraction";
}

function mapTags(tags: Record<string, string>, category: PoiCandidate["category"]): string[] {
  const values = [
    category.replace("_", " "),
    tags.tourism,
    tags.amenity,
    tags.leisure,
    tags.shop,
    tags.historic ? "history" : undefined,
    tags.wikidata || tags.wikipedia ? "public reference" : undefined
  ].filter(Boolean) as string[];

  return [...new Set(values)];
}

function formatAddress(tags: Record<string, string>): string | undefined {
  const parts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"], tags["addr:province"], tags["addr:postcode"]].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}
