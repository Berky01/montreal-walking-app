import type { Neighborhood } from "@/lib/types";
import { places } from "./places";
import { routes } from "./routes";

type NeighborhoodSeed = {
  slug: string;
  name: string;
  summary: string;
  center: Neighborhood["center"];
  tags: string[];
  areaHints: string[];
};

const seeds: NeighborhoodSeed[] = [
  {
    slug: "old-montreal",
    name: "Old Montreal",
    summary: "Historic streets, basilicas, waterfront edges, and the densest cluster of Montreal landmarks.",
    center: { lat: 45.5053, lng: -73.554 },
    tags: ["history", "architecture", "waterfront", "churches"],
    areaHints: ["old montreal", "old port"]
  },
  {
    slug: "downtown",
    name: "Downtown",
    summary: "Civic landmarks, campuses, galleries, and practical all-weather stops.",
    center: { lat: 45.5032, lng: -73.5698 },
    tags: ["campus", "museums", "architecture"],
    areaHints: ["downtown", "ville-marie", "mcgill"]
  },
  {
    slug: "plateau-mile-end",
    name: "Plateau and Mile End",
    summary: "Murals, parks, cafes, and quieter neighborhood discovery loops.",
    center: { lat: 45.5248, lng: -73.595 },
    tags: ["cafes", "public art", "parks", "quiet"],
    areaHints: ["plateau", "mile end"]
  },
  {
    slug: "mount-royal",
    name: "Mount Royal",
    summary: "Scenic viewpoints, park paths, and easier alternatives around the mountain.",
    center: { lat: 45.5048, lng: -73.5878 },
    tags: ["scenic", "nature", "viewpoints"],
    areaHints: ["mount royal", "mont royal"]
  },
  {
    slug: "lachine-canal",
    name: "Lachine Canal",
    summary: "Waterfront paths, market stops, industrial heritage, and flat route options.",
    center: { lat: 45.4827, lng: -73.5753 },
    tags: ["waterfront", "markets", "history"],
    areaHints: ["lachine", "canal", "atwater"]
  },
  {
    slug: "little-italy",
    name: "Little Italy",
    summary: "Food-led walks around Jean-Talon Market and surrounding neighborhood places.",
    center: { lat: 45.5355, lng: -73.6131 },
    tags: ["markets", "food", "cafes"],
    areaHints: ["little italy", "petite italie", "jean-talon"]
  }
];

export const neighborhoods: Neighborhood[] = seeds.map((seed) => {
  const routeSlugs = routes.filter((route) => seed.areaHints.some((hint) => route.area.toLowerCase().includes(hint))).map((route) => route.slug);
  const placeSlugs = places.filter((place) => seed.areaHints.some((hint) => place.area.toLowerCase().includes(hint))).map((place) => place.slug);

  return {
    id: seed.slug,
    slug: seed.slug,
    cityId: "montreal",
    name: seed.name,
    summary: seed.summary,
    center: seed.center,
    tags: seed.tags,
    routeSlugs,
    placeSlugs,
    contentStatus: "ready"
  };
});
