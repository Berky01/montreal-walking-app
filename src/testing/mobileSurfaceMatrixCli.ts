import { formatSurfacePlan, getMobileSurfacePlan, mobileSurfaceMatrix } from './mobileSurfaceMatrix';
import type { MobileSurfaceKey } from './mobileSurfaceMatrix';

function parseSurfaces(argv: string[]) {
  const surfaceFlagIndex = argv.findIndex((arg) => arg === '--surface' || arg === '--surfaces');
  if (surfaceFlagIndex === -1) return Object.keys(mobileSurfaceMatrix) as MobileSurfaceKey[];

  const value = argv[surfaceFlagIndex + 1];
  if (!value || value === 'all') return Object.keys(mobileSurfaceMatrix) as MobileSurfaceKey[];

  const keys = value.split(',').map((item) => item.trim()).filter(Boolean) as MobileSurfaceKey[];
  const unknown = keys.filter((key) => !mobileSurfaceMatrix[key]);
  if (unknown.length > 0) {
    throw new Error(`Unknown mobile test surface: ${unknown.join(', ')}`);
  }

  return keys;
}

try {
  const surfaces = parseSurfaces(process.argv.slice(2));
  console.log(formatSurfacePlan(getMobileSurfacePlan(surfaces)));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
