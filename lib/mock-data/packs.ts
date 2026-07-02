import type { CityPack } from "@/lib/types";

export const cityPacks: CityPack[] = [
  {
    id: "city-pack-montreal-heritage-starter",
    slug: "montreal-heritage-starter",
    cityId: "montreal",
    title: "Montreal Heritage Starter",
    summary: "A future city-pack grouping for heritage-first Montreal walks. Kept behind feature flags until packs have product support.",
    routeSlugs: ["old-montreal-monuments-loop", "churches-courtyards-walk", "architecture-river-views"],
    placeSlugs: ["place-darmes", "notre-dame-basilica", "pointe-a-calliere"],
    status: "flagged"
  }
];
