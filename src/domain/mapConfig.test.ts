import { describe, expect, it } from 'vitest';
import { buildMapTilerStyleUrl } from './mapConfig';

describe('map config', () => {
  it('builds the shared MapTiler streets style URL with an encoded browser key', () => {
    expect(buildMapTilerStyleUrl('map key/with spaces')).toBe(
      'https://api.maptiler.com/maps/streets-v2/style.json?key=map%20key%2Fwith%20spaces',
    );
  });
});
