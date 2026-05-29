import { describe, expect, it } from 'vitest';
import { isPlaceholderProviderValue, usableProviderEnvValue } from './envValidation';

describe('environment validation', () => {
  it('identifies provider-key placeholders used by setup docs and examples', () => {
    expect(isPlaceholderProviderValue('replace-with-maptiler-key')).toBe(true);
    expect(isPlaceholderProviderValue('your-geoapify-api-key')).toBe(true);
    expect(isPlaceholderProviderValue('mapbox-token-here')).toBe(true);
    expect(isPlaceholderProviderValue('pk.live-value')).toBe(false);
  });

  it('returns only trimmed non-placeholder provider values', () => {
    expect(usableProviderEnvValue({ MAPTILER_API_KEY: ' replace-with-maptiler-key ' }, 'MAPTILER_API_KEY')).toBe('');
    expect(usableProviderEnvValue({ MAPTILER_API_KEY: ' real-map-key ' }, 'MAPTILER_API_KEY')).toBe('real-map-key');
    expect(usableProviderEnvValue({}, 'MAPTILER_API_KEY')).toBe('');
  });
});
