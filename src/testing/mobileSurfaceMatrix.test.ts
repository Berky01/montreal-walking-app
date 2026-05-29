import { describe, expect, it } from 'vitest';
import { formatSurfacePlan, getMobileSurfacePlan, mobileSurfaceMatrix } from './mobileSurfaceMatrix';

describe('mobile surface test matrix', () => {
  it('centralizes every app surface we use for mobile validation', () => {
    expect(Object.keys(mobileSurfaceMatrix)).toEqual([
      'unit',
      'unraid-production',
      'desktop-browser',
      'iphone-safari',
      'android-emulator-browser',
    ]);
  });

  it('keeps Unraid as the only hosted app address', () => {
    expect(mobileSurfaceMatrix['unraid-production'].open).toBe('http://<unraid-lan-ip>:8080');
    expect(mobileSurfaceMatrix['desktop-browser'].open).toBe('http://<unraid-lan-ip>:8080');
    expect(mobileSurfaceMatrix['iphone-safari'].open).toBe('http://<unraid-lan-ip>:8080');
    expect(mobileSurfaceMatrix['android-emulator-browser'].open).toBe('http://<unraid-lan-ip>:8080');
  });

  it('formats a focused plan with start, open, and verify commands', () => {
    const plan = getMobileSurfacePlan(['unraid-production']);

    expect(formatSurfacePlan(plan)).toContain('docker compose up -d --build');
    expect(formatSurfacePlan(plan)).toContain('http://<unraid-lan-ip>:8080');
    expect(formatSurfacePlan(plan)).toContain('/api/health/providers');
  });
});
