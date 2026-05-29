import type { Interest } from '../types';
import type { POI } from '../mvpTypes';

export interface OverpassElement {
  type?: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function categoryFromTags(tags: Record<string, string>): Interest | null {
  if (tags.amenity === 'cafe') return 'cafes';
  if (tags.amenity === 'toilets') return 'public-toilets';
  if (tags.amenity === 'place_of_worship' || tags.building === 'church') return 'churches';
  if (tags.tourism === 'viewpoint') return 'viewpoints';
  if (tags.leisure === 'park' || tags.landuse === 'recreation_ground') return 'parks';
  if (tags.waterway || tags.natural === 'water' || tags.leisure === 'marina') return 'waterfront';
  if (tags.public_transport || tags.railway === 'station' || tags.station === 'subway') return 'transit';
  if (tags.historic || tags.architecture || tags.building) return 'architecture';
  return null;
}

function moodsForCategory(category: Interest) {
  if (category === 'cafes') return ['coffee', 'energetic'] as const;
  if (category === 'parks') return ['green', 'calm', 'scenic'] as const;
  if (category === 'waterfront' || category === 'viewpoints') return ['scenic', 'green'] as const;
  if (category === 'churches' || category === 'architecture') return ['historic', 'calm'] as const;
  return ['calm'] as const;
}

export function normalizeOverpassElement(element: OverpassElement): POI | null {
  const tags = element.tags ?? {};
  const category = categoryFromTags(tags);
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;

  if (
    !category ||
    typeof lat !== 'number' ||
    !Number.isFinite(lat) ||
    typeof lng !== 'number' ||
    !Number.isFinite(lng)
  ) {
    return null;
  }

  const osmType = element.type ?? 'element';
  const typedOsmId = `${osmType}/${element.id}`;

  return {
    id: `osm-${osmType}-${element.id}`,
    cityId: 'montreal',
    name: tags.name ?? `${category} POI`,
    category,
    coordinate: { lat, lng },
    source: 'osm-overpass',
    sourceOsmId: typedOsmId,
    moods: [...moodsForCategory(category)],
    interestTags: [category],
    computedRouteValue: tags.name ? 62 : 42,
    openingHours: tags.opening_hours,
    metadata: {
      sourceLicense: 'ODbL',
      rawAmenity: tags.amenity ?? '',
      rawTourism: tags.tourism ?? '',
      rawLeisure: tags.leisure ?? '',
    },
    lastImportedAt: new Date().toISOString(),
  };
}

export function normalizeOverpassElements(elements: OverpassElement[]): POI[] {
  return elements
    .map(normalizeOverpassElement)
    .filter((poi): poi is POI => Boolean(poi));
}
