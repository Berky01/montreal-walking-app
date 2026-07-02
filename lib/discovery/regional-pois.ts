import { createGeneratedFallbackMedia } from "@/lib/media/media-manifest";
import type { AccessibilityNote, Place, PlaceExternalRefs, SafetyNote, Source } from "@/lib/data/types";
import type { DiscoveryConfig, DiscoveryCoverageArea, PoiCandidate } from "@/lib/discovery/types";

const reviewedAt = "2026-07-01";

type RegionalPoiTemplate = {
  id: string;
  name: string;
  category: PoiCandidate["category"];
  tags: string[];
  popularity: number;
  localInterestScore: number;
};

const regionalPoiTemplates: RegionalPoiTemplate[] = [
  {
    id: "heritage-landmark",
    name: "Heritage Landmark",
    category: "attraction",
    tags: ["history", "architecture", "landmarks", "budget/free"],
    popularity: 78,
    localInterestScore: 82
  },
  {
    id: "museum-culture",
    name: "Museum and Culture Stop",
    category: "museum",
    tags: ["museums", "art/culture", "rainy day"],
    popularity: 74,
    localInterestScore: 77
  },
  {
    id: "park-viewpoint",
    name: "Park and Viewpoint",
    category: "park",
    tags: ["parks", "viewpoints", "nature", "family-friendly", "budget/free"],
    popularity: 82,
    localInterestScore: 80
  },
  {
    id: "waterfront-outdoor",
    name: "Waterfront Outdoor Stop",
    category: "outdoor_activity",
    tags: ["waterfront", "outdoor activities", "bike-friendly", "scenic"],
    popularity: 72,
    localInterestScore: 78
  },
  {
    id: "cafe-corridor",
    name: "Cafe Corridor",
    category: "cafe",
    tags: ["cafes", "food", "rainy day", "date-night"],
    popularity: 70,
    localInterestScore: 74
  },
  {
    id: "restaurant-row",
    name: "Restaurant Row",
    category: "restaurant",
    tags: ["restaurants", "food", "date-night", "local spots"],
    popularity: 76,
    localInterestScore: 73
  },
  {
    id: "market-shopping",
    name: "Market and Shopping Stop",
    category: "shopping",
    tags: ["shopping", "markets", "food", "rainy day"],
    popularity: 67,
    localInterestScore: 70
  },
  {
    id: "music-nightlife",
    name: "Music and Nightlife Stop",
    category: "music_venue",
    tags: ["music venues", "nightlife", "bars", "date-night"],
    popularity: 69,
    localInterestScore: 72
  },
  {
    id: "family-activity",
    name: "Family Activity Stop",
    category: "family_activity",
    tags: ["family-friendly", "parks", "outdoor activities", "budget/free"],
    popularity: 71,
    localInterestScore: 75
  },
  {
    id: "hidden-local",
    name: "Local Hidden Gem",
    category: "hidden_gem",
    tags: ["hidden gems", "local spots", "quiet", "neighborhood"],
    popularity: 61,
    localInterestScore: 86
  }
];

const defaultAccessibilityNotes: AccessibilityNote[] = [
  {
    id: "discovery-access-review",
    label: "Access needs review",
    description: "Generated regional discovery stops need sidewalk, entrance, and transit details checked before field-ready status.",
    severity: "info"
  }
];

const defaultSafetyNotes: SafetyNote[] = [
  {
    id: "discovery-safety-review",
    label: "Check current conditions",
    description: "Confirm construction, seasonal access, and opening status before relying on this generated regional stop.",
    severity: "info"
  }
];

export function buildRegionalPoiCandidates(config: DiscoveryConfig): PoiCandidate[] {
  return config.coverageAreas.flatMap((area, areaIndex) =>
    regionalPoiTemplates.slice(0, config.maxPoisPerArea).map((template, templateIndex) =>
      createRegionalCandidate({
        area,
        areaIndex,
        template,
        templateIndex
      })
    )
  );
}

export function createPlaceFromPoiCandidate(candidate: PoiCandidate): Place {
  const slug = slugify(`${candidate.area}-${candidate.name}`);

  return {
    id: `discovery-${slug}`,
    slug,
    cityId: "montreal",
    name: `${candidate.area} ${candidate.name}`,
    category: candidate.category,
    area: candidate.area,
    coordinates: candidate.coordinates,
    shortDescription: candidate.shortDescription,
    story: `${candidate.area} adds regional depth to the Montreal discovery catalog. This stop is generated from the configured coverage model so nearby neighborhoods and suburbs are represented while provider data is reviewed.`,
    whyItMatters: `It helps the app surface ${candidate.area} instead of only central Montreal, with category and route metadata ready for future provider-backed enrichment.`,
    whatToNotice: [
      `How this stop fits ${candidate.area}'s local discovery pattern`,
      "Nearby transit, paths, or main-street connections",
      "Whether the stop works better as a short pause or a route anchor"
    ],
    practicalInfo: ["Generated regional candidate; verify hours and access before field publishing", "Useful for density, clustering, and route-generation coverage"],
    tags: unique(candidate.tags),
    relatedRouteSlugs: [],
    sourceQuality: "draft",
    sources: [sourceForCandidate(candidate)],
    externalRefs: candidate.source === "openstreetmap" ? osmRefs(candidate.sourceId) : undefined,
    discovery: {
      source: candidate.source,
      sourceId: candidate.sourceId,
      rating: candidate.rating,
      popularity: candidate.popularity,
      localInterestScore: candidate.localInterestScore,
      address: candidate.address,
      openingHours: candidate.openingHours,
      website: candidate.website,
      imageUrl: candidate.imageUrl,
      score: candidate.score,
      cachedAt: reviewedAt
    },
    media: [
      createGeneratedFallbackMedia({
        id: `${slug}-generated-fallback`,
        alt: `${candidate.area} ${candidate.name} generated local visual fallback.`,
        title: `${candidate.area} ${candidate.name} fallback visual`
      })
    ],
    contentStatus: "ready",
    accessibilityNotes: defaultAccessibilityNotes,
    safetyNotes: defaultSafetyNotes,
    lastReviewedAt: reviewedAt
  };
}

function createRegionalCandidate({
  area,
  areaIndex,
  template,
  templateIndex
}: {
  area: DiscoveryCoverageArea;
  areaIndex: number;
  template: RegionalPoiTemplate;
  templateIndex: number;
}): PoiCandidate {
  const coordinates = offsetCoordinates(area, areaIndex, templateIndex);
  const dayTripTags = area.regionType === "day_trip" ? ["day-trip"] : [];

  return {
    source: "generated_local",
    sourceId: `regional-${area.id}-${template.id}`,
    name: template.name,
    category: template.category,
    area: area.label,
    coordinates,
    tags: unique([...template.tags, ...dayTripTags, area.label.toLowerCase(), area.regionType.replace("_", "-")]),
    shortDescription: `${template.name} generated for ${area.label} so Montreal-region discovery has coverage beyond the original central MVP set.`,
    rating: Number((3.8 + ((areaIndex + templateIndex) % 8) * 0.12).toFixed(1)),
    popularity: Math.min(100, template.popularity + (area.regionType === "city" ? 8 : area.regionType === "day_trip" ? 4 : 0)),
    localInterestScore: Math.min(100, template.localInterestScore + (area.regionType === "shore" ? 5 : 0))
  };
}

function offsetCoordinates(area: DiscoveryCoverageArea, areaIndex: number, templateIndex: number) {
  const angle = ((areaIndex * 37 + templateIndex * 47) % 360) * (Math.PI / 180);
  const distanceKm = Math.min(Math.max(0.8, area.radiusKm * 0.18 + templateIndex * 0.25), Math.max(1, area.radiusKm * 0.62));
  const latOffset = (Math.cos(angle) * distanceKm) / 111;
  const lngOffset = (Math.sin(angle) * distanceKm) / (111 * Math.cos((area.center.lat * Math.PI) / 180));

  return {
    lat: Number((area.center.lat + latOffset).toFixed(5)),
    lng: Number((area.center.lng + lngOffset).toFixed(5))
  };
}

function sourceForCandidate(candidate: PoiCandidate): Source {
  return {
    id: `source-${candidate.source}-${candidate.sourceId}`,
    label: candidate.source === "openstreetmap" ? "OpenStreetMap / Overpass candidate" : "Meaningful Routes regional discovery fallback",
    type: candidate.source === "openstreetmap" ? "open_data" : "placeholder",
    url: candidate.sourceUrl,
    accessedAt: reviewedAt,
    notes:
      candidate.source === "openstreetmap"
        ? "Provider candidate imported through the modular POI adapter. Verify details before field-ready publication."
        : "Generated from configurable Montreal-region coverage settings to keep mock mode rich without external APIs.",
    status: "needs_review"
  };
}

function osmRefs(sourceId: string): PlaceExternalRefs | undefined {
  const [osmType, osmId] = sourceId.split("/");

  if ((osmType === "node" || osmType === "way" || osmType === "relation") && osmId) {
    return { osmType, osmId };
  }

  return undefined;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}
