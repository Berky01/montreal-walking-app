import type { Place } from "@/lib/types";

export type PlaceSearchResult = {
  place: Place;
  score: number;
  matchReasons: string[];
};

export function rankPlaces(query: string, places: Place[]): PlaceSearchResult[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return places.slice(0, 6).map((place) => ({
      place,
      score: 0,
      matchReasons: ["Featured Montreal place"]
    }));
  }

  const terms = normalizedQuery.split(" ").filter(Boolean);

  return places
    .map((place) => scorePlace(place, normalizedQuery, terms))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name))
    .slice(0, 12);
}

function scorePlace(place: Place, normalizedQuery: string, terms: string[]): PlaceSearchResult {
  const name = normalize(place.name);
  const area = normalize(place.area);
  const category = normalize(place.category);
  const tags = place.tags.map(normalize);
  const searchable = [
    name,
    area,
    category,
    normalize(place.shortDescription),
    normalize(place.whyItMatters),
    normalize(place.story),
    normalize(place.periodOrStyle ?? ""),
    ...tags,
    ...place.whatToNotice.map(normalize),
    ...place.practicalInfo.map(normalize)
  ];
  const matchReasons: string[] = [];
  let score = 0;

  if (name === normalizedQuery) {
    score += 120;
    matchReasons.push("Exact place name");
  } else if (name.includes(normalizedQuery)) {
    score += 90;
    matchReasons.push("Place name match");
  }

  if (area.includes(normalizedQuery)) {
    score += 45;
    matchReasons.push(`In ${place.area}`);
  }

  if (category.includes(normalizedQuery)) {
    score += 35;
    matchReasons.push(`Matches ${readableToken(place.category)}`);
  }

  for (const tag of place.tags) {
    if (normalize(tag).includes(normalizedQuery)) {
      score += 35;
      matchReasons.push(`Matches ${tag}`);
    }
  }

  for (const term of terms) {
    if (name.includes(term)) {
      score += 28;
      matchReasons.push("Place name match");
    }
    if (area.includes(term)) {
      score += 12;
      matchReasons.push(`In ${place.area}`);
    }
    if (category.includes(term)) {
      score += 12;
      matchReasons.push(`Matches ${readableToken(place.category)}`);
    }

    const matchedTag = place.tags.find((tag) => normalize(tag).includes(term));
    if (matchedTag) {
      score += 10;
      matchReasons.push(`Matches ${matchedTag}`);
    }

    if (searchable.some((value) => value.includes(term))) {
      score += 5;
      if (!matchedTag && !area.includes(term) && !category.includes(term) && !name.includes(term)) {
        matchReasons.push(`Mentions ${term}`);
      }
    }
  }

  return {
    place,
    score,
    matchReasons: unique(matchReasons).slice(0, 4)
  };
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readableToken(value: string): string {
  return value.replace(/_/g, " ");
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}
