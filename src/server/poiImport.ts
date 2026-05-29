import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { normalizeOverpassElements, type OverpassElement } from '../domain/providers/overpassPOIImporter';
import { fetchWithTimeout } from '../domain/providers/fetchWithTimeout';
import { seedPois } from '../domain/seedPois';
import type { POI } from '../domain/mvpTypes';

const overpassImports = [
  { id: 'cafes', selector: 'nwr["amenity"="cafe"]' },
  { id: 'public-toilets', selector: 'nwr["amenity"="toilets"]' },
  { id: 'churches', selector: 'nwr["amenity"="place_of_worship"]' },
  { id: 'viewpoints', selector: 'nwr["tourism"="viewpoint"]' },
  { id: 'parks', selector: 'nwr["leisure"="park"]' },
  { id: 'waterfront-waterway', selector: 'nwr["waterway"~"^(river|canal)$"]' },
  { id: 'waterfront-natural', selector: 'nwr["natural"="water"]' },
  { id: 'transit', selector: 'nwr["railway"~"^(station|halt|tram_stop)$"]' },
  { id: 'architecture', selector: 'nwr["historic"]' },
] as const;

function overpassQuery(selector: string, limit: number) {
  return `
[out:json][timeout:25];
area(3601634158)->.searchArea;
(
  ${selector}(area.searchArea);
);
out tags center qt ${limit};
`;
}

export interface POICacheStatus {
  configured: boolean;
  cacheAvailable: boolean;
  cachePath: string | null;
  count: number;
  importedAt: string | null;
  source: string | null;
  sourceLicense: string | null;
  categoryCounts: Record<string, number>;
}

interface POICacheFile {
  importedAt?: string;
  source?: string;
  sourceLicense?: string;
  categoryCounts?: Record<string, number>;
  pois?: POI[];
}

function parsePOICache(contents: string): POI[] | POICacheFile {
  return JSON.parse(contents) as POI[] | POICacheFile;
}

function hasUsableCoordinate(poi: POI) {
  return Number.isFinite(poi.coordinate.lat) && Number.isFinite(poi.coordinate.lng);
}

function usablePOIs(pois: POI[]) {
  return pois.filter(hasUsableCoordinate);
}

export function getPOICacheStatus(cachePath?: string): POICacheStatus {
  if (!cachePath) {
    return {
      configured: false,
      cacheAvailable: false,
      cachePath: null,
      count: 0,
      importedAt: null,
      source: null,
      sourceLicense: null,
      categoryCounts: {},
    };
  }

  if (!existsSync(cachePath)) {
    return {
      configured: true,
      cacheAvailable: false,
      cachePath,
      count: 0,
      importedAt: null,
      source: null,
      sourceLicense: null,
      categoryCounts: {},
    };
  }

  try {
    const parsed = parsePOICache(readFileSync(cachePath, 'utf8'));
    const pois = usablePOIs(Array.isArray(parsed) ? parsed : parsed.pois ?? []);

    return {
      configured: true,
      cacheAvailable: true,
      cachePath,
      count: pois.length,
      importedAt: Array.isArray(parsed) ? null : parsed.importedAt ?? null,
      source: Array.isArray(parsed) ? null : parsed.source ?? null,
      sourceLicense: Array.isArray(parsed) ? null : parsed.sourceLicense ?? null,
      categoryCounts: categoryCounts(pois),
    };
  } catch {
    return {
      configured: true,
      cacheAvailable: false,
      cachePath,
      count: 0,
      importedAt: null,
      source: null,
      sourceLicense: null,
      categoryCounts: {},
    };
  }
}

export async function readPOICache(cachePath?: string): Promise<POI[]> {
  if (!cachePath) return seedPois;

  try {
    const contents = await readFile(cachePath, 'utf8');
    const parsed = parsePOICache(contents);

    const pois = usablePOIs(Array.isArray(parsed) ? parsed : parsed.pois ?? []);

    return pois.length > 0 ? pois : seedPois;
  } catch {
    return seedPois;
  }
}

export async function writePOICache(cachePath: string, pois: POI[]) {
  const cachePois = usablePOIs(pois);

  await mkdir(dirname(cachePath), { recursive: true });
  await writeFile(cachePath, JSON.stringify({
    importedAt: new Date().toISOString(),
    source: 'overpass-api',
    sourceLicense: 'ODbL',
    categoryCounts: categoryCounts(cachePois),
    pois: cachePois,
  }, null, 2));
}

function categoryCounts(pois: POI[]) {
  return pois.reduce<Record<string, number>>((counts, poi) => {
    counts[poi.category] = (counts[poi.category] ?? 0) + 1;

    return counts;
  }, {});
}

function dedupePOIs(pois: POI[]) {
  return [...new Map(pois.map((poi) => [poi.id, poi])).values()];
}

export async function importOverpassPOIs(options: {
  cachePath?: string;
  fetcher?: typeof fetch;
  limitPerCategory?: number;
  timeoutMs?: number;
}): Promise<{ imported: number; source: string; cached: boolean; pois: POI[]; categoryCounts: Record<string, number>; importErrors: string[] }> {
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const importedPois: POI[] = [];
  const importErrors: string[] = [];

  for (const importSpec of overpassImports) {
    let response: Response;

    try {
      response = await fetchWithTimeout(
        fetcher,
        'https://overpass-api.de/api/interpreter',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'user-agent': 'MontrealWalkingMVP/0.1 local-development',
          },
          body: new URLSearchParams({ data: overpassQuery(importSpec.selector, options.limitPerCategory ?? 650) }),
        },
        timeoutMs,
        `Overpass POI import timed out after ${timeoutMs}ms.`,
      );
    } catch (error) {
      importErrors.push(`${importSpec.id}: ${error instanceof Error ? error.message : 'Overpass request failed'}`);
      continue;
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');

      importErrors.push(`${importSpec.id}: ${response.status}${errorText ? ` ${errorText.slice(0, 120)}` : ''}`);
      continue;
    }

    const data = await response.json() as { elements?: OverpassElement[] };

    importedPois.push(...normalizeOverpassElements(data.elements ?? []));
  }

  const pois = dedupePOIs(importedPois);

  if (pois.length === 0 && importErrors.length > 0) {
    throw new Error(`Overpass POI import failed: ${importErrors.join('; ')}`);
  }

  const shouldWriteCache = Boolean(options.cachePath) && importErrors.length === 0;

  if (shouldWriteCache && options.cachePath) {
    await writePOICache(options.cachePath, pois);
  }

  return {
    imported: pois.length,
    source: 'overpass-api',
    cached: shouldWriteCache,
    pois,
    categoryCounts: categoryCounts(pois),
    importErrors,
  };
}
