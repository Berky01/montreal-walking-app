import { describe, expect, it } from 'vitest';
import { supportedInterests } from '../domain/walkOptions';
import { runPOIImportCli } from './poiImportCli';

describe('POI import CLI', () => {
  it('imports POIs into the configured cache path and reports ready coverage', async () => {
    const lines: string[] = [];
    const categoryCounts = Object.fromEntries(supportedInterests.map((category) => [category, 1]));
    const result = await runPOIImportCli({
      env: { POI_CACHE_PATH: 'tmp/montreal-pois.json' },
      log: (line) => lines.push(line),
      importer: async (options) => {
        expect(options.cachePath).toBe('tmp/montreal-pois.json');

        return {
          imported: supportedInterests.length,
          source: 'overpass-api',
          cached: true,
          pois: [],
          categoryCounts,
        };
      },
    });

    expect(result.exitCode).toBe(0);
    expect(lines).toContain(`Imported ${supportedInterests.length} POIs from overpass-api.`);
    expect(lines).toContain('POI coverage ready for all MVP interests.');
  });

  it('returns a non-zero exit code when imported POIs miss MVP categories', async () => {
    const lines: string[] = [];
    const result = await runPOIImportCli({
      env: { POI_CACHE_PATH: 'tmp/montreal-pois.json' },
      log: (line) => lines.push(line),
      importer: async () => ({
        imported: 1,
        source: 'overpass-api',
        cached: true,
        pois: [],
        categoryCounts: { cafes: 1 },
      }),
    });

    expect(result.exitCode).toBe(1);
    expect(lines).toContain('Imported 1 POIs from overpass-api.');
    expect(lines).toContain('Missing POI categories: parks, architecture, churches, viewpoints, waterfront, public-toilets, transit');
  });

  it('maps container /app/data cache paths to APP_DATA_DIR when running on the host', async () => {
    const categoryCounts = Object.fromEntries(supportedInterests.map((category) => [category, 1]));
    const result = await runPOIImportCli({
      env: {
        APP_DATA_DIR: '/mnt/user/appdata/walking-app',
        POI_CACHE_PATH: '/app/data/montreal-pois.json',
      },
      log: () => undefined,
      importer: async (options) => {
        expect(options.cachePath).toBe('/mnt/user/appdata/walking-app/montreal-pois.json');

        return {
          imported: supportedInterests.length,
          source: 'overpass-api',
          cached: true,
          pois: [],
          categoryCounts,
        };
      },
    });

    expect(result.exitCode).toBe(0);
  });

  it('returns a non-zero exit code and logs partial Overpass import errors', async () => {
    const lines: string[] = [];
    const categoryCounts = Object.fromEntries(supportedInterests.map((category) => [category, 1]));
    const result = await runPOIImportCli({
      env: { POI_CACHE_PATH: 'tmp/montreal-pois.json' },
      log: (line) => lines.push(line),
      importer: async () => ({
        imported: supportedInterests.length,
        source: 'overpass-api',
        cached: true,
        pois: [],
        categoryCounts,
        importErrors: ['parks: 429 rate limited'],
      }),
    });

    expect(result.exitCode).toBe(1);
    expect(lines).toContain('POI import errors: parks: 429 rate limited');
  });
});
