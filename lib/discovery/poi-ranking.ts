import type { Coordinates } from "@/lib/data/types";
import type { DiscoveryConfig, PoiCandidate } from "@/lib/discovery/types";

export function dedupePoiCandidates(candidates: PoiCandidate[]): PoiCandidate[] {
  const bySourceId = new Set<string>();
  const deduped: PoiCandidate[] = [];

  for (const candidate of candidates) {
    const sourceKey = `${candidate.source}:${candidate.sourceId}`;
    if (bySourceId.has(sourceKey)) {
      continue;
    }

    const nearbyDuplicate = deduped.some(
      (existing) =>
        normalize(existing.name) === normalize(candidate.name) &&
        existing.category === candidate.category &&
        distanceKm(existing.coordinates, candidate.coordinates) <= 0.05
    );

    if (nearbyDuplicate) {
      continue;
    }

    bySourceId.add(sourceKey);
    deduped.push(candidate);
  }

  return deduped;
}

export function rankPoiCandidates(candidates: PoiCandidate[], config: DiscoveryConfig): PoiCandidate[] {
  const scored = candidates
    .map((candidate) => ({
      candidate,
      score: scorePoiCandidate(candidate, config)
    }))
    .sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name));

  const byArea = new Map<string, typeof scored>();
  for (const item of scored) {
    const current = byArea.get(item.candidate.area) ?? [];
    current.push(item);
    byArea.set(item.candidate.area, current);
  }

  const areaOrder = [...byArea.entries()]
    .sort((a, b) => (b[1][0]?.score ?? 0) - (a[1][0]?.score ?? 0) || a[0].localeCompare(b[0]))
    .map(([area]) => area);
  const ranked: PoiCandidate[] = [];

  while (ranked.length < scored.length) {
    let added = false;
    for (const area of areaOrder) {
      const next = byArea.get(area)?.shift();
      if (next) {
        ranked.push({ ...next.candidate, score: next.score });
        added = true;
      }
    }

    if (!added) {
      break;
    }
  }

  return ranked;
}

export function scorePoiCandidate(candidate: PoiCandidate, config: DiscoveryConfig): number {
  const distance = distanceKm(config.defaultCenter, candidate.coordinates);
  const distanceScore = Math.max(0, 32 * (1 - distance / config.defaultRadiusKm));
  const ratingScore = candidate.rating ? candidate.rating * 6 : 12;
  const popularityScore = (candidate.popularity ?? 40) / 3.5;
  const localScore = (candidate.localInterestScore ?? 40) / 2.5;
  const categoryScore = categoryWeight(candidate.category);

  return Number((distanceScore + ratingScore + popularityScore + localScore + categoryScore).toFixed(2));
}

export function distanceKm(a: Coordinates, b: Coordinates): number {
  const radiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const value =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * radiusKm * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function categoryWeight(category: PoiCandidate["category"]): number {
  if (["museum", "attraction", "viewpoint", "park", "historic_building", "heritage_building", "public_art"].includes(category)) {
    return 12;
  }

  if (["market", "cafe", "restaurant", "bar", "music_venue", "art_culture"].includes(category)) {
    return 9;
  }

  return 6;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}
