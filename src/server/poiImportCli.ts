import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { importOverpassPOIs } from './poiImport';
import { poiCoverageFor } from './providerFactory';
import type { POI } from '../domain/mvpTypes';

type ImportResult = {
  imported: number;
  source: string;
  cached: boolean;
  pois: POI[];
  categoryCounts: Record<string, number>;
  importErrors?: string[];
};

type POIImporter = (options: {
  cachePath?: string;
  limitPerCategory?: number;
}) => Promise<ImportResult>;

interface POIImportCliOptions {
  env?: Record<string, string | undefined>;
  log?: (line: string) => void;
  importer?: POIImporter;
}

function positiveInteger(value: string | undefined) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function importCachePathFor(env: Record<string, string | undefined>) {
  const cachePath = env.POI_CACHE_PATH?.trim() || 'data/montreal-pois.json';
  const appDataDir = env.APP_DATA_DIR?.trim();

  if (appDataDir && cachePath === '/app/data') return appDataDir;
  if (appDataDir && cachePath.startsWith('/app/data/')) {
    return `${appDataDir.replace(/[\\/]+$/, '')}/${cachePath.slice('/app/data/'.length)}`;
  }

  return cachePath;
}

export async function runPOIImportCli(options: POIImportCliOptions = {}) {
  const env = options.env ?? process.env;
  const log = options.log ?? console.log;
  const importer = options.importer ?? importOverpassPOIs;
  const cachePath = importCachePathFor(env);

  try {
    const result = await importer({
      cachePath,
      limitPerCategory: positiveInteger(env.POI_IMPORT_LIMIT_PER_CATEGORY),
    });
    const coverage = poiCoverageFor(result.categoryCounts);

    log(`Imported ${result.imported} POIs from ${result.source}.`);
    log(`Cache ${result.cached ? 'written' : 'not written'} at ${cachePath}.`);

    if (result.importErrors && result.importErrors.length > 0) {
      log(`POI import errors: ${result.importErrors.join('; ')}`);
      return { exitCode: 1, result, coverage };
    }

    if (coverage.coverageReady) {
      log('POI coverage ready for all MVP interests.');
      return { exitCode: 0, result, coverage };
    }

    log(`Missing POI categories: ${coverage.missingCategories.join(', ')}`);
    return { exitCode: 1, result, coverage };
  } catch (error) {
    log(error instanceof Error ? error.message : 'POI import failed.');
    return { exitCode: 1, result: null, coverage: null };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runPOIImportCli();

  process.exitCode = result.exitCode;
}
