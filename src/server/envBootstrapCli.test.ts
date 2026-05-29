import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { bootstrapEnvFile } from './envBootstrapCli';

const exampleEnv = [
  'FRONTEND_PORT=8080',
  'POSTGRES_PASSWORD=replace-with-a-long-password',
  'ADMIN_TOKEN=replace-with-a-long-admin-token',
  'MAPTILER_API_KEY=',
  'MAPBOX_ACCESS_TOKEN=',
  'GEOAPIFY_API_KEY=',
].join('\n');

describe('environment bootstrap', () => {
  it('creates a .env from .env.example with generated local secrets', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'walking-env-bootstrap-'));
    const examplePath = join(dir, '.env.example');
    const envPath = join(dir, '.env');

    await writeFile(examplePath, exampleEnv);

    const result = await bootstrapEnvFile({
      examplePath,
      envPath,
      secretFactory: (name) => `generated-${name}`,
    });

    const env = await readFile(envPath, 'utf8');

    expect(result).toEqual({
      changed: true,
      created: true,
      envPath,
      updatedKeys: ['POSTGRES_PASSWORD', 'ADMIN_TOKEN'],
      missingProviderKeys: ['MAPTILER_API_KEY', 'MAPBOX_ACCESS_TOKEN', 'GEOAPIFY_API_KEY'],
    });
    expect(env).toContain('POSTGRES_PASSWORD=generated-POSTGRES_PASSWORD');
    expect(env).toContain('ADMIN_TOKEN=generated-ADMIN_TOKEN');
    expect(env).toContain('MAPTILER_API_KEY=');
    expect(env).toContain('MAPBOX_ACCESS_TOKEN=');
    expect(env).toContain('GEOAPIFY_API_KEY=');
  });

  it('repairs only placeholder local secrets in an existing .env', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'walking-env-repair-'));
    const examplePath = join(dir, '.env.example');
    const envPath = join(dir, '.env');

    await writeFile(examplePath, exampleEnv);
    await writeFile(envPath, [
      'POSTGRES_PASSWORD=replace-with-a-long-password',
      'ADMIN_TOKEN=custom-admin-token',
      'MAPTILER_API_KEY=existing-map-key',
      'GEOAPIFY_API_KEY=existing-geo-key',
    ].join('\n'));

    const result = await bootstrapEnvFile({
      examplePath,
      envPath,
      secretFactory: (name) => `generated-${name}`,
    });

    const env = await readFile(envPath, 'utf8');

    expect(result).toEqual({
      changed: true,
      created: false,
      envPath,
      updatedKeys: ['POSTGRES_PASSWORD'],
      missingProviderKeys: ['MAPBOX_ACCESS_TOKEN'],
    });
    expect(env).toContain('POSTGRES_PASSWORD=generated-POSTGRES_PASSWORD');
    expect(env).toContain('ADMIN_TOKEN=custom-admin-token');
    expect(env).toContain('MAPTILER_API_KEY=existing-map-key');
    expect(env).toContain('GEOAPIFY_API_KEY=existing-geo-key');
  });

  it('reports missing live provider keys even when local secrets are already configured', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'walking-env-missing-providers-'));
    const examplePath = join(dir, '.env.example');
    const envPath = join(dir, '.env');

    await writeFile(examplePath, exampleEnv);
    await writeFile(envPath, [
      'POSTGRES_PASSWORD=custom-password',
      'ADMIN_TOKEN=custom-admin-token',
      'MAPTILER_API_KEY=',
      'MAPBOX_ACCESS_TOKEN=mapbox-token',
      'GEOAPIFY_API_KEY=',
    ].join('\n'));

    const result = await bootstrapEnvFile({
      examplePath,
      envPath,
      secretFactory: (name) => `generated-${name}`,
    });

    expect(result).toEqual({
      changed: false,
      created: false,
      envPath,
      updatedKeys: [],
      missingProviderKeys: ['MAPTILER_API_KEY', 'GEOAPIFY_API_KEY'],
    });
  });

  it('reports placeholder live provider keys as missing', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'walking-env-placeholder-providers-'));
    const examplePath = join(dir, '.env.example');
    const envPath = join(dir, '.env');

    await writeFile(examplePath, exampleEnv);
    await writeFile(envPath, [
      'POSTGRES_PASSWORD=custom-password',
      'ADMIN_TOKEN=custom-admin-token',
      'MAPTILER_API_KEY=replace-with-maptiler-key',
      'MAPBOX_ACCESS_TOKEN=mapbox-token-here',
      'GEOAPIFY_API_KEY=your-geoapify-api-key',
    ].join('\n'));

    const result = await bootstrapEnvFile({
      examplePath,
      envPath,
      secretFactory: (name) => `generated-${name}`,
    });

    expect(result).toEqual({
      changed: false,
      created: false,
      envPath,
      updatedKeys: [],
      missingProviderKeys: ['MAPTILER_API_KEY', 'MAPBOX_ACCESS_TOKEN', 'GEOAPIFY_API_KEY'],
    });
  });
});
