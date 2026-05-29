import { describe, expect, it } from 'vitest';
import { montrealCityProfile } from './cityProfiles';
import { parseCoordinateInput, parseStartInput } from './startInput';

describe('start input parsing', () => {
  it('turns latitude and longitude text into a Montréal start place', () => {
    expect(parseCoordinateInput('45.5234, -73.5996', montrealCityProfile)).toEqual({
      id: 'coordinate-45.5234--73.5996',
      label: '45.5234, -73.5996',
      coordinate: { lat: 45.5234, lng: -73.5996 },
    });
  });

  it('rejects coordinate text outside city bounds', () => {
    expect(parseCoordinateInput('43.6532, -79.3832', montrealCityProfile)).toBeNull();
  });

  it('distinguishes out-of-bounds coordinate text from ordinary address text', () => {
    expect(parseStartInput('43.6532, -79.3832', montrealCityProfile)).toEqual({
      kind: 'invalid-coordinate',
      error: 'Coordinates must be inside Montréal.',
    });
    expect(parseStartInput('Mile End', montrealCityProfile)).toEqual({
      kind: 'address',
    });
  });

  it('ignores ordinary address text', () => {
    expect(parseCoordinateInput('Mile End', montrealCityProfile)).toBeNull();
  });
});
